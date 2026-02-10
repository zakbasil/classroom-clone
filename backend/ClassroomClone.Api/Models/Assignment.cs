namespace ClassroomClone.Api.Models;

public class Assignment
{
    public Guid Id { get; set; }
    public Guid ClassId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int Points { get; set; } = 100;
    public DateTime DueDate { get; set; }
    public string? Topic { get; set; }
    public string Type { get; set; } = "assignment"; // assignment | quiz | questions
    public Guid? QuizId { get; set; }
    public Guid? QuestionSetId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public Class? Class { get; set; }
    public Quiz? Quiz { get; set; }
    public QuestionSet? QuestionSet { get; set; }
}
