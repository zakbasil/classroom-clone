namespace ClassroomClone.Api.Models;

public class Announcement
{
    public Guid Id { get; set; }
    public Guid ClassId { get; set; }
    public Guid AuthorId { get; set; }
    public string Content { get; set; } = string.Empty;
    /// <summary>JSON array of { name, type, url }.</summary>
    public string AttachmentsJson { get; set; } = "[]";
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public Class? Class { get; set; }
    public User? Author { get; set; }
}
