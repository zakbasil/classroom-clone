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
public class MaterialsController : ControllerBase
{
    private readonly AppDbContext _db;
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

    public MaterialsController(AppDbContext db) => _db = db;

    [HttpGet("class/{classId:guid}")]
    public async Task<ActionResult<List<MaterialResponse>>> GetByClass(Guid classId, CancellationToken ct)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();
        if (!await CanAccessClass(userId.Value, classId, ct)) return NotFound();

        var list = await _db.Materials
            .Where(m => m.ClassId == classId)
            .OrderByDescending(m => m.CreatedAt)
            .ToListAsync(ct);
        var result = list.Select(m => new MaterialResponse(
            m.Id.ToString(),
            m.ClassId.ToString(),
            m.Title,
            m.Description,
            m.Topic,
            m.CreatedAt.ToString("O"),
            DeserializeAttachments(m.AttachmentsJson)
        )).ToList();
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<MaterialResponse>> Create([FromBody] CreateMaterialRequest req, CancellationToken ct)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();
        if (!await CanAccessClass(userId.Value, Guid.Parse(req.ClassId), ct)) return Forbid();

        var attachments = req.Attachments ?? new List<MaterialAttachmentDto>();
        var m = new Material
        {
            Id = Guid.NewGuid(),
            ClassId = Guid.Parse(req.ClassId),
            Title = req.Title,
            Description = req.Description,
            Topic = req.Topic,
            AttachmentsJson = JsonSerializer.Serialize(attachments, JsonOptions),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _db.Materials.Add(m);
        await _db.SaveChangesAsync(ct);
        return Ok(new MaterialResponse(
            m.Id.ToString(),
            m.ClassId.ToString(),
            m.Title,
            m.Description,
            m.Topic,
            m.CreatedAt.ToString("O"),
            attachments
        ));
    }

    private static List<MaterialAttachmentDto> DeserializeAttachments(string json)
    {
        try
        {
            return JsonSerializer.Deserialize<List<MaterialAttachmentDto>>(json, JsonOptions) ?? new List<MaterialAttachmentDto>();
        }
        catch { return new List<MaterialAttachmentDto>(); }
    }

    private async Task<bool> CanAccessClass(Guid userId, Guid classId, CancellationToken ct)
    {
        var c = await _db.Classes.FirstOrDefaultAsync(x => x.Id == classId, ct);
        if (c == null) return false;
        if (c.CreatorId == userId) return true;
        return await _db.Enrollments.AnyAsync(e => e.ClassId == classId && e.UserId == userId, ct);
    }
}
