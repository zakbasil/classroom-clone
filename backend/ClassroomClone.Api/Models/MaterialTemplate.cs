namespace ClassroomClone.Api.Models;

public class MaterialTemplate
{
    public Guid Id { get; set; }
    public Guid CreatedBy { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Topic { get; set; }
    public string? FileUrl { get; set; }
    public string? LinkUrl { get; set; }
    public bool IsApproved { get; set; } = false; // Deprecated: use Status instead
    public TemplateStatus Status { get; set; } = TemplateStatus.Draft;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public User? Creator { get; set; }
}
