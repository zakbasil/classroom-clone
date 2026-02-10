using System.Security.Claims;
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
public class ProfilesController : ControllerBase
{
    private readonly AppDbContext _db;

    public ProfilesController(AppDbContext db) => _db = db;

    [HttpGet("me")]
    public async Task<ActionResult<ProfileResponse>> GetMyProfile(CancellationToken ct)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();
        var profile = await _db.Profiles.FirstOrDefaultAsync(p => p.UserId == userId, ct);
        if (profile == null) return NotFound();
        return Ok(new ProfileResponse(
            profile.UserId.ToString(),
            profile.Name,
            profile.Email,
            profile.AvatarUrl,
            profile.Role.ToString(),
            profile.IsApproved
        ));
    }

    /// <summary>Get profiles by user IDs (e.g. for class members).</summary>
    [HttpPost("by-ids")]
    public async Task<ActionResult<List<ProfileResponse>>> GetByIds([FromBody] List<string> userIds, CancellationToken ct)
    {
        if (userIds == null || userIds.Count == 0)
            return Ok(new List<ProfileResponse>());
        var guids = userIds.Where(id => Guid.TryParse(id, out _)).Select(Guid.Parse).ToList();
        var profiles = await _db.Profiles
            .Where(p => guids.Contains(p.UserId))
            .Select(p => new ProfileResponse(
                p.UserId.ToString(),
                p.Name,
                p.Email,
                p.AvatarUrl,
                p.Role.ToString(),
                p.IsApproved
            ))
            .ToListAsync(ct);
        return Ok(profiles);
    }
}
