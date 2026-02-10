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
