using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ClassroomClone.Api.Data;
using ClassroomClone.Api.Models;
using ClassroomClone.Api.Extensions;
using static ClassroomClone.Api.Models.UserRole;

namespace ClassroomClone.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AdminController : ControllerBase
{
    private readonly AppDbContext _db;

    public AdminController(AppDbContext db) => _db = db;

    private async Task<bool> IsAdmin(CancellationToken ct)
    {
        var userId = User.GetUserId();
        if (userId == null) return false;
        var profile = await _db.Profiles.FirstOrDefaultAsync(p => p.UserId == userId, ct);
        return profile?.Role == Admin;
    }

    [HttpGet("users")]
    public async Task<ActionResult<List<UserResponse>>> GetUsers(CancellationToken ct)
    {
        if (!await IsAdmin(ct)) return Forbid();

        var users = await _db.Profiles
            .OrderBy(p => p.CreatedAt)
            .ToListAsync(ct);

        var result = users.Select(p => new UserResponse(
            p.UserId.ToString(),
            p.Name,
            p.Email,
            p.Role.ToString(),
            p.IsApproved,
            p.CreatedAt.ToString("O")
        )).ToList();

        return Ok(result);
    }

    [HttpPost("users/{userId:guid}/approve")]
    public async Task<IActionResult> ApproveUser(Guid userId, CancellationToken ct)
    {
        if (!await IsAdmin(ct)) return Forbid();

        var profile = await _db.Profiles.FirstOrDefaultAsync(p => p.UserId == userId, ct);
        if (profile == null) return NotFound();

        profile.IsApproved = true;
        await _db.SaveChangesAsync(ct);

        return NoContent();
    }

    [HttpPost("users/{userId:guid}/role")]
    public async Task<IActionResult> UpdateUserRole(Guid userId, [FromBody] UpdateRoleRequest req, CancellationToken ct)
    {
        if (!await IsAdmin(ct)) return Forbid();

        var profile = await _db.Profiles.FirstOrDefaultAsync(p => p.UserId == userId, ct);
        if (profile == null) return NotFound();

        if (Enum.TryParse<UserRole>(req.Role, true, out var role))
        {
            profile.Role = role;
            if (role == Admin) profile.IsApproved = true; // Admins are always approved
            await _db.SaveChangesAsync(ct);
            return NoContent();
        }

        return BadRequest(new { message = "Invalid role" });
    }

    [HttpGet("schedules")]
    public async Task<ActionResult<List<ScheduleResponse>>> GetSchedules(CancellationToken ct)
    {
        if (!await IsAdmin(ct)) return Forbid();

        var schedules = await _db.TeacherSchedules
            .Include(s => s.Teacher)
            .Include(s => s.Class)
            .OrderBy(s => s.DayOfWeek)
            .ThenBy(s => s.StartTime)
            .ToListAsync(ct);

        var profiles = await _db.Profiles
            .Where(p => schedules.Select(s => s.TeacherId).Contains(p.UserId))
            .ToDictionaryAsync(p => p.UserId, ct);

        var result = schedules.Select(s => new ScheduleResponse(
            s.Id.ToString(),
            s.TeacherId.ToString(),
            profiles.GetValueOrDefault(s.TeacherId)?.Name ?? "Unknown",
            s.ClassId?.ToString(),
            s.ClassName,
            s.Section,
            s.Subject,
            s.Room,
            s.DayOfWeek.ToString(),
            s.StartTime.ToString("HH:mm"),
            s.EndTime.ToString("HH:mm")
        )).ToList();

        return Ok(result);
    }

