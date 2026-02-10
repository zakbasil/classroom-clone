using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ClassroomClone.Api.Data;
using ClassroomClone.Api.Models;
using ClassroomClone.Api.DTOs;
using ClassroomClone.Api.Extensions;
using static ClassroomClone.Api.Models.UserRole;

namespace ClassroomClone.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TemplatesController : ControllerBase
{
    private readonly AppDbContext _db;
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

    public TemplatesController(AppDbContext db) => _db = db;

    // Quiz Templates
    [HttpGet("quizzes")]
    public async Task<ActionResult<List<QuizTemplateResponse>>> GetQuizTemplates(CancellationToken ct)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();

        // Check if user is admin
        var profile = await _db.Profiles.FirstOrDefaultAsync(p => p.UserId == userId, ct);
        var isAdmin = profile?.Role == Admin;

        // Get published templates (accessible by all teachers) + personal templates (created by current user)
        // Admins see all templates
        var templates = isAdmin
            ? await _db.QuizTemplates
                .OrderByDescending(t => t.Status == TemplateStatus.Published)
                .ThenByDescending(t => t.CreatedAt)
                .ToListAsync(ct)
            : await _db.QuizTemplates
                .Where(t => t.Status == TemplateStatus.Published || t.CreatedBy == userId)
                .OrderByDescending(t => t.Status == TemplateStatus.Published) // Published templates first
                .ThenByDescending(t => t.CreatedAt)
                .ToListAsync(ct);

        var result = templates.Select(t => new QuizTemplateResponse(
            t.Id.ToString(),
            t.Title,
            t.Description,
            t.Topic,
            JsonSerializer.Deserialize<List<QuestionDto>>(t.QuestionsJson, JsonOptions) ?? new List<QuestionDto>(),
            t.TotalPoints,
            t.RequireFullscreen,
            t.TimeLimit,
            t.Status.ToString()
        )).ToList();

