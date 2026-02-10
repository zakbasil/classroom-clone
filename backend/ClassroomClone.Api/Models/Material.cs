namespace ClassroomClone.Api.Models;

public class Material
{
    public Guid Id { get; set; }
    public Guid ClassId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Topic { get; set; }
    /// <summary>JSON array of { name, type, url }.</summary>
    public string AttachmentsJson { get; set; } = "[]";
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public Class? Class { get; set; }
}
