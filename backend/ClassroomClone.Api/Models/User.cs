namespace ClassroomClone.Api.Models;

/// <summary>Local user for authentication (email + password). Profile holds display name and avatar.</summary>
public class User
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }

    public Profile? Profile { get; set; }
}
