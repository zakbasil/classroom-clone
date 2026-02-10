using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ClassroomClone.Api.Data;
using ClassroomClone.Api.DTOs;

namespace ClassroomClone.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProfilesController : ControllerBase
{
    private readonly AppDbContext _db;

    public ProfilesController(AppDbContext db) => _db = db;

    /// <summary>Get profiles by user IDs (e.g. for class members).</summary>
    [HttpPost("by-ids")]
    public async Task<ActionResult<List<ProfileResponse>>> GetByIds([FromBody] List<string> userIds, CancellationToken ct)
    {
        if (userIds == null || userIds.Count == 0)
            return Ok(new List<ProfileResponse>());
        var guids = userIds.Where(id => Guid.TryParse(id, out _)).Select(Guid.Parse).ToList();
        var profiles = await _db.Profiles
            .Where(p => guids.Contains(p.UserId))
            .Select(p => new ProfileResponse(p.UserId.ToString(), p.Name, p.Email, p.AvatarUrl))
            .ToListAsync(ct);
        return Ok(profiles);
    }
}
