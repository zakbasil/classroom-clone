using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ClassroomClone.Api.Data;
using ClassroomClone.Api.DTOs;
using ClassroomClone.Api.Extensions;

namespace ClassroomClone.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class EnrollmentsController : ControllerBase
{
    private readonly AppDbContext _db;

    public EnrollmentsController(AppDbContext db) => _db = db;

    [HttpGet("class/{classId:guid}")]
    public async Task<ActionResult<List<ProfileResponse>>> GetClassMembers(Guid classId, CancellationToken ct)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();
        var c = await _db.Classes.FirstOrDefaultAsync(x => x.Id == classId, ct);
        if (c == null) return NotFound();
        if (c.CreatorId != userId && !await _db.Enrollments.AnyAsync(e => e.ClassId == classId && e.UserId == userId, ct))
            return NotFound();

        var memberIds = new List<Guid> { c.CreatorId };
        memberIds.AddRange(await _db.Enrollments.Where(e => e.ClassId == classId).Select(e => e.UserId).ToListAsync(ct));
        var profiles = await _db.Profiles
            .Where(p => memberIds.Contains(p.UserId))
            .Select(p => new ProfileResponse(p.UserId.ToString(), p.Name, p.Email, p.AvatarUrl))
            .ToListAsync(ct);
        return Ok(profiles);
    }
}
