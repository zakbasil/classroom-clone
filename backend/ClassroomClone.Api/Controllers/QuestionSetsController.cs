using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ClassroomClone.Api.Data;
using ClassroomClone.Api.Models;
using ClassroomClone.Api.DTOs;
using ClassroomClone.Api.Extensions;

namespace ClassroomClone.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class QuestionSetsController : ControllerBase
{
    private readonly AppDbContext _db;
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

    public QuestionSetsController(AppDbContext db) => _db = db;

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<QuestionSetResponse>> GetById(Guid id, CancellationToken ct)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();

        var q = await _db.QuestionSets.Include(x => x.Class).FirstOrDefaultAsync(x => x.Id == id, ct);
        if (q == null) return NotFound();
        if (q.Class!.CreatorId != userId && !await _db.Enrollments.AnyAsync(e => e.ClassId == q.ClassId && e.UserId == userId, ct))
            return NotFound();

        var questions = JsonSerializer.Deserialize<List<QuestionDto>>(q.QuestionsJson, JsonOptions) ?? new List<QuestionDto>();
        return Ok(new QuestionSetResponse(
            q.Id.ToString(),
            q.ClassId.ToString(),
            q.Title,
            q.Description,
            q.Topic,
            questions,
            q.TotalPoints,
            q.DueDate.ToString("O"),
            q.CreatedAt.ToString("O")
        ));
    }

    [HttpPost]
    public async Task<ActionResult<QuestionSetResponse>> Create([FromBody] CreateQuestionSetRequest req, CancellationToken ct)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();
        if (!await IsCreator(userId.Value, Guid.Parse(req.ClassId), ct)) return Forbid();

        var qsId = Guid.NewGuid();
        var dueDate = DateTime.Parse(req.DueDate);
        var qs = new QuestionSet
        {
            Id = qsId,
            ClassId = Guid.Parse(req.ClassId),
            Title = req.Title,
            Description = req.Description,
            Topic = req.Topic,
            QuestionsJson = JsonSerializer.Serialize(req.Questions ?? new List<QuestionDto>(), JsonOptions),
            TotalPoints = req.TotalPoints,
            DueDate = dueDate,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _db.QuestionSets.Add(qs);
        _db.Assignments.Add(new Models.Assignment
        {
            Id = Guid.NewGuid(),
            ClassId = qs.ClassId,
            Title = req.Title,
            Description = req.Description,
            Points = req.TotalPoints,
            DueDate = dueDate,
            Topic = req.Topic,
            Type = "questions",
            QuestionSetId = qsId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });
        await _db.SaveChangesAsync(ct);

        var questions = req.Questions ?? new List<QuestionDto>();
        return Ok(new QuestionSetResponse(
            qs.Id.ToString(),
            qs.ClassId.ToString(),
            qs.Title,
            qs.Description,
            qs.Topic,
            questions,
            qs.TotalPoints,
            qs.DueDate.ToString("O"),
            qs.CreatedAt.ToString("O")
        ));
    }

    private async Task<bool> IsCreator(Guid userId, Guid classId, CancellationToken ct)
    {
        var c = await _db.Classes.FirstOrDefaultAsync(x => x.Id == classId, ct);
        return c?.CreatorId == userId;
    }
}
