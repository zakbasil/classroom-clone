namespace ClassroomClone.Api.Models;

public class Quiz
{
    public Guid Id { get; set; }
    public Guid ClassId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Topic { get; set; }
    /// <summary>JSON array of questions.</summary>
    public string QuestionsJson { get; set; } = "[]";
    public int TotalPoints { get; set; }
    public DateTime DueDate { get; set; }
    public bool RequireFullscreen { get; set; }
    public int? TimeLimit { get; set; } // minutes
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public Class? Class { get; set; }
    public ICollection<QuizSubmission> Submissions { get; set; } = new List<QuizSubmission>();
}
