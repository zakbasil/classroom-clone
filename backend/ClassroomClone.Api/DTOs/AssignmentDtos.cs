namespace ClassroomClone.Api.DTOs;

public record AssignmentResponse(
    string Id,
    string ClassId,
    string Title,
    string Description,
    int Points,
    string DueDate,
    string CreatedAt,
    string? Topic,
    string? Type,
    string? QuizId,
    string? QuestionSetId
);
