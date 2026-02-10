using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ClassroomClone.Api.Data;
using ClassroomClone.Api.Models;
using ClassroomClone.Api.DTOs;
using ClassroomClone.Api.Extensions;
using ClosedXML.Excel;
using System.Text;
using static ClassroomClone.Api.Models.UserRole;

namespace ClassroomClone.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ClassesController : ControllerBase
{
    private readonly AppDbContext _db;
    private static readonly char[] StreamCodeChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".ToCharArray();

    public ClassesController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<List<ClassResponse>>> GetMyClasses(CancellationToken ct)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();

        var created = await _db.Classes
            .Where(c => c.CreatorId == userId)
            .ToListAsync(ct);
        var enrolledIds = await _db.Enrollments
            .Where(e => e.UserId == userId)
            .Select(e => e.ClassId)
            .ToListAsync(ct);
        var enrolled = enrolledIds.Count > 0
            ? await _db.Classes.Where(c => enrolledIds.Contains(c.Id)).ToListAsync(ct)
            : new List<Class>();
        var all = created.Union(enrolled).Distinct().ToList();

        var result = new List<ClassResponse>();
        foreach (var c in all)
        {
            var creator = await _db.Profiles.FirstOrDefaultAsync(p => p.UserId == c.CreatorId, ct);
            var studentCount = await _db.Enrollments.CountAsync(e => e.ClassId == c.Id, ct);
            var upcomingAssignments = await _db.Assignments
                .CountAsync(a => a.ClassId == c.Id && a.DueDate > DateTime.UtcNow, ct);
            result.Add(ToClassResponse(c, creator?.Name ?? "Unknown", creator?.AvatarUrl, studentCount, upcomingAssignments));
        }
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ClassResponse>> GetById(Guid id, CancellationToken ct)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();
        if (!await CanAccessClass(userId.Value, id, ct)) return NotFound();

