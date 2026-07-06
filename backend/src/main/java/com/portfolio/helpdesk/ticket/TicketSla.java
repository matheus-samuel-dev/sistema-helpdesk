package com.portfolio.helpdesk.ticket;

import java.time.OffsetDateTime;
import java.time.temporal.ChronoUnit;

public final class TicketSla {
    private TicketSla() {}

    public static long hoursFor(TicketPriority priority) {
        return priority.slaHours();
    }

    public static OffsetDateTime dueAt(Ticket ticket) {
        return ticket.getCreatedAt().plusHours(hoursFor(ticket.getPriority()));
    }

    public static SlaStatus status(Ticket ticket, OffsetDateTime now) {
        OffsetDateTime reference = ticket.getResolvedAt() != null ? ticket.getResolvedAt() : now;
        OffsetDateTime dueAt = dueAt(ticket);
        if (reference.isAfter(dueAt)) {
            return SlaStatus.VENCIDO;
        }
        long totalMinutes = ChronoUnit.MINUTES.between(ticket.getCreatedAt(), dueAt);
        long remainingMinutes = ChronoUnit.MINUTES.between(reference, dueAt);
        if (ticket.getResolvedAt() == null && remainingMinutes <= Math.max(60, totalMinutes / 4)) {
            return SlaStatus.PROXIMO_DO_VENCIMENTO;
        }
        return SlaStatus.DENTRO_DO_PRAZO;
    }

    public static long minutesRemaining(Ticket ticket, OffsetDateTime now) {
        OffsetDateTime reference = ticket.getResolvedAt() != null ? ticket.getResolvedAt() : now;
        return ChronoUnit.MINUTES.between(reference, dueAt(ticket));
    }

    public static long openMinutes(Ticket ticket, OffsetDateTime now) {
        OffsetDateTime end = ticket.getResolvedAt() != null ? ticket.getResolvedAt() : now;
        return ChronoUnit.MINUTES.between(ticket.getCreatedAt(), end);
    }

    public static Long resolutionMinutes(Ticket ticket) {
        return ticket.getResolvedAt() == null
            ? null
            : ChronoUnit.MINUTES.between(ticket.getCreatedAt(), ticket.getResolvedAt());
    }
}
