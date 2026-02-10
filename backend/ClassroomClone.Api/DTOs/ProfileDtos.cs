namespace ClassroomClone.Api.DTOs;

public record ProfileResponse(string UserId, string Name, string Email, string? AvatarUrl);
