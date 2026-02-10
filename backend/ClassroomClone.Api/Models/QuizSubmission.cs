namespace ClassroomClone.Api.Models;

public class QuizSubmission
{
    public Guid Id { get; set; }
    public Guid QuizId { get; set; }
    public Guid UserId { get; set; }
    /// <summary>JSON object questionId -> answer.</summary>
    public string AnswersJson { get; set; } = "{}";
    public int Score { get; set; }
    public int? TimeTaken { get; set; } // minutes
    public DateTime StartedAt { get; set; }
    public DateTime? SubmittedAt { get; set; }
    public DateTime CreatedAt { get; set; }

    public Quiz? Quiz { get; set; }
    public User? User { get; set; }
}
