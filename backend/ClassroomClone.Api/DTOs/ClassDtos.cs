namespace ClassroomClone.Api.DTOs;

public record CreateClassRequest(string Name, string? Section, string? Subject, string? Room, string? CoverColor);
public record JoinClassRequest(string StreamCode);
public record JoinClassResponse(bool Success, string Message);

// Response matches frontend ClassData shape (camelCase)
public record ClassResponse(
    string Id,
    string Name,
    string? Section,
    string? Subject,
    string? Room,
    string CreatorId,
    string CreatorName,
    string? CreatorAvatar,
    string CoverColor,
    string StreamCode,
    int StudentCount,
    int UpcomingAssignments
);