    [HttpPost("schedules")]
    public async Task<ActionResult<ScheduleResponse>> CreateSchedule([FromBody] CreateScheduleRequest req, CancellationToken ct)
    {
        if (!await IsAdmin(ct)) return Forbid();

        var teacher = await _db.Users.FirstOrDefaultAsync(u => u.Id == Guid.Parse(req.TeacherId), ct);
        if (teacher == null) return NotFound(new { message = "Teacher not found" });

        // Create class automatically
        var streamCode = GenerateStreamCode();
        var classEntity = new Class
        {
            Id = Guid.NewGuid(),
            Name = req.ClassName,
            Section = req.Section ?? "",
            Subject = req.Subject ?? "",
            Room = req.Room ?? "",
            CreatorId = teacher.Id,
            CoverColor = "bg-primary",
            StreamCode = streamCode,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _db.Classes.Add(classEntity);

        // Create schedule
        var schedule = new TeacherSchedule
        {
            Id = Guid.NewGuid(),
            TeacherId = teacher.Id,
            ClassId = classEntity.Id,
            ClassName = req.ClassName,
            Section = req.Section,
            Subject = req.Subject,
            Room = req.Room,
            DayOfWeek = Enum.Parse<DayOfWeek>(req.DayOfWeek, true),
            StartTime = TimeOnly.Parse(req.StartTime),
            EndTime = TimeOnly.Parse(req.EndTime),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _db.TeacherSchedules.Add(schedule);

        await _db.SaveChangesAsync(ct);

        var profile = await _db.Profiles.FirstOrDefaultAsync(p => p.UserId == teacher.Id, ct);
        return Ok(new ScheduleResponse(
            schedule.Id.ToString(),
            schedule.TeacherId.ToString(),
            profile?.Name ?? "Unknown",
            schedule.ClassId?.ToString(),
            schedule.ClassName,
            schedule.Section,
            schedule.Subject,
            schedule.Room,
            schedule.DayOfWeek.ToString(),
            schedule.StartTime.ToString("HH:mm"),
            schedule.EndTime.ToString("HH:mm")
        ));
    }

    [HttpDelete("schedules/{scheduleId:guid}")]
    public async Task<IActionResult> DeleteSchedule(Guid scheduleId, CancellationToken ct)
    {
        if (!await IsAdmin(ct)) return Forbid();

        var schedule = await _db.TeacherSchedules.FirstOrDefaultAsync(s => s.Id == scheduleId, ct);
        if (schedule == null) return NotFound();

        _db.TeacherSchedules.Remove(schedule);
        await _db.SaveChangesAsync(ct);

        return NoContent();
    }

    // Template Approval Endpoints
    [HttpGet("templates/quizzes")]
    public async Task<ActionResult<List<TemplateResponse>>> GetQuizTemplatesForApproval(CancellationToken ct)
    {
        if (!await IsAdmin(ct)) return Forbid();

        // Get pending approval and approved templates
        var templates = await _db.QuizTemplates
            .Include(t => t.Creator)
            .ThenInclude(u => u!.Profile)
            .Where(t => t.Status == TemplateStatus.PendingApproval || t.Status == TemplateStatus.Approved)
            .OrderByDescending(t => t.Status == TemplateStatus.PendingApproval) // Pending first
            .ThenByDescending(t => t.CreatedAt)
            .ToListAsync(ct);

        var result = templates.Select(t => new TemplateResponse(
            t.Id.ToString(),
            "quiz",
            t.Title,
            t.CreatedBy.ToString(),
            t.Creator?.Profile?.Name ?? "Unknown",
            t.Status == TemplateStatus.Published || t.Status == TemplateStatus.Approved,
            t.CreatedAt.ToString("O")
        )).ToList();

        return Ok(result);
    }

    [HttpGet("templates/quizzes/all")]
    public async Task<ActionResult<List<TemplateResponse>>> GetAllQuizTemplates(CancellationToken ct)
    {
        if (!await IsAdmin(ct)) return Forbid();

        // Get all templates including approved ones
        var templates = await _db.QuizTemplates
            .Include(t => t.Creator)
            .ThenInclude(u => u!.Profile)
            .OrderByDescending(t => t.Status == TemplateStatus.Published)
            .ThenByDescending(t => t.CreatedAt)
            .ToListAsync(ct);

        var result = templates.Select(t => new TemplateResponse(
            t.Id.ToString(),
            "quiz",
            t.Title,
            t.CreatedBy.ToString(),
            t.Creator?.Profile?.Name ?? "Unknown",
            t.Status == TemplateStatus.Published || t.Status == TemplateStatus.Approved,
            t.CreatedAt.ToString("O")
        )).ToList();

        return Ok(result);
    }

    [HttpGet("templates/assignments")]
    public async Task<ActionResult<List<TemplateResponse>>> GetAssignmentTemplatesForApproval(CancellationToken ct)
    {
        if (!await IsAdmin(ct)) return Forbid();

        // Get pending approval and approved templates
        var templates = await _db.AssignmentTemplates
            .Include(t => t.Creator)
            .ThenInclude(u => u!.Profile)
            .Where(t => t.Status == TemplateStatus.PendingApproval || t.Status == TemplateStatus.Approved)
            .OrderByDescending(t => t.Status == TemplateStatus.PendingApproval) // Pending first
            .ThenByDescending(t => t.CreatedAt)
            .ToListAsync(ct);

        var result = templates.Select(t => new TemplateResponse(
            t.Id.ToString(),
            "assignment",
            t.Title,
            t.CreatedBy.ToString(),
            t.Creator?.Profile?.Name ?? "Unknown",
            t.Status == TemplateStatus.Published || t.Status == TemplateStatus.Approved,
            t.CreatedAt.ToString("O")
        )).ToList();

        return Ok(result);
    }

    [HttpGet("templates/assignments/all")]
    public async Task<ActionResult<List<TemplateResponse>>> GetAllAssignmentTemplates(CancellationToken ct)
    {
        if (!await IsAdmin(ct)) return Forbid();

        // Get all templates including approved ones
        var templates = await _db.AssignmentTemplates
            .Include(t => t.Creator)
            .ThenInclude(u => u!.Profile)
            .OrderByDescending(t => t.Status == TemplateStatus.Published)
            .ThenByDescending(t => t.CreatedAt)
            .ToListAsync(ct);

        var result = templates.Select(t => new TemplateResponse(
            t.Id.ToString(),
            "assignment",
            t.Title,
            t.CreatedBy.ToString(),
            t.Creator?.Profile?.Name ?? "Unknown",
            t.Status == TemplateStatus.Published || t.Status == TemplateStatus.Approved,
            t.CreatedAt.ToString("O")
        )).ToList();

        return Ok(result);
    }

    [HttpGet("templates/materials")]
    public async Task<ActionResult<List<TemplateResponse>>> GetMaterialTemplatesForApproval(CancellationToken ct)
    {
        if (!await IsAdmin(ct)) return Forbid();

        // Get pending approval and approved templates
        var templates = await _db.MaterialTemplates
            .Include(t => t.Creator)
            .ThenInclude(u => u!.Profile)
            .Where(t => t.Status == TemplateStatus.PendingApproval || t.Status == TemplateStatus.Approved)
            .OrderByDescending(t => t.Status == TemplateStatus.PendingApproval) // Pending first
            .ThenByDescending(t => t.CreatedAt)
            .ToListAsync(ct);

        var result = templates.Select(t => new TemplateResponse(
            t.Id.ToString(),
            "material",
            t.Title,
            t.CreatedBy.ToString(),
            t.Creator?.Profile?.Name ?? "Unknown",
            t.Status == TemplateStatus.Published || t.Status == TemplateStatus.Approved,
            t.CreatedAt.ToString("O")
        )).ToList();

        return Ok(result);
    }

    [HttpGet("templates/materials/all")]
    public async Task<ActionResult<List<TemplateResponse>>> GetAllMaterialTemplates(CancellationToken ct)
    {
        if (!await IsAdmin(ct)) return Forbid();

        // Get all templates including approved ones
        var templates = await _db.MaterialTemplates
            .Include(t => t.Creator)
            .ThenInclude(u => u!.Profile)
            .OrderByDescending(t => t.Status == TemplateStatus.Published)
            .ThenByDescending(t => t.CreatedAt)
            .ToListAsync(ct);

        var result = templates.Select(t => new TemplateResponse(
            t.Id.ToString(),
            "material",
            t.Title,
            t.CreatedBy.ToString(),
            t.Creator?.Profile?.Name ?? "Unknown",
            t.Status == TemplateStatus.Published || t.Status == TemplateStatus.Approved,
            t.CreatedAt.ToString("O")
        )).ToList();

        return Ok(result);
    }

    [HttpPost("templates/quizzes/{id:guid}/approve")]
    public async Task<IActionResult> ApproveQuizTemplate(Guid id, [FromBody] ApprovalDecisionRequest? req, CancellationToken ct)
    {
        if (!await IsAdmin(ct)) return Forbid();

        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();

        var template = await _db.QuizTemplates.FirstOrDefaultAsync(t => t.Id == id, ct);
        if (template == null) return NotFound();

        // Update template status
        template.Status = TemplateStatus.Approved;
        template.IsApproved = true;
        template.UpdatedAt = DateTime.UtcNow;

        // Update or create approval history
        var history = await _db.TemplateApprovalHistories
            .FirstOrDefaultAsync(h => h.TemplateId == id && h.TemplateType == TemplateType.Quiz && h.Status == ApprovalStatus.Pending, ct);

        if (history != null)
        {
            history.Status = ApprovalStatus.Approved;
            history.ReviewedBy = userId.Value;
            history.ReviewedAt = DateTime.UtcNow;
            history.Comments = req?.Comments;
        }
        else
        {
            history = new TemplateApprovalHistory
            {
                Id = Guid.NewGuid(),
                TemplateType = TemplateType.Quiz,
                TemplateId = id,
                CreatedBy = template.CreatedBy,
                ReviewedBy = userId.Value,
                Status = ApprovalStatus.Approved,
                Comments = req?.Comments,
                CreatedAt = DateTime.UtcNow,
                ReviewedAt = DateTime.UtcNow
            };
            _db.TemplateApprovalHistories.Add(history);
        }

        await _db.SaveChangesAsync(ct);

        return NoContent();
    }

    [HttpPost("templates/quizzes/{id:guid}/reject")]
    public async Task<IActionResult> RejectQuizTemplate(Guid id, [FromBody] ApprovalDecisionRequest? req, CancellationToken ct)
    {
        if (!await IsAdmin(ct)) return Forbid();

        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();

        var template = await _db.QuizTemplates.FirstOrDefaultAsync(t => t.Id == id, ct);
        if (template == null) return NotFound();

        // Update template status
        template.Status = TemplateStatus.Rejected;
        template.IsApproved = false;
        template.UpdatedAt = DateTime.UtcNow;

        // Update or create approval history
        var history = await _db.TemplateApprovalHistories
            .FirstOrDefaultAsync(h => h.TemplateId == id && h.TemplateType == TemplateType.Quiz && h.Status == ApprovalStatus.Pending, ct);

        if (history != null)
        {
            history.Status = ApprovalStatus.Rejected;
            history.ReviewedBy = userId.Value;
            history.ReviewedAt = DateTime.UtcNow;
            history.Comments = req?.Comments;
        }
        else
        {
            history = new TemplateApprovalHistory
            {
                Id = Guid.NewGuid(),
                TemplateType = TemplateType.Quiz,
                TemplateId = id,
                CreatedBy = template.CreatedBy,
                ReviewedBy = userId.Value,
                Status = ApprovalStatus.Rejected,
                Comments = req?.Comments,
                CreatedAt = DateTime.UtcNow,
                ReviewedAt = DateTime.UtcNow
            };
            _db.TemplateApprovalHistories.Add(history);
        }

        await _db.SaveChangesAsync(ct);

        return NoContent();
    }

    [HttpPost("templates/assignments/{id:guid}/approve")]
    public async Task<IActionResult> ApproveAssignmentTemplate(Guid id, [FromBody] ApprovalDecisionRequest? req, CancellationToken ct)
    {
        if (!await IsAdmin(ct)) return Forbid();

        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();

        var template = await _db.AssignmentTemplates.FirstOrDefaultAsync(t => t.Id == id, ct);
        if (template == null) return NotFound();

        // Update template status
        template.Status = TemplateStatus.Approved;
        template.IsApproved = true;
        template.UpdatedAt = DateTime.UtcNow;

        // Update or create approval history
        var history = await _db.TemplateApprovalHistories
            .FirstOrDefaultAsync(h => h.TemplateId == id && h.TemplateType == TemplateType.Assignment && h.Status == ApprovalStatus.Pending, ct);

        if (history != null)
        {
            history.Status = ApprovalStatus.Approved;
            history.ReviewedBy = userId.Value;
            history.ReviewedAt = DateTime.UtcNow;
            history.Comments = req?.Comments;
        }
        else
        {
            history = new TemplateApprovalHistory
            {
                Id = Guid.NewGuid(),
                TemplateType = TemplateType.Assignment,
                TemplateId = id,
                CreatedBy = template.CreatedBy,
                ReviewedBy = userId.Value,
                Status = ApprovalStatus.Approved,
                Comments = req?.Comments,
                CreatedAt = DateTime.UtcNow,
                ReviewedAt = DateTime.UtcNow
            };
            _db.TemplateApprovalHistories.Add(history);
        }

        await _db.SaveChangesAsync(ct);

        return NoContent();
    }

    [HttpPost("templates/assignments/{id:guid}/reject")]
    public async Task<IActionResult> RejectAssignmentTemplate(Guid id, [FromBody] ApprovalDecisionRequest? req, CancellationToken ct)
    {
        if (!await IsAdmin(ct)) return Forbid();

        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();

        var template = await _db.AssignmentTemplates.FirstOrDefaultAsync(t => t.Id == id, ct);
        if (template == null) return NotFound();

        // Update template status
        template.Status = TemplateStatus.Rejected;
        template.IsApproved = false;
        template.UpdatedAt = DateTime.UtcNow;

        // Update or create approval history
        var history = await _db.TemplateApprovalHistories
            .FirstOrDefaultAsync(h => h.TemplateId == id && h.TemplateType == TemplateType.Assignment && h.Status == ApprovalStatus.Pending, ct);

        if (history != null)
        {
            history.Status = ApprovalStatus.Rejected;
            history.ReviewedBy = userId.Value;
            history.ReviewedAt = DateTime.UtcNow;
            history.Comments = req?.Comments;
        }
        else
        {
            history = new TemplateApprovalHistory
            {
                Id = Guid.NewGuid(),
                TemplateType = TemplateType.Assignment,
                TemplateId = id,
                CreatedBy = template.CreatedBy,
                ReviewedBy = userId.Value,
                Status = ApprovalStatus.Rejected,
                Comments = req?.Comments,
                CreatedAt = DateTime.UtcNow,
                ReviewedAt = DateTime.UtcNow
            };
            _db.TemplateApprovalHistories.Add(history);
        }

        await _db.SaveChangesAsync(ct);

        return NoContent();
    }

    [HttpPost("templates/materials/{id:guid}/approve")]
    public async Task<IActionResult> ApproveMaterialTemplate(Guid id, [FromBody] ApprovalDecisionRequest? req, CancellationToken ct)
    {
        if (!await IsAdmin(ct)) return Forbid();

        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();

        var template = await _db.MaterialTemplates.FirstOrDefaultAsync(t => t.Id == id, ct);
        if (template == null) return NotFound();

        // Update template status
        template.Status = TemplateStatus.Approved;
        template.IsApproved = true;
        template.UpdatedAt = DateTime.UtcNow;

        // Update or create approval history
        var history = await _db.TemplateApprovalHistories
            .FirstOrDefaultAsync(h => h.TemplateId == id && h.TemplateType == TemplateType.Material && h.Status == ApprovalStatus.Pending, ct);

        if (history != null)
        {
            history.Status = ApprovalStatus.Approved;
            history.ReviewedBy = userId.Value;
            history.ReviewedAt = DateTime.UtcNow;
            history.Comments = req?.Comments;
        }
        else
        {
            history = new TemplateApprovalHistory
            {
                Id = Guid.NewGuid(),
                TemplateType = TemplateType.Material,
                TemplateId = id,
                CreatedBy = template.CreatedBy,
                ReviewedBy = userId.Value,
                Status = ApprovalStatus.Approved,
                Comments = req?.Comments,
                CreatedAt = DateTime.UtcNow,
                ReviewedAt = DateTime.UtcNow
            };
            _db.TemplateApprovalHistories.Add(history);
        }

        await _db.SaveChangesAsync(ct);

        return NoContent();
    }

    [HttpPost("templates/materials/{id:guid}/reject")]
    public async Task<IActionResult> RejectMaterialTemplate(Guid id, [FromBody] ApprovalDecisionRequest? req, CancellationToken ct)
    {
        if (!await IsAdmin(ct)) return Forbid();

        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();

        var template = await _db.MaterialTemplates.FirstOrDefaultAsync(t => t.Id == id, ct);
        if (template == null) return NotFound();

        // Update template status
        template.Status = TemplateStatus.Rejected;
        template.IsApproved = false;
        template.UpdatedAt = DateTime.UtcNow;

        // Update or create approval history
        var history = await _db.TemplateApprovalHistories
            .FirstOrDefaultAsync(h => h.TemplateId == id && h.TemplateType == TemplateType.Material && h.Status == ApprovalStatus.Pending, ct);

        if (history != null)
        {
            history.Status = ApprovalStatus.Rejected;
            history.ReviewedBy = userId.Value;
            history.ReviewedAt = DateTime.UtcNow;
            history.Comments = req?.Comments;
        }
        else
        {
            history = new TemplateApprovalHistory
            {
                Id = Guid.NewGuid(),
                TemplateType = TemplateType.Material,
                TemplateId = id,
                CreatedBy = template.CreatedBy,
                ReviewedBy = userId.Value,
                Status = ApprovalStatus.Rejected,
                Comments = req?.Comments,
                CreatedAt = DateTime.UtcNow,
                ReviewedAt = DateTime.UtcNow
            };
            _db.TemplateApprovalHistories.Add(history);
        }

        await _db.SaveChangesAsync(ct);

        return NoContent();
    }

    [HttpGet("templates/approval-history")]
    public async Task<ActionResult<List<ApprovalHistoryResponse>>> GetApprovalHistory(CancellationToken ct)
    {
        if (!await IsAdmin(ct)) return Forbid();

        var history = await _db.TemplateApprovalHistories
            .Include(h => h.Creator)
            .ThenInclude(u => u!.Profile)
            .Include(h => h.Reviewer)
            .ThenInclude(u => u!.Profile)
            .OrderByDescending(h => h.ReviewedAt)
            .ThenByDescending(h => h.CreatedAt)
            .ToListAsync(ct);

        var result = history.Select(h => new ApprovalHistoryResponse(
            h.Id.ToString(),
            h.TemplateType.ToString().ToLower(),
            h.TemplateId.ToString(),
            h.CreatedBy.ToString(),
            h.Creator?.Profile?.Name ?? "Unknown",
            h.ReviewedBy?.ToString(),
            h.Reviewer?.Profile?.Name ?? "Pending",
            h.Status.ToString(),
            h.Comments,
            h.CreatedAt.ToString("O"),
            h.ReviewedAt.ToString("O")
        )).ToList();

        return Ok(result);
    }

    private static string GenerateStreamCode()
    {
        var r = new Random();
        var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".ToCharArray();
        var code = new char[7];
        for (int i = 0; i < 7; i++) code[i] = chars[r.Next(chars.Length)];
        return new string(code);
    }
}

public record UserResponse(string UserId, string Name, string Email, string Role, bool IsApproved, string CreatedAt);
public record UpdateRoleRequest(string Role);
public record ScheduleResponse(string Id, string TeacherId, string TeacherName, string? ClassId, string ClassName, string? Section, string? Subject, string? Room, string DayOfWeek, string StartTime, string EndTime);
public record CreateScheduleRequest(string TeacherId, string ClassName, string? Section, string? Subject, string? Room, string DayOfWeek, string StartTime, string EndTime);
public record TemplateResponse(string Id, string Type, string Title, string CreatedBy, string CreatorName, bool IsApproved, string CreatedAt);
public record ApprovalDecisionRequest(string? Comments);
public record ApprovalHistoryResponse(string Id, string TemplateType, string TemplateId, string CreatedBy, string CreatorName, string? ReviewedBy, string ReviewerName, string Status, string? Comments, string CreatedAt, string ReviewedAt);
