namespace ClassroomClone.Api.DTOs;

public record CreateQuestionSetRequest(
    string ClassId,
    string Title,
    string? Description,
    string? Topic,
    List<QuestionDto> Questions,
    int TotalPoints,
    string DueDate
);

public record QuestionSetResponse(
    string Id,
    string ClassId,
    string Title,
    string? Description,
    string? Topic,
    List<QuestionDto> Questions,
    int TotalPoints,
    string DueDate,
    string CreatedAt
);

public record QuestionSetSubmissionResponse(
    string Id,
    string StudentId,
    string StudentName,
    string SubmittedAt,
    int Score,
    int TotalPoints,
    string Status,
    int? TimeTaken
);
