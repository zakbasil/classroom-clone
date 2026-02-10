namespace ClassroomClone.Api.Models;

public enum TemplateType
{
    Quiz = 0,
    Assignment = 1,
    Material = 2
}

public enum ApprovalStatus
{
    Pending = 0,
    Approved = 1,
    Rejected = 2
}

public class TemplateApprovalHistory
{
    public Guid Id { get; set; }
    public TemplateType TemplateType { get; set; }
    public Guid TemplateId { get; set; }
    public Guid CreatedBy { get; set; }
    public Guid? ReviewedBy { get; set; }
    public ApprovalStatus Status { get; set; }
    public string? Comments { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime ReviewedAt { get; set; }

    public User? Creator { get; set; }
    public User? Reviewer { get; set; }
}
