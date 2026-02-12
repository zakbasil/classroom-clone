using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ClassroomClone.Api.Data;
using ClassroomClone.Api.Models;
using ClassroomClone.Api.DTOs;
using ClassroomClone.Api.Extensions;
using System.Text;

namespace ClassroomClone.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class QuestionSetsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IHttpClientFactory _httpClientFactory;
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

    public QuestionSetsController(AppDbContext db, IHttpClientFactory httpClientFactory)
    {
        _db = db;
        _httpClientFactory = httpClientFactory;
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<QuestionSetResponse>> GetById(Guid id, CancellationToken ct)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();

        var q = await _db.QuestionSets.Include(x => x.Class).FirstOrDefaultAsync(x => x.Id == id, ct);
        if (q == null) return NotFound();
        if (q.Class!.CreatorId != userId && !await _db.Enrollments.AnyAsync(e => e.ClassId == q.ClassId && e.UserId == userId, ct))
            return NotFound();

        var questions = JsonSerializer.Deserialize<List<QuestionDto>>(q.QuestionsJson, JsonOptions) ?? new List<QuestionDto>();
        return Ok(new QuestionSetResponse(
            q.Id.ToString(),
            q.ClassId.ToString(),
            q.Title,
            q.Description,
            q.Topic,
            questions,
            q.TotalPoints,
            q.DueDate.ToString("O"),
            q.CreatedAt.ToString("O")
        ));
    }

    [HttpPost]
    public async Task<ActionResult<QuestionSetResponse>> Create([FromBody] CreateQuestionSetRequest req, CancellationToken ct)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();
        if (!await IsCreator(userId.Value, Guid.Parse(req.ClassId), ct)) return Forbid();

        var qsId = Guid.NewGuid();
        var dueDate = DateTime.Parse(req.DueDate);
        var qs = new QuestionSet
        {
            Id = qsId,
            ClassId = Guid.Parse(req.ClassId),
            Title = req.Title,
            Description = req.Description,
            Topic = req.Topic,
            QuestionsJson = JsonSerializer.Serialize(req.Questions ?? new List<QuestionDto>(), JsonOptions),
            TotalPoints = req.TotalPoints,
            DueDate = dueDate,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _db.QuestionSets.Add(qs);
        _db.Assignments.Add(new Models.Assignment
        {
            Id = Guid.NewGuid(),
            ClassId = qs.ClassId,
            Title = req.Title,
            Description = req.Description,
            Points = req.TotalPoints,
            DueDate = dueDate,
            Topic = req.Topic,
            Type = "questions",
            QuestionSetId = qsId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });
        await _db.SaveChangesAsync(ct);

        var questions = req.Questions ?? new List<QuestionDto>();
        return Ok(new QuestionSetResponse(
            qs.Id.ToString(),
            qs.ClassId.ToString(),
            qs.Title,
            qs.Description,
            qs.Topic,
            questions,
            qs.TotalPoints,
            qs.DueDate.ToString("O"),
            qs.CreatedAt.ToString("O")
        ));
    }

    [HttpPost("execute-code")]
    public async Task<ActionResult> ExecuteCode([FromBody] ExecuteCodeRequest req, CancellationToken ct)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();

        // Verify user has access to the question set
        var questionSet = await _db.QuestionSets.Include(x => x.Class).FirstOrDefaultAsync(x => x.Id == Guid.Parse(req.QuestionSetId), ct);
        if (questionSet == null) return NotFound();
        if (questionSet.Class!.CreatorId != userId && !await _db.Enrollments.AnyAsync(e => e.ClassId == questionSet.ClassId && e.UserId == userId, ct))
            return Forbid();

        // Map language from frontend to CodeBackend format
        var languageMap = new Dictionary<string, string>
        {
            { "javascript", "python" }, // JavaScript not supported, default to python
            { "python", "python" },
            { "java", "java" },
            { "cpp", "cpp" },
            { "c", "c" },
            { "csharp", "python" } // C# not supported, default to python
        };

        var backendLanguage = languageMap.GetValueOrDefault(req.Language.ToLower(), "python");

        // Prepare request for CodeBackend
        var codeBackendRequest = new
        {
            code = req.Code,
            language = backendLanguage,
            test_cases = req.TestCases.Select(tc => new
            {
                input = tc.Input,
                expected_output = tc.ExpectedOutput
            }).ToList()
        };

        // Call CodeBackend API
        var httpClient = _httpClientFactory.CreateClient();
        httpClient.Timeout = TimeSpan.FromSeconds(30);
        
        var codeBackendUrl = Environment.GetEnvironmentVariable("CODE_BACKEND_URL") ?? "http://localhost:8000";
        var response = await httpClient.PostAsync(
            $"{codeBackendUrl}/api/execute",
            new StringContent(JsonSerializer.Serialize(codeBackendRequest, JsonOptions), Encoding.UTF8, "application/json"),
            ct
        );

        if (!response.IsSuccessStatusCode)
        {
            var errorContent = await response.Content.ReadAsStringAsync(ct);
            return StatusCode((int)response.StatusCode, new { message = $"Code execution failed: {errorContent}" });
        }

        var resultJson = await response.Content.ReadAsStringAsync(ct);
        
        // CodeBackend returns snake_case, so we need to parse it manually or use a different deserializer
        using var doc = JsonDocument.Parse(resultJson);
        var root = doc.RootElement;
        
        var totalTestCases = root.GetProperty("total_test_cases").GetInt32();
        var passedTestCases = root.GetProperty("passed_test_cases").GetInt32();
        var results = root.GetProperty("results").EnumerateArray().Select((r, idx) => new
        {
            testCaseIndex = r.GetProperty("test_case_index").GetInt32(),
            passed = r.GetProperty("passed").GetBoolean(),
            input = r.GetProperty("input").GetString() ?? "",
            expectedOutput = r.GetProperty("expected_output").GetString() ?? "",
            actualOutput = r.TryGetProperty("actual_output", out var ao) ? ao.GetString() : null,
            error = r.TryGetProperty("error", out var err) ? err.GetString() : null
        }).ToList();
        
        var executionError = root.TryGetProperty("execution_error", out var execErr) ? execErr.GetString() : null;

        // Map response to frontend format
        return Ok(new
        {
            totalTestCases,
            passedTestCases,
            results,
            executionError
        });
    }

    [HttpGet("{questionSetId:guid}/submissions")]
    public async Task<ActionResult<List<QuestionSetSubmissionResponse>>> GetSubmissions(Guid questionSetId, CancellationToken ct)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();
        var questionSet = await _db.QuestionSets.Include(x => x.Class).FirstOrDefaultAsync(x => x.Id == questionSetId, ct);
        if (questionSet == null) return NotFound();
        var isCreator = questionSet.Class!.CreatorId == userId;
        if (!isCreator && !await _db.Enrollments.AnyAsync(e => e.ClassId == questionSet.ClassId && e.UserId == userId, ct))
            return NotFound();
        if (!isCreator) return Forbid(); // only creator sees all submissions

        var submissions = await _db.QuestionSetSubmissions
            .Where(s => s.QuestionSetId == questionSetId)
            .OrderByDescending(s => s.SubmittedAt ?? s.StartedAt)
            .ToListAsync(ct);
        var userIds = submissions.Select(s => s.UserId).Distinct().ToList();
        var profiles = await _db.Profiles.Where(p => userIds.Contains(p.UserId)).ToDictionaryAsync(p => p.UserId, ct);
        var list = submissions.Select(s => new QuestionSetSubmissionResponse(
            s.Id.ToString(),
            s.UserId.ToString(),
            profiles.GetValueOrDefault(s.UserId)?.Name ?? "Unknown",
            (s.SubmittedAt ?? s.StartedAt).ToString("O"),
            s.Score ?? 0,
            questionSet.TotalPoints,
            s.SubmittedAt.HasValue ? "submitted" : "pending",
            s.TimeTaken
        )).ToList();
        return Ok(list);
    }

    private async Task<bool> IsCreator(Guid userId, Guid classId, CancellationToken ct)
    {
        var c = await _db.Classes.FirstOrDefaultAsync(x => x.Id == classId, ct);
        return c?.CreatorId == userId;
    }
}

public record ExecuteCodeRequest(
    string Code,
    string Language,
    List<TestCaseDto> TestCases,
    string QuestionSetId,
    string QuestionId,
    bool IsSubmit
);