        return Ok(result);
    }

    [HttpGet("quizzes/personal")]
    public async Task<ActionResult<List<QuizTemplateResponse>>> GetPersonalQuizTemplates(CancellationToken ct)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();

        // Get only personal templates created by the current user
        var templates = await _db.QuizTemplates
            .Where(t => t.CreatedBy == userId)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync(ct);

        var result = templates.Select(t => new QuizTemplateResponse(
            t.Id.ToString(),
            t.Title,
            t.Description,
            t.Topic,
            JsonSerializer.Deserialize<List<QuestionDto>>(t.QuestionsJson, JsonOptions) ?? new List<QuestionDto>(),
            t.TotalPoints,
            t.RequireFullscreen,
            t.TimeLimit,
            t.Status.ToString()
        )).ToList();

        return Ok(result);
    }

    [HttpPost("quizzes")]
    public async Task<ActionResult<QuizTemplateResponse>> CreateQuizTemplate([FromBody] CreateQuizTemplateRequest req, CancellationToken ct)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();

        // Check if user is admin (admins can directly publish templates)
        var profile = await _db.Profiles.FirstOrDefaultAsync(p => p.UserId == userId, ct);
        var isAdmin = profile?.Role == Admin;
        var shouldPublish = req.Publish == true && isAdmin; // Only admins can directly publish

        var template = new QuizTemplate
        {
            Id = Guid.NewGuid(),
            CreatedBy = userId.Value,
            Title = req.Title,
            Description = req.Description,
            Topic = req.Topic,
            QuestionsJson = JsonSerializer.Serialize(req.Questions ?? new List<QuestionDto>(), JsonOptions),
            TotalPoints = req.TotalPoints,
            RequireFullscreen = req.RequireFullscreen,
            TimeLimit = req.TimeLimit,
            Status = shouldPublish ? TemplateStatus.Published : TemplateStatus.Draft, // Admins can directly publish
            IsApproved = shouldPublish, // Keep for backward compatibility
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.QuizTemplates.Add(template);
        await _db.SaveChangesAsync(ct);

        return Ok(new QuizTemplateResponse(
            template.Id.ToString(),
            template.Title,
            template.Description,
            template.Topic,
            req.Questions ?? new List<QuestionDto>(),
            template.TotalPoints,
            template.RequireFullscreen,
            template.TimeLimit,
            template.Status.ToString()
        ));
    }

    [HttpPost("quizzes/{id:guid}/request-approval")]
    public async Task<IActionResult> RequestApprovalQuizTemplate(Guid id, CancellationToken ct)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();

        var template = await _db.QuizTemplates.FirstOrDefaultAsync(t => t.Id == id, ct);
        if (template == null) return NotFound();

        // Check if user is creator
        if (template.CreatedBy != userId) return Forbid();

        // Check if user is admin (admins can directly publish)
        var profile = await _db.Profiles.FirstOrDefaultAsync(p => p.UserId == userId, ct);
        var isAdmin = profile?.Role == Admin;

        if (isAdmin)
        {
            // Admin can directly publish
            template.Status = TemplateStatus.Published;
            template.IsApproved = true;
            template.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
            return Ok(new { message = "Template published successfully" });
        }

        // Teacher requests approval
        if (template.Status == TemplateStatus.Draft || template.Status == TemplateStatus.Rejected)
        {
            template.Status = TemplateStatus.PendingApproval;
            template.UpdatedAt = DateTime.UtcNow;

            // Create approval history record
            var history = new TemplateApprovalHistory
            {
                Id = Guid.NewGuid(),
                TemplateType = TemplateType.Quiz,
                TemplateId = template.Id,
                CreatedBy = userId.Value,
                Status = ApprovalStatus.Pending,
                CreatedAt = DateTime.UtcNow,
                ReviewedAt = DateTime.UtcNow
            };
            _db.TemplateApprovalHistories.Add(history);

            await _db.SaveChangesAsync(ct);
            return Ok(new { message = "Template submitted for approval" });
        }

        return BadRequest(new { message = "Template is already pending approval or published" });
    }

    [HttpPost("quizzes/{id:guid}/publish")]
    public async Task<IActionResult> PublishQuizTemplate(Guid id, CancellationToken ct)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();

        var template = await _db.QuizTemplates.FirstOrDefaultAsync(t => t.Id == id, ct);
        if (template == null) return NotFound();

        // Check if user is creator
        if (template.CreatedBy != userId) return Forbid();

        // Only approved templates can be published
        if (template.Status != TemplateStatus.Approved)
        {
            return BadRequest(new { message = "Template must be approved before publishing" });
        }

        template.Status = TemplateStatus.Published;
        template.IsApproved = true;
        template.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        return Ok(new { message = "Template published successfully" });
    }

    [HttpGet("quizzes/{id:guid}")]
    public async Task<ActionResult<QuizTemplateResponse>> GetQuizTemplate(Guid id, CancellationToken ct)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();

        var template = await _db.QuizTemplates.FirstOrDefaultAsync(t => t.Id == id, ct);
        if (template == null) return NotFound();

        // Check if user can access this template (approved or creator)
        var profile = await _db.Profiles.FirstOrDefaultAsync(p => p.UserId == userId, ct);
        var isAdmin = profile?.Role == Admin;
        var isCreator = template.CreatedBy == userId;
        var isApproved = template.IsApproved;

        if (!isAdmin && !isCreator && !isApproved) return Forbid();

        return Ok(new QuizTemplateResponse(
            template.Id.ToString(),
            template.Title,
            template.Description,
            template.Topic,
            JsonSerializer.Deserialize<List<QuestionDto>>(template.QuestionsJson, JsonOptions) ?? new List<QuestionDto>(),
            template.TotalPoints,
            template.RequireFullscreen,
            template.TimeLimit,
            template.Status.ToString()
        ));
    }

    [HttpPut("quizzes/{id:guid}")]
    public async Task<ActionResult<QuizTemplateResponse>> UpdateQuizTemplate(Guid id, [FromBody] UpdateQuizTemplateRequest req, CancellationToken ct)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();

        var template = await _db.QuizTemplates.FirstOrDefaultAsync(t => t.Id == id, ct);
        if (template == null) return NotFound();

        // Check if user is admin or creator
        var profile = await _db.Profiles.FirstOrDefaultAsync(p => p.UserId == userId, ct);
        var isAdmin = profile?.Role == Admin;
        var isCreator = template.CreatedBy == userId;

        if (!isAdmin && !isCreator) return Forbid();

        // Update template fields
        template.Title = req.Title;
        template.Description = req.Description;
        template.Topic = req.Topic;
        template.QuestionsJson = JsonSerializer.Serialize(req.Questions ?? new List<QuestionDto>(), JsonOptions);
        template.TotalPoints = req.TotalPoints;
        template.RequireFullscreen = req.RequireFullscreen;
        template.TimeLimit = req.TimeLimit;
        template.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);

        return Ok(new QuizTemplateResponse(
            template.Id.ToString(),
            template.Title,
            template.Description,
            template.Topic,
            req.Questions ?? new List<QuestionDto>(),
            template.TotalPoints,
            template.RequireFullscreen,
            template.TimeLimit,
            template.Status.ToString()
        ));
    }

    [HttpDelete("quizzes/{id:guid}")]
    public async Task<IActionResult> DeleteQuizTemplate(Guid id, CancellationToken ct)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();

        var template = await _db.QuizTemplates.FirstOrDefaultAsync(t => t.Id == id, ct);
        if (template == null) return NotFound();

        // Check if user is admin or creator
        var profile = await _db.Profiles.FirstOrDefaultAsync(p => p.UserId == userId, ct);
        var isAdmin = profile?.Role == Admin;
        var isCreator = template.CreatedBy == userId;

        if (!isAdmin && !isCreator) return Forbid();

        _db.QuizTemplates.Remove(template);
        await _db.SaveChangesAsync(ct);

        return NoContent();
    }

    // Assignment Templates
    [HttpGet("assignments")]
    public async Task<ActionResult<List<AssignmentTemplateResponse>>> GetAssignmentTemplates(CancellationToken ct)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();

        // Check if user is admin
        var profile = await _db.Profiles.FirstOrDefaultAsync(p => p.UserId == userId, ct);
        var isAdmin = profile?.Role == Admin;

        // Get published templates (accessible by all teachers) + personal templates (created by current user)
        // Admins see all templates
        var templates = isAdmin
            ? await _db.AssignmentTemplates
                .OrderByDescending(t => t.Status == TemplateStatus.Published)
                .ThenByDescending(t => t.CreatedAt)
                .ToListAsync(ct)
            : await _db.AssignmentTemplates
                .Where(t => t.Status == TemplateStatus.Published || t.CreatedBy == userId)
                .OrderByDescending(t => t.Status == TemplateStatus.Published) // Published templates first
                .ThenByDescending(t => t.CreatedAt)
                .ToListAsync(ct);

        var result = templates.Select(t => new AssignmentTemplateResponse(
            t.Id.ToString(),
            t.Title,
            t.Description,
            t.Topic,
            t.Points,
            t.Status.ToString()
        )).ToList();

        return Ok(result);
    }

    [HttpGet("assignments/personal")]
    public async Task<ActionResult<List<AssignmentTemplateResponse>>> GetPersonalAssignmentTemplates(CancellationToken ct)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();

        // Get only personal templates created by the current user
        var templates = await _db.AssignmentTemplates
            .Where(t => t.CreatedBy == userId)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync(ct);

        var result = templates.Select(t => new AssignmentTemplateResponse(
            t.Id.ToString(),
            t.Title,
            t.Description,
            t.Topic,
            t.Points,
            t.Status.ToString()
        )).ToList();

        return Ok(result);
    }

    [HttpPost("assignments")]
    public async Task<ActionResult<AssignmentTemplateResponse>> CreateAssignmentTemplate([FromBody] CreateAssignmentTemplateRequest req, CancellationToken ct)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();

        // Check if user is admin (admins can directly publish templates)
        var profile = await _db.Profiles.FirstOrDefaultAsync(p => p.UserId == userId, ct);
        var isAdmin = profile?.Role == Admin;
        var shouldPublish = req.Publish == true && isAdmin; // Only admins can directly publish

        var template = new AssignmentTemplate
        {
            Id = Guid.NewGuid(),
            CreatedBy = userId.Value,
            Title = req.Title,
            Description = req.Description,
            Topic = req.Topic,
            Points = req.Points,
            Status = shouldPublish ? TemplateStatus.Published : TemplateStatus.Draft, // Admins can directly publish
            IsApproved = shouldPublish, // Keep for backward compatibility
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.AssignmentTemplates.Add(template);
        await _db.SaveChangesAsync(ct);

        return Ok(new AssignmentTemplateResponse(
            template.Id.ToString(),
            template.Title,
            template.Description,
            template.Topic,
            template.Points,
            template.Status.ToString()
        ));
    }

    [HttpPost("assignments/{id:guid}/request-approval")]
    public async Task<IActionResult> RequestApprovalAssignmentTemplate(Guid id, CancellationToken ct)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();

        var template = await _db.AssignmentTemplates.FirstOrDefaultAsync(t => t.Id == id, ct);
        if (template == null) return NotFound();

        // Check if user is creator
        if (template.CreatedBy != userId) return Forbid();

        // Check if user is admin (admins can directly publish)
        var profile = await _db.Profiles.FirstOrDefaultAsync(p => p.UserId == userId, ct);
        var isAdmin = profile?.Role == Admin;

        if (isAdmin)
        {
            // Admin can directly publish
            template.Status = TemplateStatus.Published;
            template.IsApproved = true;
            template.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
            return Ok(new { message = "Template published successfully" });
        }

        // Teacher requests approval
        if (template.Status == TemplateStatus.Draft || template.Status == TemplateStatus.Rejected)
        {
            template.Status = TemplateStatus.PendingApproval;
            template.UpdatedAt = DateTime.UtcNow;

            // Create approval history record
            var history = new TemplateApprovalHistory
            {
                Id = Guid.NewGuid(),
                TemplateType = TemplateType.Assignment,
                TemplateId = template.Id,
                CreatedBy = userId.Value,
                Status = ApprovalStatus.Pending,
                CreatedAt = DateTime.UtcNow,
                ReviewedAt = DateTime.UtcNow
            };
            _db.TemplateApprovalHistories.Add(history);

            await _db.SaveChangesAsync(ct);
            return Ok(new { message = "Template submitted for approval" });
        }

        return BadRequest(new { message = "Template is already pending approval or published" });
    }

    [HttpPost("assignments/{id:guid}/publish")]
    public async Task<IActionResult> PublishAssignmentTemplate(Guid id, CancellationToken ct)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();

        var template = await _db.AssignmentTemplates.FirstOrDefaultAsync(t => t.Id == id, ct);
        if (template == null) return NotFound();

        // Check if user is creator
        if (template.CreatedBy != userId) return Forbid();

        // Only approved templates can be published
        if (template.Status != TemplateStatus.Approved)
        {
            return BadRequest(new { message = "Template must be approved before publishing" });
        }

        template.Status = TemplateStatus.Published;
        template.IsApproved = true;
        template.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        return Ok(new { message = "Template published successfully" });
    }

    [HttpGet("assignments/{id:guid}")]
    public async Task<ActionResult<AssignmentTemplateResponse>> GetAssignmentTemplate(Guid id, CancellationToken ct)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();

        var template = await _db.AssignmentTemplates.FirstOrDefaultAsync(t => t.Id == id, ct);
        if (template == null) return NotFound();

        // Check if user can access this template (approved or creator)
        var profile = await _db.Profiles.FirstOrDefaultAsync(p => p.UserId == userId, ct);
        var isAdmin = profile?.Role == Admin;
        var isCreator = template.CreatedBy == userId;
        var isApproved = template.IsApproved;

        if (!isAdmin && !isCreator && !isApproved) return Forbid();

        return Ok(new AssignmentTemplateResponse(
            template.Id.ToString(),
            template.Title,
            template.Description,
            template.Topic,
            template.Points,
            template.Status.ToString()
        ));
    }

    [HttpPut("assignments/{id:guid}")]
    public async Task<ActionResult<AssignmentTemplateResponse>> UpdateAssignmentTemplate(Guid id, [FromBody] UpdateAssignmentTemplateRequest req, CancellationToken ct)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();

        var template = await _db.AssignmentTemplates.FirstOrDefaultAsync(t => t.Id == id, ct);
        if (template == null) return NotFound();

        // Check if user is admin or creator
        var profile = await _db.Profiles.FirstOrDefaultAsync(p => p.UserId == userId, ct);
        var isAdmin = profile?.Role == Admin;
        var isCreator = template.CreatedBy == userId;

        if (!isAdmin && !isCreator) return Forbid();

        // Update template fields
        template.Title = req.Title;
        template.Description = req.Description;
        template.Topic = req.Topic;
        template.Points = req.Points;
        template.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);

        return Ok(new AssignmentTemplateResponse(
            template.Id.ToString(),
            template.Title,
            template.Description,
            template.Topic,
            template.Points,
            template.Status.ToString()
        ));
    }

    [HttpDelete("assignments/{id:guid}")]
    public async Task<IActionResult> DeleteAssignmentTemplate(Guid id, CancellationToken ct)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();

        var template = await _db.AssignmentTemplates.FirstOrDefaultAsync(t => t.Id == id, ct);
        if (template == null) return NotFound();

        // Check if user is admin or creator
        var profile = await _db.Profiles.FirstOrDefaultAsync(p => p.UserId == userId, ct);
        var isAdmin = profile?.Role == Admin;
        var isCreator = template.CreatedBy == userId;

        if (!isAdmin && !isCreator) return Forbid();

        _db.AssignmentTemplates.Remove(template);
        await _db.SaveChangesAsync(ct);

        return NoContent();
    }

    // Material Templates
    [HttpGet("materials")]
    public async Task<ActionResult<List<MaterialTemplateResponse>>> GetMaterialTemplates(CancellationToken ct)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();

        // Check if user is admin
        var profile = await _db.Profiles.FirstOrDefaultAsync(p => p.UserId == userId, ct);
        var isAdmin = profile?.Role == Admin;

        // Get published templates (accessible by all teachers) + personal templates (created by current user)
        // Admins see all templates
        var templates = isAdmin
            ? await _db.MaterialTemplates
                .OrderByDescending(t => t.Status == TemplateStatus.Published)
                .ThenByDescending(t => t.CreatedAt)
                .ToListAsync(ct)
            : await _db.MaterialTemplates
                .Where(t => t.Status == TemplateStatus.Published || t.CreatedBy == userId)
                .OrderByDescending(t => t.Status == TemplateStatus.Published) // Published templates first
                .ThenByDescending(t => t.CreatedAt)
                .ToListAsync(ct);

        var result = templates.Select(t => new MaterialTemplateResponse(
            t.Id.ToString(),
            t.Title,
            t.Description,
            t.Topic,
            t.FileUrl,
            t.LinkUrl,
            t.Status.ToString()
        )).ToList();

        return Ok(result);
    }

    [HttpGet("materials/personal")]
    public async Task<ActionResult<List<MaterialTemplateResponse>>> GetPersonalMaterialTemplates(CancellationToken ct)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();

        // Get only personal templates created by the current user
        var templates = await _db.MaterialTemplates
            .Where(t => t.CreatedBy == userId)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync(ct);

        var result = templates.Select(t => new MaterialTemplateResponse(
            t.Id.ToString(),
            t.Title,
            t.Description,
            t.Topic,
            t.FileUrl,
            t.LinkUrl,
            t.Status.ToString()
        )).ToList();

        return Ok(result);
    }

    [HttpPost("materials")]
    public async Task<ActionResult<MaterialTemplateResponse>> CreateMaterialTemplate([FromBody] CreateMaterialTemplateRequest req, CancellationToken ct)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();

        // Check if user is admin (admins can directly publish templates)
        var profile = await _db.Profiles.FirstOrDefaultAsync(p => p.UserId == userId, ct);
        var isAdmin = profile?.Role == Admin;
        var shouldPublish = req.Publish == true && isAdmin; // Only admins can directly publish

        var template = new MaterialTemplate
        {
            Id = Guid.NewGuid(),
            CreatedBy = userId.Value,
            Title = req.Title,
            Description = req.Description,
            Topic = req.Topic,
            FileUrl = req.FileUrl,
            LinkUrl = req.LinkUrl,
            Status = shouldPublish ? TemplateStatus.Published : TemplateStatus.Draft, // Admins can directly publish
            IsApproved = shouldPublish, // Keep for backward compatibility
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.MaterialTemplates.Add(template);
        await _db.SaveChangesAsync(ct);

        return Ok(new MaterialTemplateResponse(
            template.Id.ToString(),
            template.Title,
            template.Description,
            template.Topic,
            template.FileUrl,
            template.LinkUrl,
            template.Status.ToString()
        ));
    }

    [HttpPost("materials/{id:guid}/request-approval")]
    public async Task<IActionResult> RequestApprovalMaterialTemplate(Guid id, CancellationToken ct)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();

        var template = await _db.MaterialTemplates.FirstOrDefaultAsync(t => t.Id == id, ct);
        if (template == null) return NotFound();

        // Check if user is creator
        if (template.CreatedBy != userId) return Forbid();

        // Check if user is admin (admins can directly publish)
        var profile = await _db.Profiles.FirstOrDefaultAsync(p => p.UserId == userId, ct);
        var isAdmin = profile?.Role == Admin;

        if (isAdmin)
        {
            // Admin can directly publish
            template.Status = TemplateStatus.Published;
            template.IsApproved = true;
            template.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
            return Ok(new { message = "Template published successfully" });
        }

        // Teacher requests approval
        if (template.Status == TemplateStatus.Draft || template.Status == TemplateStatus.Rejected)
        {
            template.Status = TemplateStatus.PendingApproval;
            template.UpdatedAt = DateTime.UtcNow;

            // Create approval history record
            var history = new TemplateApprovalHistory
            {
                Id = Guid.NewGuid(),
                TemplateType = TemplateType.Material,
                TemplateId = template.Id,
                CreatedBy = userId.Value,
                Status = ApprovalStatus.Pending,
                CreatedAt = DateTime.UtcNow,
                ReviewedAt = DateTime.UtcNow
            };
            _db.TemplateApprovalHistories.Add(history);

            await _db.SaveChangesAsync(ct);
            return Ok(new { message = "Template submitted for approval" });
        }

        return BadRequest(new { message = "Template is already pending approval or published" });
    }

    [HttpPost("materials/{id:guid}/publish")]
    public async Task<IActionResult> PublishMaterialTemplate(Guid id, CancellationToken ct)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();

        var template = await _db.MaterialTemplates.FirstOrDefaultAsync(t => t.Id == id, ct);
        if (template == null) return NotFound();

        // Check if user is creator
        if (template.CreatedBy != userId) return Forbid();

        // Only approved templates can be published
        if (template.Status != TemplateStatus.Approved)
        {
            return BadRequest(new { message = "Template must be approved before publishing" });
        }

        template.Status = TemplateStatus.Published;
        template.IsApproved = true;
        template.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        return Ok(new { message = "Template published successfully" });
    }

    [HttpGet("materials/{id:guid}")]
    public async Task<ActionResult<MaterialTemplateResponse>> GetMaterialTemplate(Guid id, CancellationToken ct)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();

        var template = await _db.MaterialTemplates.FirstOrDefaultAsync(t => t.Id == id, ct);
        if (template == null) return NotFound();

        // Check if user can access this template (approved or creator)
        var profile = await _db.Profiles.FirstOrDefaultAsync(p => p.UserId == userId, ct);
        var isAdmin = profile?.Role == Admin;
        var isCreator = template.CreatedBy == userId;
        var isApproved = template.IsApproved;

        if (!isAdmin && !isCreator && !isApproved) return Forbid();

        return Ok(new MaterialTemplateResponse(
            template.Id.ToString(),
            template.Title,
            template.Description,
            template.Topic,
            template.FileUrl,
            template.LinkUrl,
            template.Status.ToString()
        ));
    }

    [HttpPut("materials/{id:guid}")]
    public async Task<ActionResult<MaterialTemplateResponse>> UpdateMaterialTemplate(Guid id, [FromBody] UpdateMaterialTemplateRequest req, CancellationToken ct)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();

        var template = await _db.MaterialTemplates.FirstOrDefaultAsync(t => t.Id == id, ct);
        if (template == null) return NotFound();

        // Check if user is admin or creator
        var profile = await _db.Profiles.FirstOrDefaultAsync(p => p.UserId == userId, ct);
        var isAdmin = profile?.Role == Admin;
        var isCreator = template.CreatedBy == userId;

        if (!isAdmin && !isCreator) return Forbid();

        // Update template fields
        template.Title = req.Title;
        template.Description = req.Description;
        template.Topic = req.Topic;
        template.FileUrl = req.FileUrl;
        template.LinkUrl = req.LinkUrl;
        template.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);

        return Ok(new MaterialTemplateResponse(
            template.Id.ToString(),
            template.Title,
            template.Description,
            template.Topic,
            template.FileUrl,
            template.LinkUrl,
            template.Status.ToString()
        ));
    }

    [HttpDelete("materials/{id:guid}")]
    public async Task<IActionResult> DeleteMaterialTemplate(Guid id, CancellationToken ct)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();

        var template = await _db.MaterialTemplates.FirstOrDefaultAsync(t => t.Id == id, ct);
        if (template == null) return NotFound();

        // Check if user is admin or creator
        var profile = await _db.Profiles.FirstOrDefaultAsync(p => p.UserId == userId, ct);
        var isAdmin = profile?.Role == Admin;
        var isCreator = template.CreatedBy == userId;

        if (!isAdmin && !isCreator) return Forbid();

        _db.MaterialTemplates.Remove(template);
        await _db.SaveChangesAsync(ct);

        return NoContent();
    }
}

