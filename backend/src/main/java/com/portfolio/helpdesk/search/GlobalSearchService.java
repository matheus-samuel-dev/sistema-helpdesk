package com.portfolio.helpdesk.search;

import com.portfolio.helpdesk.comment.CommentRepository;
import com.portfolio.helpdesk.security.AuthenticatedUser;
import com.portfolio.helpdesk.ticket.Ticket;
import com.portfolio.helpdesk.ticket.TicketCategory;
import com.portfolio.helpdesk.ticket.TicketRepository;
import com.portfolio.helpdesk.user.UserRepository;
import com.portfolio.helpdesk.user.UserRole;
import jakarta.persistence.criteria.JoinType;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.text.Normalizer;

@Service
@RequiredArgsConstructor
public class GlobalSearchService {
    private final TicketRepository tickets;
    private final UserRepository users;
    private final CommentRepository comments;

    @Transactional(readOnly = true)
    public SearchDtos.Response search(String query, AuthenticatedUser actor) {
        String text = query == null ? "" : query.trim();
        if (text.length() < 2) {
            return new SearchDtos.Response(List.of(), List.of(), List.of(), List.of());
        }
        String like = "%" + text.toLowerCase() + "%";
        String enumLike = "%" + enumSearch(text) + "%";

        var ticketResults = tickets.findAll((root, criteria, cb) -> {
            var client = root.join("client");
            var technician = root.join("technician", JoinType.LEFT);
            var predicate = cb.or(
                cb.like(cb.lower(root.get("title")), like),
                cb.like(cb.lower(root.get("description")), like),
                cb.like(cb.lower(root.get("status").as(String.class)), enumLike),
                cb.like(cb.lower(root.get("priority").as(String.class)), enumLike),
                cb.like(cb.lower(root.get("category").as(String.class)), enumLike),
                cb.like(cb.lower(client.get("name")), like),
                cb.like(cb.lower(client.get("email")), like),
                cb.like(cb.lower(technician.get("name")), like),
                cb.like(cb.lower(technician.get("email")), like)
            );
            try {
                predicate = cb.or(predicate, cb.equal(root.get("id"), Long.parseLong(text)));
            } catch (NumberFormatException ignored) {
                // Search text is not an id.
            }
            if (actor.role() == UserRole.CLIENTE) {
                predicate = cb.and(predicate, cb.equal(client.get("id"), actor.id()));
            } else if (actor.role() == UserRole.TECNICO) {
                predicate = cb.and(predicate, cb.equal(technician.get("id"), actor.id()));
            }
            if (criteria != null) {
                criteria.distinct(true);
            }
            return predicate;
        }, PageRequest.of(0, 6)).stream()
            .map(ticket -> new SearchDtos.Result(
                "ticket",
                "#" + ticket.getId() + " " + ticket.getTitle(),
                ticketDescription(ticket),
                "/tickets/" + ticket.getId()
            ))
            .toList();

        var userResults = actor.role() == UserRole.ADMIN
            ? users.findAll((root, criteria, cb) -> cb.or(
                cb.like(cb.lower(root.get("name")), like),
                cb.like(cb.lower(root.get("email")), like)
            ), PageRequest.of(0, 5)).stream()
                .map(user -> new SearchDtos.Result(
                    "user",
                    user.getName(),
                    user.getEmail() + " · " + user.getRole(),
                    "/users"
                ))
                .toList()
            : List.<SearchDtos.Result>of();

        var categoryResults = Arrays.stream(TicketCategory.values())
            .filter(category -> category.name().toLowerCase().contains(text.toLowerCase()) || category.label().toLowerCase().contains(text.toLowerCase()))
            .limit(5)
            .map(category -> new SearchDtos.Result(
                "category",
                category.label(),
                "Categoria de chamados",
                "/tickets?category=" + category.name()
            ))
            .toList();

        var commentResults = comments.findAll((root, criteria, cb) -> {
            var ticket = root.join("ticket");
            var client = ticket.join("client");
            var technician = ticket.join("technician", JoinType.LEFT);
            var predicate = cb.like(cb.lower(root.get("text")), like);
            if (actor.role() == UserRole.CLIENTE) {
                predicate = cb.and(predicate, cb.equal(client.get("id"), actor.id()), cb.isFalse(root.get("internal")));
            } else if (actor.role() == UserRole.TECNICO) {
                predicate = cb.and(predicate, cb.equal(technician.get("id"), actor.id()));
            }
            if (criteria != null) {
                criteria.distinct(true);
            }
            return predicate;
        }, PageRequest.of(0, 5)).stream()
            .map(comment -> new SearchDtos.Result(
                "comment",
                "Comentário em #" + comment.getTicket().getId(),
                comment.getText().length() > 90 ? comment.getText().substring(0, 90) + "..." : comment.getText(),
                "/tickets/" + comment.getTicket().getId()
            ))
            .toList();

        return new SearchDtos.Response(ticketResults, userResults, categoryResults, commentResults);
    }

    private String enumSearch(String text) {
        String normalized = Normalizer.normalize(text, Normalizer.Form.NFD)
            .replaceAll("\\p{M}", "")
            .toLowerCase()
            .trim()
            .replaceAll("[^a-z0-9]+", "_");
        return normalized.replaceAll("^_+|_+$", "");
    }

    private String ticketDescription(Ticket ticket) {
        String owner = ticket.getTechnician() == null ? "Sem responsável" : ticket.getTechnician().getName();
        return ticket.getCategory().label() + " · " + ticket.getStatus() + " · " + owner;
    }
}
