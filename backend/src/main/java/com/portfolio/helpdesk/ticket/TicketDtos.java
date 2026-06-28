package com.portfolio.helpdesk.ticket;

import com.portfolio.helpdesk.user.UserDtos;
import jakarta.validation.constraints.*;
import java.time.OffsetDateTime;

public final class TicketDtos {
    private TicketDtos() {}
    public record CreateRequest(
        @NotBlank(message = "Informe o título do chamado.")
        @Size(max = 160, message = "O título deve ter no máximo 160 caracteres.")
        String title,
        @NotBlank(message = "Informe a descrição do chamado.")
        @Size(max = 5000, message = "A descrição deve ter no máximo 5000 caracteres.")
        String description,
        @NotNull(message = "Selecione a prioridade.")
        TicketPriority priority,
        @NotNull(message = "Selecione a categoria.")
        TicketCategory category,
        Long clientId
    ) {}
    public record UpdateRequest(
        @Size(min = 3, max = 160, message = "O título deve ter entre 3 e 160 caracteres.")
        String title,
        @Size(min = 10, max = 5000, message = "A descrição deve ter entre 10 e 5000 caracteres.")
        String description,
        TicketStatus status, TicketPriority priority, TicketCategory category, Long technicianId) {}
    public record Response(
        Long id,
        String title,
        String description,
        UserDtos.Summary client,
        UserDtos.Summary technician,
        TicketStatus status,
        TicketPriority priority,
        TicketCategory category,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt,
        OffsetDateTime resolvedAt,
        OffsetDateTime slaDueAt,
        SlaStatus slaStatus,
        long slaMinutesRemaining,
        long openMinutes,
        Long resolutionMinutes
    ) {}
    public record HistoryResponse(Long id, HistoryEventType eventType, String description, UserDtos.Summary actor, OffsetDateTime createdAt) {}
    public static Response response(Ticket t) {
        OffsetDateTime now = OffsetDateTime.now();
        return new Response(
            t.getId(),
            t.getTitle(),
            t.getDescription(),
            UserDtos.summary(t.getClient()),
            t.getTechnician()==null?null:UserDtos.summary(t.getTechnician()),
            t.getStatus(),
            t.getPriority(),
            t.getCategory(),
            t.getCreatedAt(),
            t.getUpdatedAt(),
            t.getResolvedAt(),
            TicketSla.dueAt(t),
            TicketSla.status(t, now),
            TicketSla.minutesRemaining(t, now),
            TicketSla.openMinutes(t, now),
            TicketSla.resolutionMinutes(t)
        );
    }
    public static HistoryResponse history(TicketHistory h) { return new HistoryResponse(h.getId(),h.getEventType(),h.getDescription(),UserDtos.summary(h.getActor()),h.getCreatedAt()); }
}
