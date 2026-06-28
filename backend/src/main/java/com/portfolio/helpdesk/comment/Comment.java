package com.portfolio.helpdesk.comment;

import com.portfolio.helpdesk.ticket.Ticket;
import com.portfolio.helpdesk.user.User;
import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;

@Entity @Table(name = "comments") @Getter @Setter @NoArgsConstructor
public class Comment {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "ticket_id") private Ticket ticket;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "author_id") private User author;
    @Column(nullable = false, length = 2000) private String text;
    @Column(nullable = false) private boolean internal;
    @Column(nullable = false, updatable = false) private OffsetDateTime createdAt;
    @Column(nullable = false) private OffsetDateTime updatedAt;
    @PrePersist void create() { createdAt = updatedAt = OffsetDateTime.now(); }
    @PreUpdate void update() { updatedAt = OffsetDateTime.now(); }
}
