using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using ClassroomClone.Api.Data;
using ClassroomClone.Api.Models;
using ClassroomClone.Api.DTOs;

namespace ClassroomClone.Api.Services;

public class AuthService
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;

    public AuthService(AppDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    public async Task<AuthResponse?> RegisterAsync(RegisterRequest req, CancellationToken ct = default)
    {
        if (await _db.Users.AnyAsync(u => u.Email == req.Email, ct))
            return null;

        var userId = Guid.NewGuid();
        var user = new User
        {
            Id = userId,
            Email = req.Email.ToLowerInvariant(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password),
            CreatedAt = DateTime.UtcNow
        };
        var profile = new Profile
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Name = req.Name,
            Email = user.Email,
            Role = UserRole.Student,
            IsApproved = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _db.Users.Add(user);
        _db.Profiles.Add(profile);
        await _db.SaveChangesAsync(ct);
        var token = GenerateJwt(userId, user.Email, req.Name, UserRole.Student);
        return new AuthResponse(token, userId.ToString(), user.Email, req.Name);
    }

    public async Task<AuthResponse?> LoginAsync(LoginRequest req, CancellationToken ct = default)
    {
        var user = await _db.Users
            .Include(u => u.Profile)
            .FirstOrDefaultAsync(u => u.Email == req.Email.ToLowerInvariant(), ct);
        if (user == null || !BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash))
            return null;

        var name = user.Profile?.Name ?? user.Email;
        var role = user.Profile?.Role ?? UserRole.Student;
        var token = GenerateJwt(user.Id, user.Email, name, role);
        return new AuthResponse(token, user.Id.ToString(), user.Email, name);
    }

    private string GenerateJwt(Guid userId, string email, string name, UserRole role)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"] ?? "ClassroomCloneSecretKeyAtLeast32CharactersLong!"));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, userId.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, email),
            new Claim("name", name),
            new Claim("role", role.ToString())
        };
        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims,
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: creds
        );
        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
