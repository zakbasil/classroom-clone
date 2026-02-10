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
public class AssignmentsController : ControllerBase
{
    private readonly AppDbContext _db;

    public AssignmentsController(AppDbContext db) => _db = db;

    [HttpGet("class/{classId:guid}")]
    public async Task<ActionResult<List<AssignmentResponse>>> GetByClass(Guid classId, CancellationToken ct)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();
        if (!await CanAccessClass(userId.Value, classId, ct)) return NotFound();

        var list = await _db.Assignments
            .Where(a => a.ClassId == classId)
            .OrderByDescending(a => a.CreatedAt)
            .Select(a => new AssignmentResponse(
                a.Id.ToString(),
                a.ClassId.ToString(),
                a.Title,
                a.Description ?? "",
                a.Points,
                a.DueDate.ToString("O"),
                a.CreatedAt.ToString("O"),
                a.Topic,
                a.Type,
                a.QuizId.HasValue ? a.QuizId.ToString() : null,
                a.QuestionSetId.HasValue ? a.QuestionSetId.ToString() : null
            ))
            .ToListAsync(ct);
        return Ok(list);
    }

    private async Task<bool> CanAccessClass(Guid userId, Guid classId, CancellationToken ct)
    {
        var c = await _db.Classes.FirstOrDefaultAsync(x => x.Id == classId, ct);
        if (c == null) return false;
        if (c.CreatorId == userId) return true;
        return await _db.Enrollments.AnyAsync(e => e.ClassId == classId && e.UserId == userId, ct);
    }
}