        var c = await _db.Classes.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (c == null) return NotFound();
        var creator = await _db.Profiles.FirstOrDefaultAsync(p => p.UserId == c.CreatorId, ct);
        var studentCount = await _db.Enrollments.CountAsync(e => e.ClassId == c.Id, ct);
        var upcomingAssignments = await _db.Assignments.CountAsync(a => a.ClassId == c.Id && a.DueDate > DateTime.UtcNow, ct);
        return Ok(ToClassResponse(c, creator?.Name ?? "Unknown", creator?.AvatarUrl, studentCount, upcomingAssignments));
    }

    [HttpGet("by-code/{code}")]
    [AllowAnonymous]
    public async Task<ActionResult<ClassResponse>> GetByStreamCode(string code, CancellationToken ct)
    {
        var c = await _db.Classes.FirstOrDefaultAsync(x => x.StreamCode == code.ToUpperInvariant(), ct);
        if (c == null) return NotFound();
        var creator = await _db.Profiles.FirstOrDefaultAsync(p => p.UserId == c.CreatorId, ct);
        var studentCount = await _db.Enrollments.CountAsync(e => e.ClassId == c.Id, ct);
        var upcomingAssignments = await _db.Assignments.CountAsync(a => a.ClassId == c.Id && a.DueDate > DateTime.UtcNow, ct);
        return Ok(ToClassResponse(c, creator?.Name ?? "Unknown", creator?.AvatarUrl, studentCount, upcomingAssignments));
    }

    [HttpPost]
    public async Task<ActionResult<ClassResponse>> Create([FromBody] CreateClassRequest req, CancellationToken ct)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();

        // Check if user is approved to create classes (or is admin)
        var profile = await _db.Profiles.FirstOrDefaultAsync(p => p.UserId == userId, ct);
        if (profile == null) return Unauthorized();
        
        var isAdmin = profile.Role == UserRole.Admin;
        if (!isAdmin && !profile.IsApproved)
        {
            return BadRequest(new { message = "Your account must be approved by an administrator to create classes." });
        }

        var streamCode = GenerateStreamCode();
        var c = new Class
        {
            Id = Guid.NewGuid(),
            Name = req.Name,
            Section = req.Section,
            Subject = req.Subject,
            Room = req.Room,
            CreatorId = userId.Value,
            CoverColor = req.CoverColor ?? "bg-primary",
            StreamCode = streamCode,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _db.Classes.Add(c);
        await _db.SaveChangesAsync(ct);
        var creator = await _db.Profiles.FirstOrDefaultAsync(p => p.UserId == c.CreatorId, ct);
        return Ok(ToClassResponse(c, creator?.Name ?? "Unknown", creator?.AvatarUrl, 0, 0));
    }

    [HttpPost("join")]
    public async Task<ActionResult<JoinClassResponse>> Join([FromBody] JoinClassRequest req, CancellationToken ct)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();

        var c = await _db.Classes.FirstOrDefaultAsync(x => x.StreamCode == req.StreamCode.Trim().ToUpperInvariant(), ct);
        if (c == null)
            return Ok(new JoinClassResponse(false, "Invalid stream code. Please check and try again."));
        if (c.CreatorId == userId)
            return Ok(new JoinClassResponse(false, "You cannot join a class you created."));
        var exists = await _db.Enrollments.AnyAsync(e => e.UserId == userId && e.ClassId == c.Id, ct);
        if (exists)
            return Ok(new JoinClassResponse(false, "You are already enrolled in this class."));

        _db.Enrollments.Add(new Enrollment
        {
            Id = Guid.NewGuid(),
            UserId = userId.Value,
            ClassId = c.Id,
            CreatedAt = DateTime.UtcNow
        });
        await _db.SaveChangesAsync(ct);
        return Ok(new JoinClassResponse(true, $"Successfully joined \"{c.Name}\"!"));
    }

    [HttpGet("{classId:guid}/quizzes/report")]
    public async Task<IActionResult> GetClassQuizReport(Guid classId, CancellationToken ct)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();
        
        var classEntity = await _db.Classes.FirstOrDefaultAsync(c => c.Id == classId, ct);
        if (classEntity == null) return NotFound();
        
        if (classEntity.CreatorId != userId) return Forbid();

        // Get all quizzes for this class
        var quizzes = await _db.Quizzes
            .Where(q => q.ClassId == classId)
            .OrderBy(q => q.CreatedAt)
            .ToListAsync(ct);

        // Get all enrolled students
        var enrolledUserIds = await _db.Enrollments
            .Where(e => e.ClassId == classId)
            .Select(e => e.UserId)
            .ToListAsync(ct);
        
        var profiles = await _db.Profiles
            .Where(p => enrolledUserIds.Contains(p.UserId))
            .ToDictionaryAsync(p => p.UserId, ct);

        // Get all submissions for all quizzes
        var quizIds = quizzes.Select(q => q.Id).ToList();
        var allSubmissions = await _db.QuizSubmissions
            .Where(s => quizIds.Contains(s.QuizId))
            .ToListAsync(ct);
        
        var submissionsByQuizAndUser = allSubmissions
            .GroupBy(s => new { s.QuizId, s.UserId })
            .ToDictionary(g => g.Key, g => g.First());

        // Create Excel workbook
        using var workbook = new XLWorkbook();
        var worksheet = workbook.Worksheets.Add("Class Quiz Report");

        // Headers: Student Name, Email, then one column per quiz
        worksheet.Cell(1, 1).Value = "Student Name";
        worksheet.Cell(1, 2).Value = "Email";
        
        int col = 3;
        foreach (var quiz in quizzes)
        {
            worksheet.Cell(1, col).Value = quiz.Title;
            col++;
        }

        // Style headers
        var headerRange = worksheet.Range(1, 1, 1, 2 + quizzes.Count);
        headerRange.Style.Font.Bold = true;
        headerRange.Style.Fill.BackgroundColor = XLColor.Amber;
        headerRange.Style.Font.FontColor = XLColor.Black;

        // Add detail rows for each quiz
        int detailRow = 2;
        foreach (var quiz in quizzes)
        {
            worksheet.Cell(detailRow, 1).Value = $"Quiz: {quiz.Title}";
            worksheet.Cell(detailRow, 1).Style.Font.Bold = true;
            worksheet.Cell(detailRow, 1).Style.Fill.BackgroundColor = XLColor.LightGray;
            detailRow++;
            
            // Sub-headers for this quiz
            worksheet.Cell(detailRow, 1).Value = "Student Name";
            worksheet.Cell(detailRow, 2).Value = "Email";
            worksheet.Cell(detailRow, 3).Value = "Attempts";
            worksheet.Cell(detailRow, 4).Value = "Start Time";
            worksheet.Cell(detailRow, 5).Value = "Submit Time";
            worksheet.Cell(detailRow, 6).Value = "Time Taken (minutes)";
            worksheet.Cell(detailRow, 7).Value = "Score";
            worksheet.Cell(detailRow, 8).Value = "Total Points";
            worksheet.Cell(detailRow, 9).Value = "Status";
            
            var quizHeaderRange = worksheet.Range(detailRow, 1, detailRow, 9);
            quizHeaderRange.Style.Font.Bold = true;
            quizHeaderRange.Style.Fill.BackgroundColor = XLColor.LightYellow;
            detailRow++;

            // Student rows for this quiz
            foreach (var studentUserId in enrolledUserIds)
            {
                var profile = profiles.GetValueOrDefault(studentUserId);
                var key = new { QuizId = quiz.Id, UserId = studentUserId };
                var submission = submissionsByQuizAndUser.GetValueOrDefault(key);

                worksheet.Cell(detailRow, 1).Value = profile?.Name ?? "Unknown";
                worksheet.Cell(detailRow, 2).Value = profile?.Email ?? "";
                
                if (submission != null)
                {
                    worksheet.Cell(detailRow, 3).Value = submission.SubmittedAt.HasValue ? 1 : 0;
                    worksheet.Cell(detailRow, 4).Value = submission.StartedAt.ToString("yyyy-MM-dd HH:mm:ss");
                    worksheet.Cell(detailRow, 5).Value = submission.SubmittedAt?.ToString("yyyy-MM-dd HH:mm:ss") ?? "Not Submitted";
                    worksheet.Cell(detailRow, 6).Value = submission.TimeTaken?.ToString() ?? "N/A";
                    worksheet.Cell(detailRow, 7).Value = submission.SubmittedAt.HasValue ? submission.Score : "Not Submitted";
                    worksheet.Cell(detailRow, 8).Value = quiz.TotalPoints;
                    worksheet.Cell(detailRow, 9).Value = submission.SubmittedAt.HasValue ? "Submitted" : "In Progress";
                }
                else
                {
                    worksheet.Cell(detailRow, 3).Value = 0;
                    worksheet.Cell(detailRow, 4).Value = "Not Attempted";
                    worksheet.Cell(detailRow, 5).Value = "Not Attempted";
                    worksheet.Cell(detailRow, 6).Value = "Not Attempted";
                    worksheet.Cell(detailRow, 7).Value = "Not Attempted";
                    worksheet.Cell(detailRow, 8).Value = quiz.TotalPoints;
                    worksheet.Cell(detailRow, 9).Value = "Not Attempted";
                }
                
                detailRow++;
            }
            
            detailRow++; // Empty row between quizzes
        }

        // Summary sheet
        var summarySheet = workbook.Worksheets.Add("Summary");
        summarySheet.Cell(1, 1).Value = "Student Name";
        summarySheet.Cell(1, 2).Value = "Email";
        
        col = 3;
        foreach (var quiz in quizzes)
        {
            summarySheet.Cell(1, col).Value = quiz.Title;
            col++;
        }
        summarySheet.Cell(1, col).Value = "Total Score";
        summarySheet.Cell(1, col + 1).Value = "Total Points";

        var summaryHeaderRange = summarySheet.Range(1, 1, 1, col + 1);
        summaryHeaderRange.Style.Font.Bold = true;
        summaryHeaderRange.Style.Fill.BackgroundColor = XLColor.Amber;
        summaryHeaderRange.Style.Font.FontColor = XLColor.Black;

        int summaryRow = 2;
        foreach (var studentUserId in enrolledUserIds)
        {
            var profile = profiles.GetValueOrDefault(studentUserId);
            summarySheet.Cell(summaryRow, 1).Value = profile?.Name ?? "Unknown";
            summarySheet.Cell(summaryRow, 2).Value = profile?.Email ?? "";
            
            int totalScore = 0;
            int totalPoints = 0;
            col = 3;
            
            foreach (var quiz in quizzes)
            {
                var key = new { QuizId = quiz.Id, UserId = studentUserId };
                var submission = submissionsByQuizAndUser.GetValueOrDefault(key);
                
                if (submission != null && submission.SubmittedAt.HasValue)
                {
                    summarySheet.Cell(summaryRow, col).Value = $"{submission.Score}/{quiz.TotalPoints}";
                    totalScore += submission.Score;
                }
                else
                {
                    summarySheet.Cell(summaryRow, col).Value = "Not Attempted";
                }
                totalPoints += quiz.TotalPoints;
                col++;
            }
            
            summarySheet.Cell(summaryRow, col).Value = totalScore;
            summarySheet.Cell(summaryRow, col + 1).Value = totalPoints;
            summaryRow++;
        }

        // Auto-fit columns
        worksheet.Columns().AdjustToContents();
        summarySheet.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        var content = stream.ToArray();

        var fileName = $"Class_Quiz_Report_{classEntity.Name.Replace(" ", "_")}_{DateTime.UtcNow:yyyyMMdd}.xlsx";
        return File(content, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
    }

    private static string GenerateStreamCode()
    {
        var r = new Random();
        var code = new char[7];
        for (int i = 0; i < 7; i++) code[i] = StreamCodeChars[r.Next(StreamCodeChars.Length)];
        return new string(code);
    }

    private async Task<bool> CanAccessClass(Guid userId, Guid classId, CancellationToken ct)
    {
        var c = await _db.Classes.FirstOrDefaultAsync(x => x.Id == classId, ct);
        if (c == null) return false;
        if (c.CreatorId == userId) return true;
        return await _db.Enrollments.AnyAsync(e => e.ClassId == classId && e.UserId == userId, ct);
    }

    private static ClassResponse ToClassResponse(Class c, string creatorName, string? creatorAvatar, int studentCount, int upcomingAssignments) =>
        new(
            c.Id.ToString(),
            c.Name,
            c.Section,
            c.Subject,
            c.Room,
            c.CreatorId.ToString(),
            creatorName,
            creatorAvatar,
            c.CoverColor,
            c.StreamCode,
            studentCount,
            upcomingAssignments
        );
}
