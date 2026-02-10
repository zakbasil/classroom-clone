namespace ClassroomClone.Api.DTOs;

public record CreateAnnouncementRequest(string ClassId, string Content);

public record AnnouncementAttachmentDto(string Name, string Type, string Url);

public record AnnouncementResponse(
    string Id,
    string ClassId,
    string AuthorId,
    string AuthorName,
    string? AuthorAvatar,
    string Content,
    string CreatedAt,
    List<AnnouncementAttachmentDto>? Attachments
);
