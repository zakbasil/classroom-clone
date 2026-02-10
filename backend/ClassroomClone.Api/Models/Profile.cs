namespace ClassroomClone.Api.Models;

public enum UserRole
{
    Student = 0,
    Teacher = 1,
    Admin = 2
}

public class Profile
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public UserRole Role { get; set; } = UserRole.Student;
    public bool IsApproved { get; set; } = false; // Only approved users can create classes
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
