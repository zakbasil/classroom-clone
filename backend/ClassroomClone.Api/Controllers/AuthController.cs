using Microsoft.AspNetCore.Mvc;
using ClassroomClone.Api.DTOs;
using ClassroomClone.Api.Services;

namespace ClassroomClone.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AuthService _auth;

    public AuthController(AuthService auth) => _auth = auth;

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Password) || string.IsNullOrWhiteSpace(req.Name))
            return BadRequest("Email, password, and name are required.");
        var result = await _auth.RegisterAsync(req, ct);
        if (result == null)
            return BadRequest("An account with this email already exists.");
        return Ok(result);
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest req, CancellationToken ct)
    {
        var result = await _auth.LoginAsync(req, ct);
        if (result == null)
            return Unauthorized("Invalid email or password.");
        return Ok(result);
    }
}
