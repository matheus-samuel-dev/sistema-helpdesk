package com.portfolio.helpdesk.attachment;

import com.portfolio.helpdesk.user.UserDtos;

import java.time.OffsetDateTime;

public final class AttachmentDtos {
    private AttachmentDtos() {}

    public record Response(
        Long id,
        Long ticketId,
        String name,
        String contentType,
        long sizeBytes,
        UserDtos.Summary author,
        OffsetDateTime createdAt
    ) {}

    public static Response response(TicketAttachment attachment) {
        return new Response(
            attachment.getId(),
            attachment.getTicket().getId(),
            attachment.getOriginalName(),
            attachment.getContentType(),
            attachment.getSizeBytes(),
            UserDtos.summary(attachment.getAuthor()),
            attachment.getCreatedAt()
        );
    }
}
