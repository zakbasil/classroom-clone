using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ClassroomClone.Api.Data;
using ClassroomClone.Api.Models;
using ClassroomClone.Api.DTOs;
using ClassroomClone.Api.Extensions;
using ClosedXML.Excel;
using System.Text;

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

    [HttpGet("{quizId:guid}/report")]
    public async Task<IActionResult> GetQuizReport(Guid quizId, CancellationToken ct)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();
        
        var quiz = await _db.Quizzes.Include(q => q.Class).FirstOrDefaultAsync(q => q.Id == quizId, ct);
        if (quiz == null) return NotFound();
        
        var isCreator = quiz.Class!.CreatorId == userId;
        if (!isCreator) return Forbid();

        // Get all enrolled students
        var enrolledUserIds = await _db.Enrollments
            .Where(e => e.ClassId == quiz.ClassId)
            .Select(e => e.UserId)
            .ToListAsync(ct);
        
        var profiles = await _db.Profiles
            .Where(p => enrolledUserIds.Contains(p.UserId))
            .ToDictionaryAsync(p => p.UserId, ct);

        // Get all submissions for this quiz
        var submissions = await _db.QuizSubmissions
            .Where(s => s.QuizId == quizId)
            .ToDictionaryAsync(s => s.UserId, ct);

        // Create Excel workbook
        using var workbook = new XLWorkbook();
        var worksheet = workbook.Worksheets.Add("Quiz Report");

        // Headers
        worksheet.Cell(1, 1).Value = "Student Name";
        worksheet.Cell(1, 2).Value = "Email";
        worksheet.Cell(1, 3).Value = "Attempts";
        worksheet.Cell(1, 4).Value = "Start Time";
        worksheet.Cell(1, 5).Value = "Submit Time";
        worksheet.Cell(1, 6).Value = "Time Taken (minutes)";
        worksheet.Cell(1, 7).Value = "Score";
        worksheet.Cell(1, 8).Value = "Total Points";
        worksheet.Cell(1, 9).Value = "Status";

        // Style headers
        var headerRange = worksheet.Range(1, 1, 1, 9);
        headerRange.Style.Font.Bold = true;
        headerRange.Style.Fill.BackgroundColor = XLColor.Amber;
        headerRange.Style.Font.FontColor = XLColor.Black;

        int row = 2;
        foreach (var studentUserId in enrolledUserIds)
        {
            var profile = profiles.GetValueOrDefault(studentUserId);
            var submission = submissions.GetValueOrDefault(studentUserId);

            worksheet.Cell(row, 1).Value = profile?.Name ?? "Unknown";
            worksheet.Cell(row, 2).Value = profile?.Email ?? "";
            
            if (submission != null)
            {
                worksheet.Cell(row, 3).Value = submission.SubmittedAt.HasValue ? 1 : 0;
                worksheet.Cell(row, 4).Value = submission.StartedAt.ToString("yyyy-MM-dd HH:mm:ss");
                worksheet.Cell(row, 5).Value = submission.SubmittedAt?.ToString("yyyy-MM-dd HH:mm:ss") ?? "Not Submitted";
                worksheet.Cell(row, 6).Value = submission.TimeTaken?.ToString() ?? "N/A";
                worksheet.Cell(row, 7).Value = submission.SubmittedAt.HasValue ? submission.Score : "Not Submitted";
                worksheet.Cell(row, 8).Value = quiz.TotalPoints;
                worksheet.Cell(row, 9).Value = submission.SubmittedAt.HasValue ? "Submitted" : "In Progress";
            }
            else
            {
                worksheet.Cell(row, 3).Value = 0;
                worksheet.Cell(row, 4).Value = "Not Attempted";
                worksheet.Cell(row, 5).Value = "Not Attempted";
                worksheet.Cell(row, 6).Value = "Not Attempted";
                worksheet.Cell(row, 7).Value = "Not Attempted";
                worksheet.Cell(row, 8).Value = quiz.TotalPoints;
                worksheet.Cell(row, 9).Value = "Not Attempted";
            }
            
            row++;
        }

        // Auto-fit columns
        worksheet.Columns().AdjustToContents();

        // Add quiz info sheet
        var infoSheet = workbook.Worksheets.Add("Quiz Info");
        infoSheet.Cell(1, 1).Value = "Quiz Title";
        infoSheet.Cell(1, 2).Value = quiz.Title;
        infoSheet.Cell(2, 1).Value = "Description";
        infoSheet.Cell(2, 2).Value = quiz.Description ?? "";
        infoSheet.Cell(3, 1).Value = "Total Points";
        infoSheet.Cell(3, 2).Value = quiz.TotalPoints;
        infoSheet.Cell(4, 1).Value = "Due Date";
        infoSheet.Cell(4, 2).Value = quiz.DueDate.ToString("yyyy-MM-dd HH:mm:ss");
        infoSheet.Cell(5, 1).Value = "Time Limit";
        infoSheet.Cell(5, 2).Value = quiz.TimeLimit?.ToString() + " minutes" ?? "No limit";
        infoSheet.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        var content = stream.ToArray();

        var fileName = $"Quiz_Report_{quiz.Title.Replace(" ", "_")}_{DateTime.UtcNow:yyyyMMdd}.xlsx";
        return File(content, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
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
