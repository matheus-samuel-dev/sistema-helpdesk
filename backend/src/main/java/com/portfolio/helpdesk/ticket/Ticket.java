package com.portfolio.helpdesk.ticket;

import com.portfolio.helpdesk.user.User;
import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;

@Entity @Table(name = "tickets") @Getter @Setter @NoArgsConstructor
public class Ticket {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable = false, length = 160) private String title;
    @Column(nullable = false, columnDefinition = "TEXT") private String description;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "client_id") private User client;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "technician_id") private User technician;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 30) private TicketStatus status;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20) private TicketPriority priority;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 30) private TicketCategory category;
    @Column(nullable = false, updatable = false) private OffsetDateTime createdAt;
    @Column(nullable = false) private OffsetDateTime updatedAt;
    private OffsetDateTime resolvedAt;
    @PrePersist void create() { createdAt = updatedAt = OffsetDateTime.now(); }
    @PreUpdate void update() { updatedAt = OffsetDateTime.now(); }
}
