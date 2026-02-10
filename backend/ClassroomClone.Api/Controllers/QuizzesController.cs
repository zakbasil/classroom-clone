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
public class QuizzesController : ControllerBase
{
    private readonly AppDbContext _db;
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

    public QuizzesController(AppDbContext db) => _db = db;

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<QuizResponse>> GetById(Guid id, CancellationToken ct)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();

        var q = await _db.Quizzes.Include(x => x.Class).FirstOrDefaultAsync(x => x.Id == id, ct);
        if (q == null) return NotFound();
        if (q.Class!.CreatorId != userId && !await _db.Enrollments.AnyAsync(e => e.ClassId == q.ClassId && e.UserId == userId, ct))
            return NotFound();

        var questions = JsonSerializer.Deserialize<List<QuestionDto>>(q.QuestionsJson, JsonOptions) ?? new List<QuestionDto>();
        return Ok(new QuizResponse(
            q.Id.ToString(),
            q.ClassId.ToString(),
            q.Title,
            q.Description,
            q.Topic,
            questions,
            q.TotalPoints,
            q.DueDate.ToString("O"),
            q.CreatedAt.ToString("O"),
            q.RequireFullscreen,
            q.TimeLimit
        ));
    }

    [HttpPost]
    public async Task<ActionResult<QuizResponse>> Create([FromBody] CreateQuizRequest req, CancellationToken ct)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();
        if (!await IsCreator(userId.Value, Guid.Parse(req.ClassId), ct)) return Forbid();

        var quizId = Guid.NewGuid();
        var dueDate = DateTime.Parse(req.DueDate);
        var quiz = new Quiz
        {
            Id = quizId,
            ClassId = Guid.Parse(req.ClassId),
            Title = req.Title,
            Description = req.Description,
            Topic = req.Topic,
            QuestionsJson = JsonSerializer.Serialize(req.Questions ?? new List<QuestionDto>(), JsonOptions),
            TotalPoints = req.TotalPoints,
            DueDate = dueDate,
            RequireFullscreen = req.RequireFullscreen,
            TimeLimit = req.TimeLimit,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _db.Quizzes.Add(quiz);
        _db.Assignments.Add(new Models.Assignment
        {
            Id = Guid.NewGuid(),
            ClassId = quiz.ClassId,
            Title = req.Title,
            Description = req.Description,
            Points = req.TotalPoints,
            DueDate = dueDate,
            Topic = req.Topic,
            Type = "quiz",
            QuizId = quizId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });
        await _db.SaveChangesAsync(ct);

        var questions = req.Questions ?? new List<QuestionDto>();
        return Ok(new QuizResponse(
            quiz.Id.ToString(),
            quiz.ClassId.ToString(),
            quiz.Title,
            quiz.Description,
            quiz.Topic,
            questions,
            quiz.TotalPoints,
            quiz.DueDate.ToString("O"),
            quiz.CreatedAt.ToString("O"),
            quiz.RequireFullscreen,
            quiz.TimeLimit
        ));
    }

    [HttpGet("{quizId:guid}/submissions")]
    public async Task<ActionResult<List<QuizSubmissionResponse>>> GetSubmissions(Guid quizId, CancellationToken ct)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();
        var quiz = await _db.Quizzes.Include(q => q.Class).FirstOrDefaultAsync(q => q.Id == quizId, ct);
        if (quiz == null) return NotFound();
        var isCreator = quiz.Class!.CreatorId == userId;
        if (!isCreator && !await _db.Enrollments.AnyAsync(e => e.ClassId == quiz.ClassId && e.UserId == userId, ct))
            return NotFound();
        if (!isCreator) return Forbid(); // only creator sees all submissions

        var submissions = await _db.QuizSubmissions
            .Where(s => s.QuizId == quizId)
            .OrderByDescending(s => s.Score)
            .ToListAsync(ct);
        var userIds = submissions.Select(s => s.UserId).Distinct().ToList();
        var profiles = await _db.Profiles.Where(p => userIds.Contains(p.UserId)).ToDictionaryAsync(p => p.UserId, ct);
        var list = submissions.Select(s => new QuizSubmissionResponse(
            s.Id.ToString(),
            s.UserId.ToString(),
            profiles.GetValueOrDefault(s.UserId)?.Name ?? "Unknown",
            (s.SubmittedAt ?? s.StartedAt).ToString("O"),
            s.Score,
            quiz.TotalPoints,
            s.SubmittedAt.HasValue ? "submitted" : "pending",
            s.TimeTaken
        )).ToList();
        return Ok(list);
    }

    [HttpPost("{quizId:guid}/submit")]
    public async Task<IActionResult> Submit(Guid quizId, [FromBody] SubmitQuizRequest req, CancellationToken ct)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();
        var quiz = await _db.Quizzes.FirstOrDefaultAsync(q => q.Id == quizId, ct);
        if (quiz == null) return NotFound();
        if (!await CanAccessClass(userId.Value, quiz.ClassId, ct)) return Forbid();

        var existing = await _db.QuizSubmissions.FirstOrDefaultAsync(s => s.QuizId == quizId && s.UserId == userId, ct);
        var now = DateTime.UtcNow;
        if (existing != null)
        {
            existing.AnswersJson = JsonSerializer.Serialize(req.Answers ?? new Dictionary<string, string>(), JsonOptions);
            existing.Score = req.Score;
            existing.TimeTaken = req.TimeTaken;
            existing.SubmittedAt = now;
        }
        else
        {
            _db.QuizSubmissions.Add(new QuizSubmission
            {
                Id = Guid.NewGuid(),
                QuizId = quizId,
                UserId = userId.Value,
                AnswersJson = JsonSerializer.Serialize(req.Answers ?? new Dictionary<string, string>(), JsonOptions),
                Score = req.Score,
                TimeTaken = req.TimeTaken,
                StartedAt = now,
                SubmittedAt = now,
                CreatedAt = now
            });
        }
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    private async Task<bool> IsCreator(Guid userId, Guid classId, CancellationToken ct)
    {
        var c = await _db.Classes.FirstOrDefaultAsync(x => x.Id == classId, ct);
        return c?.CreatorId == userId;
    }

    private async Task<bool> CanAccessClass(Guid userId, Guid classId, CancellationToken ct)
    {
        var c = await _db.Classes.FirstOrDefaultAsync(x => x.Id == classId, ct);
        if (c == null) return false;
        if (c.CreatorId == userId) return true;
        return await _db.Enrollments.AnyAsync(e => e.ClassId == classId && e.UserId == userId, ct);
    }
}
