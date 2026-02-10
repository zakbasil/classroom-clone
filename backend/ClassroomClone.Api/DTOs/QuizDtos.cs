using System.Text.Json;

namespace ClassroomClone.Api.DTOs;

// Frontend question types
public record QuestionOptionDto(string Id, string Text);
public record QuestionDto(
    string Id,
    string Type, // short_answer | long_answer | multiple_choice | code
    string Text,
    int Points,
    List<QuestionOptionDto>? Options,
    string? CorrectOptionId,
    string? CodeLanguage
);

public record CreateQuizRequest(
    string ClassId,
    string Title,
    string? Description,
    string? Topic,
    List<QuestionDto> Questions,
    int TotalPoints,
    string DueDate,
    bool RequireFullscreen,
    int? TimeLimit
);

public record QuizResponse(
    string Id,
    string ClassId,
    string Title,
    string? Description,
    string? Topic,
    List<QuestionDto> Questions,
    int TotalPoints,
    string DueDate,
    string CreatedAt,
    bool RequireFullscreen,
    int? TimeLimit
);

public record QuizSubmissionResponse(
    string Id,
    string StudentId,
    string StudentName,
    string SubmittedAt,
    int Score,
    int TotalPoints,
    string Status,
    int? TimeTaken
);

public record SubmitQuizRequest(Dictionary<string, string> Answers, int Score, int? TimeTaken);
