package com.portfolio.helpdesk.activity;

import com.portfolio.helpdesk.ticket.Ticket;
import com.portfolio.helpdesk.user.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;

@Entity
@Table(name = "activity_events")
@Getter
@Setter
@NoArgsConstructor
public class ActivityEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private ActivityEventType type;

    @Column(nullable = false, length = 160)
    private String title;

    @Column(nullable = false, length = 700)
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actor_id")
    private User actor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ticket_id")
    private Ticket ticket;

    @Column(nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    void create() {
        createdAt = OffsetDateTime.now();
    }
}
