namespace ClassroomClone.Api.DTOs;

public record MaterialAttachmentDto(string Name, string Type, string Url);

public record CreateMaterialRequest(string ClassId, string Title, string? Description, string? Topic);

public record MaterialResponse(
    string Id,
    string ClassId,
    string Title,
    string? Description,
    string? Topic,
    string CreatedAt,
    List<MaterialAttachmentDto> Attachments
);
