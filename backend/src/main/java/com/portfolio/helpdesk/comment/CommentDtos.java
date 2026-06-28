package com.portfolio.helpdesk.comment;

import com.portfolio.helpdesk.user.UserDtos;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.OffsetDateTime;

public final class CommentDtos {
    private CommentDtos() {}

    public record CreateRequest(
        @NotBlank(message = "Digite um comentário para continuar.")
        @Size(max = 2000, message = "O comentário deve ter no máximo 2000 caracteres.")
        String text,
        boolean internal
    ) {}

    public record UpdateRequest(
        @NotBlank(message = "Digite um comentário para continuar.")
        @Size(max = 2000, message = "O comentário deve ter no máximo 2000 caracteres.")
        String text,
        boolean internal
    ) {}

    public record Response(
        Long id,
        Long ticketId,
        UserDtos.Summary author,
        String text,
        boolean internal,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
    ) {}

    public static Response response(Comment comment) {
        return new Response(
            comment.getId(),
            comment.getTicket().getId(),
            UserDtos.summary(comment.getAuthor()),
            comment.getText(),
            comment.isInternal(),
            comment.getCreatedAt(),
            comment.getUpdatedAt()
        );
    }
}