public record QuizTemplateResponse(string Id, string Title, string? Description, string? Topic, List<QuestionDto> Questions, int TotalPoints, bool RequireFullscreen, int? TimeLimit, string Status);
public record CreateQuizTemplateRequest(string Title, string? Description, string? Topic, List<QuestionDto>? Questions, int TotalPoints, bool RequireFullscreen, int? TimeLimit, bool? Publish);
public record UpdateQuizTemplateRequest(string Title, string? Description, string? Topic, List<QuestionDto>? Questions, int TotalPoints, bool RequireFullscreen, int? TimeLimit);
public record AssignmentTemplateResponse(string Id, string Title, string? Description, string? Topic, int Points, string Status);
public record CreateAssignmentTemplateRequest(string Title, string? Description, string? Topic, int Points, bool? Publish);
public record UpdateAssignmentTemplateRequest(string Title, string? Description, string? Topic, int Points);
public record MaterialTemplateResponse(string Id, string Title, string? Description, string? Topic, string? FileUrl, string? LinkUrl, string Status);
public record CreateMaterialTemplateRequest(string Title, string? Description, string? Topic, string? FileUrl, string? LinkUrl, bool? Publish);
public record UpdateMaterialTemplateRequest(string Title, string? Description, string? Topic, string? FileUrl, string? LinkUrl);
