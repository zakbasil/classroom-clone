namespace ClassroomClone.Api.Models;

public class TeacherSchedule
{
    public Guid Id { get; set; }
    public Guid TeacherId { get; set; }
    public Guid? ClassId { get; set; } // Created automatically when scheduled
    public string ClassName { get; set; } = string.Empty;
    public string? Section { get; set; }
    public string? Subject { get; set; }
    public string? Room { get; set; }
    public DayOfWeek DayOfWeek { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public User? Teacher { get; set; }
    public Class? Class { get; set; }
}
