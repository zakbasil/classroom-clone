namespace ClassroomClone.Api.Models;

public enum TemplateStatus
{
    Draft = 0,
    PendingApproval = 1,
    Approved = 2,
    Rejected = 3,
    Published = 4
}

public class QuizTemplate
{
    public Guid Id { get; set; }
    public Guid CreatedBy { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Topic { get; set; }
    public string QuestionsJson { get; set; } = "[]";
    public int TotalPoints { get; set; }
    public bool RequireFullscreen { get; set; }
    public int? TimeLimit { get; set; }
    public bool IsApproved { get; set; } = false; // Deprecated: use Status instead
    public TemplateStatus Status { get; set; } = TemplateStatus.Draft;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public User? Creator { get; set; }
}
