package com.portfolio.helpdesk.activity;

import com.portfolio.helpdesk.ticket.TicketDtos;
import com.portfolio.helpdesk.user.UserDtos;

import java.time.OffsetDateTime;

public final class ActivityDtos {
    private ActivityDtos() {}

    public record Response(
        Long id,
        ActivityEventType type,
        String title,
        String description,
        UserDtos.Summary actor,
        TicketDtos.Response ticket,
        OffsetDateTime createdAt
    ) {}

    public static Response response(ActivityEvent event) {
        return new Response(
            event.getId(),
            event.getType(),
            event.getTitle(),
            event.getDescription(),
            event.getActor() == null ? null : UserDtos.summary(event.getActor()),
            event.getTicket() == null ? null : TicketDtos.response(event.getTicket()),
            event.getCreatedAt()
        );
    }
}
