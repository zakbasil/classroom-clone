namespace ClassroomClone.Api.Models;

public class Class
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Section { get; set; }
    public string? Subject { get; set; }
    public string? Room { get; set; }
    public Guid CreatorId { get; set; }
    public string CoverColor { get; set; } = "bg-primary";
    public string StreamCode { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public User? Creator { get; set; }
    public ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();
    public ICollection<Assignment> Assignments { get; set; } = new List<Assignment>();
    public ICollection<Quiz> Quizzes { get; set; } = new List<Quiz>();
    public ICollection<QuestionSet> QuestionSets { get; set; } = new List<QuestionSet>();
    public ICollection<Material> Materials { get; set; } = new List<Material>();
    public ICollection<Announcement> Announcements { get; set; } = new List<Announcement>();
}
