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
public class AnnouncementsController : ControllerBase
{
    private readonly AppDbContext _db;
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

    public AnnouncementsController(AppDbContext db) => _db = db;

    [HttpGet("class/{classId:guid}")]
    public async Task<ActionResult<List<AnnouncementResponse>>> GetByClass(Guid classId, CancellationToken ct)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();
        if (!await CanAccessClass(userId.Value, classId, ct)) return NotFound();

        var list = await _db.Announcements
            .Where(a => a.ClassId == classId)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync(ct);
        var authorIds = list.Select(a => a.AuthorId).Distinct().ToList();
        var profiles = await _db.Profiles.Where(p => authorIds.Contains(p.UserId)).ToDictionaryAsync(p => p.UserId, ct);
        var result = list.Select(a => new AnnouncementResponse(
            a.Id.ToString(),
            a.ClassId.ToString(),
            a.AuthorId.ToString(),
            profiles.GetValueOrDefault(a.AuthorId)?.Name ?? "Unknown",
            profiles.GetValueOrDefault(a.AuthorId)?.AvatarUrl,
            a.Content,
            a.CreatedAt.ToString("O"),
            DeserializeAttachments(a.AttachmentsJson)
        )).ToList();
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<AnnouncementResponse>> Create([FromBody] CreateAnnouncementRequest req, CancellationToken ct)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();
        if (!await CanAccessClass(userId.Value, Guid.Parse(req.ClassId), ct)) return Forbid();

        var profile = await _db.Profiles.FirstOrDefaultAsync(p => p.UserId == userId, ct);
        var a = new Announcement
        {
            Id = Guid.NewGuid(),
            ClassId = Guid.Parse(req.ClassId),
            AuthorId = userId.Value,
            Content = req.Content,
            AttachmentsJson = "[]",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _db.Announcements.Add(a);
        await _db.SaveChangesAsync(ct);
        return Ok(new AnnouncementResponse(
            a.Id.ToString(),
            a.ClassId.ToString(),
            a.AuthorId.ToString(),
            profile?.Name ?? "Unknown",
            profile?.AvatarUrl,
            a.Content,
            a.CreatedAt.ToString("O"),
            new List<AnnouncementAttachmentDto>()
        ));
    }

    private static List<AnnouncementAttachmentDto> DeserializeAttachments(string json)
    {
        try
        {
            return JsonSerializer.Deserialize<List<AnnouncementAttachmentDto>>(json, JsonOptions) ?? new List<AnnouncementAttachmentDto>();
        }
        catch { return new List<AnnouncementAttachmentDto>(); }
    }

    private async Task<bool> CanAccessClass(Guid userId, Guid classId, CancellationToken ct)
    {
        var c = await _db.Classes.FirstOrDefaultAsync(x => x.Id == classId, ct);
        if (c == null) return false;
        if (c.CreatorId == userId) return true;
        return await _db.Enrollments.AnyAsync(e => e.ClassId == classId && e.UserId == userId, ct);
    }
}
