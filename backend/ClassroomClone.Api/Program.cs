using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using ClassroomClone.Api.Data;
using ClassroomClone.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// Database: SQL Server (LocalDB), PostgreSQL, or SQLite depending on ConnectionStrings:DefaultConnection
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
if (string.IsNullOrEmpty(connectionString))
    connectionString = "Data Source=classroom.db";
if (connectionString.StartsWith("Host=", StringComparison.OrdinalIgnoreCase))
    builder.Services.AddDbContext<AppDbContext>(o => o.UseNpgsql(connectionString));
else if (connectionString.IndexOf("LocalDB", StringComparison.OrdinalIgnoreCase) >= 0
    || connectionString.IndexOf("Server=", StringComparison.OrdinalIgnoreCase) >= 0)
    builder.Services.AddDbContext<AppDbContext>(o => o.UseSqlServer(connectionString));
else
    builder.Services.AddDbContext<AppDbContext>(o => o.UseSqlite(connectionString));

builder.Services.AddScoped<AuthService>();
builder.Services.AddHttpClient();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opts =>
    {
        opts.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"] ?? "ClassroomCloneSecretKeyAtLeast32CharactersLong!"))
        };
    });
builder.Services.AddAuthorization();

builder.Services.AddControllers()
    .AddJsonOptions(o => o.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase);

builder.Services.AddCors(o =>
{
    o.AddDefaultPolicy(p =>
    {
        p.WithOrigins(builder.Configuration["Cors:Origins"]?.Split(',', StringSplitOptions.RemoveEmptyEntries) ?? new[] { "http://localhost:8080", "http://localhost:3000" })
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();
}

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
