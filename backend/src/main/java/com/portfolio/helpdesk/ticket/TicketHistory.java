package com.portfolio.helpdesk.ticket;

import com.portfolio.helpdesk.user.User;
import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;

@Entity @Table(name = "ticket_history") @Getter @Setter @NoArgsConstructor
public class TicketHistory {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "ticket_id") private Ticket ticket;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "actor_id") private User actor;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 40) private HistoryEventType eventType;
    @Column(nullable = false, length = 500) private String description;
    @Column(nullable = false, updatable = false) private OffsetDateTime createdAt;
    @PrePersist void create() { createdAt = OffsetDateTime.now(); }
}
