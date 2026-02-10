namespace ClassroomClone.Api.Models;

public class QuestionSetSubmission
{
    public Guid Id { get; set; }
    public Guid QuestionSetId { get; set; }
    public Guid UserId { get; set; }
    /// <summary>JSON object questionId -> answer.</summary>
    public string AnswersJson { get; set; } = "{}";
    public int? Score { get; set; }
    public int? TimeTaken { get; set; }
    public DateTime StartedAt { get; set; }
    public DateTime? SubmittedAt { get; set; }
    public DateTime CreatedAt { get; set; }

    public QuestionSet? QuestionSet { get; set; }
    public User? User { get; set; }
}
