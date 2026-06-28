package com.portfolio.helpdesk.comment;

import com.portfolio.helpdesk.activity.ActivityEventType;
import com.portfolio.helpdesk.activity.ActivityService;
import com.portfolio.helpdesk.exception.ResourceNotFoundException;
import com.portfolio.helpdesk.security.AuthenticatedUser;
import com.portfolio.helpdesk.ticket.HistoryEventType;
import com.portfolio.helpdesk.ticket.TicketService;
import com.portfolio.helpdesk.user.User;
import com.portfolio.helpdesk.user.UserRepository;
import com.portfolio.helpdesk.user.UserRole;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CommentService {
    private final CommentRepository comments;
    private final TicketService tickets;
    private final UserRepository users;
    private final ActivityService activities;

    @Transactional(readOnly = true)
    public List<CommentDtos.Response> list(Long ticketId, AuthenticatedUser actor) {
        var ticket = tickets.entity(ticketId);
        tickets.assertView(ticket, actor);
        return comments.findByTicketIdOrderByCreatedAtAsc(ticketId).stream()
            .filter(comment -> actor.role() != UserRole.CLIENTE || !comment.isInternal())
            .map(CommentDtos::response)
            .toList();
    }

    @Transactional
    public CommentDtos.Response create(Long ticketId, CommentDtos.CreateRequest request, AuthenticatedUser actor) {
        var ticket = tickets.entity(ticketId);
        tickets.assertView(ticket, actor);
        validateInternalPermission(request.internal(), actor);
        var author = user(actor.id());

        var comment = new Comment();
        comment.setTicket(ticket);
        comment.setAuthor(author);
        comment.setText(request.text().trim());
        comment.setInternal(request.internal());
        var saved = comments.save(comment);

        String visibility = saved.isInternal() ? "interno" : "público";
        tickets.record(ticket, author, HistoryEventType.COMENTARIO, "Comentário " + visibility + " adicionado por " + author.getName() + ".");
        return CommentDtos.response(saved);
    }

    @Transactional
    public CommentDtos.Response update(Long ticketId, Long commentId, CommentDtos.UpdateRequest request, AuthenticatedUser actor) {
        var ticket = tickets.entity(ticketId);
        tickets.assertView(ticket, actor);
        validateInternalPermission(request.internal(), actor);

        var comment = entity(commentId);
        if (!comment.getTicket().getId().equals(ticketId)) {
            throw new ResourceNotFoundException("Comentário não encontrado.");
        }
        assertCanManageComment(comment, actor);

        comment.setText(request.text().trim());
        comment.setInternal(request.internal());
        activities.record(
            ActivityEventType.COMENTARIO_EDITADO,
            "Comentário editado",
            "Comentário atualizado no chamado #" + ticket.getId() + ".",
            user(actor.id()),
            ticket
        );
        return CommentDtos.response(comment);
    }

    @Transactional
    public void delete(Long ticketId, Long commentId, AuthenticatedUser actor) {
        var ticket = tickets.entity(ticketId);
        tickets.assertView(ticket, actor);
        var comment = entity(commentId);
        if (!comment.getTicket().getId().equals(ticketId)) {
            throw new ResourceNotFoundException("Comentário não encontrado.");
        }
        assertCanManageComment(comment, actor);

        User actorUser = user(actor.id());
        comments.delete(comment);
        tickets.record(ticket, actorUser, HistoryEventType.COMENTARIO_REMOVIDO, "Comentário removido por " + actorUser.getName() + ".");
    }

    private Comment entity(Long id) {
        return comments.findById(id).orElseThrow(() -> new ResourceNotFoundException("Comentário não encontrado."));
    }

    private User user(Long id) {
        return users.findById(id).orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));
    }

    private void validateInternalPermission(boolean internal, AuthenticatedUser actor) {
        if (internal && actor.role() == UserRole.CLIENTE) {
            throw new AccessDeniedException("Clientes não podem criar comentários internos.");
        }
    }

    private void assertCanManageComment(Comment comment, AuthenticatedUser actor) {
        boolean author = comment.getAuthor().getId().equals(actor.id());
        boolean admin = actor.role() == UserRole.ADMIN;
        if (!author && !admin) {
            throw new AccessDeniedException("Você não tem permissão para alterar este comentário.");
        }
    }
}
