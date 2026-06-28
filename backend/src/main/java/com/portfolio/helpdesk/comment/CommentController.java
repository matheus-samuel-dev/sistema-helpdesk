package com.portfolio.helpdesk.comment;

import com.portfolio.helpdesk.security.AuthenticatedUser;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tickets/{ticketId}/comments")
@RequiredArgsConstructor
public class CommentController {
    private final CommentService service;

    @GetMapping
    public List<CommentDtos.Response> list(@PathVariable Long ticketId, @AuthenticationPrincipal AuthenticatedUser actor) {
        return service.list(ticketId, actor);
    }

    @PostMapping
    public ResponseEntity<CommentDtos.Response> create(
        @PathVariable Long ticketId,
        @Valid @RequestBody CommentDtos.CreateRequest request,
        @AuthenticationPrincipal AuthenticatedUser actor
    ) {
        return ResponseEntity.status(201).body(service.create(ticketId, request, actor));
    }

    @PutMapping("/{commentId}")
    public CommentDtos.Response update(
        @PathVariable Long ticketId,
        @PathVariable Long commentId,
        @Valid @RequestBody CommentDtos.UpdateRequest request,
        @AuthenticationPrincipal AuthenticatedUser actor
    ) {
        return service.update(ticketId, commentId, request, actor);
    }

    @DeleteMapping("/{commentId}")
    @ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT)
    public void delete(
        @PathVariable Long ticketId,
        @PathVariable Long commentId,
        @AuthenticationPrincipal AuthenticatedUser actor
    ) {
        service.delete(ticketId, commentId, actor);
    }
}
