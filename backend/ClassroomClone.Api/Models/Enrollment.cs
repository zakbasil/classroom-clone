namespace ClassroomClone.Api.Models;

public class Enrollment
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid ClassId { get; set; }
    public DateTime CreatedAt { get; set; }

    public Class? Class { get; set; }
    public User? User { get; set; }
}
