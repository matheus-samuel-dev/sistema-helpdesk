package com.portfolio.helpdesk.activity;

import com.portfolio.helpdesk.security.AuthenticatedUser;
import com.portfolio.helpdesk.ticket.Ticket;
import com.portfolio.helpdesk.user.User;
import com.portfolio.helpdesk.user.UserRole;
import jakarta.persistence.criteria.JoinType;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneOffset;

@Service
@RequiredArgsConstructor
public class ActivityService {
    private final ActivityRepository repository;

    @Transactional
    public void record(ActivityEventType type, String title, String description, User actor, Ticket ticket) {
        ActivityEvent event = new ActivityEvent();
        event.setType(type);
        event.setTitle(title);
        event.setDescription(description);
        event.setActor(actor);
        event.setTicket(ticket);
        repository.save(event);
    }

    @Transactional(readOnly = true)
    public Page<ActivityDtos.Response> list(
        String text,
        ActivityEventType type,
        UserRole role,
        Long userId,
        Long ticketId,
        LocalDate from,
        LocalDate to,
        AuthenticatedUser actor,
        Pageable pageable
    ) {
        return repository.findAll((root, query, cb) -> {
            var predicate = cb.conjunction();
            var actorJoin = root.join("actor", JoinType.LEFT);
            var ticketJoin = root.join("ticket", JoinType.LEFT);
            var clientJoin = ticketJoin.join("client", JoinType.LEFT);
            var technicianJoin = ticketJoin.join("technician", JoinType.LEFT);

            if (query != null) {
                query.distinct(true);
            }

            if (actor.role() == UserRole.TECNICO) {
                predicate = cb.and(predicate, cb.or(
                    cb.equal(technicianJoin.get("id"), actor.id()),
                    cb.equal(actorJoin.get("id"), actor.id())
                ));
            } else if (actor.role() == UserRole.CLIENTE) {
                predicate = cb.and(predicate, cb.or(
                    cb.equal(clientJoin.get("id"), actor.id()),
                    cb.equal(actorJoin.get("id"), actor.id())
                ));
            }

            if (text != null && !text.isBlank()) {
                String like = "%" + text.trim().toLowerCase() + "%";
                predicate = cb.and(predicate, cb.or(
                    cb.like(cb.lower(root.get("title")), like),
                    cb.like(cb.lower(root.get("description")), like),
                    cb.like(cb.lower(actorJoin.get("name")), like),
                    cb.like(cb.lower(actorJoin.get("email")), like),
                    cb.like(cb.lower(ticketJoin.get("title")), like)
                ));
            }
            if (type != null) {
                predicate = cb.and(predicate, cb.equal(root.get("type"), type));
            }
            if (role != null) {
                predicate = cb.and(predicate, cb.equal(actorJoin.get("role"), role));
            }
            if (userId != null) {
                predicate = cb.and(predicate, cb.equal(actorJoin.get("id"), userId));
            }
            if (ticketId != null) {
                predicate = cb.and(predicate, cb.equal(ticketJoin.get("id"), ticketId));
            }
            if (from != null) {
                predicate = cb.and(predicate, cb.greaterThanOrEqualTo(root.get("createdAt"), from.atStartOfDay().atOffset(ZoneOffset.UTC)));
            }
            if (to != null) {
                predicate = cb.and(predicate, cb.lessThan(root.get("createdAt"), to.plusDays(1).atStartOfDay().atOffset(ZoneOffset.UTC)));
            }
            return predicate;
        }, pageable).map(ActivityDtos::response);
    }
}
