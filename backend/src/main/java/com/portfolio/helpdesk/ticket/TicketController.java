package com.portfolio.helpdesk.ticket;

import com.portfolio.helpdesk.common.PageResponse;
import com.portfolio.helpdesk.security.AuthenticatedUser;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class TicketController {
    private final TicketService service;

    @PostMapping
    @PreAuthorize("hasAnyRole('CLIENTE','ADMIN')")
    public ResponseEntity<TicketDtos.Response> create(
        @Valid @RequestBody TicketDtos.CreateRequest request,
        @AuthenticationPrincipal AuthenticatedUser actor
    ) {
        return ResponseEntity.status(201).body(service.create(request, actor));
    }

    @GetMapping
    public PageResponse<TicketDtos.Response> list(
        @RequestParam(required = false) TicketStatus status,
        @RequestParam(required = false) TicketPriority priority,
        @RequestParam(required = false) TicketCategory category,
        @RequestParam(required = false) Long technicianId,
        @RequestParam(required = false) Long clientId,
        @RequestParam(required = false) String text,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
        @RequestParam(defaultValue = "updatedAt") String sortBy,
        @RequestParam(defaultValue = "desc") String direction,
        @PageableDefault(size = 10) Pageable page,
        @AuthenticationPrincipal AuthenticatedUser actor
    ) {
        return PageResponse.from(service.list(
            status,
            priority,
            category,
            technicianId,
            clientId,
            text,
            startDate,
            endDate,
            sortBy,
            direction,
            actor,
            page
        ));
    }

    @GetMapping("/{id}")
    public TicketDtos.Response get(@PathVariable Long id, @AuthenticationPrincipal AuthenticatedUser actor) {
        return service.get(id, actor);
    }

    @PatchMapping("/{id}")
    public TicketDtos.Response update(
        @PathVariable Long id,
        @Valid @RequestBody TicketDtos.UpdateRequest request,
        @AuthenticationPrincipal AuthenticatedUser actor
    ) {
        return service.update(id, request, actor);
    }

    @GetMapping("/{id}/history")
    public List<TicketDtos.HistoryResponse> history(
        @PathVariable Long id,
        @AuthenticationPrincipal AuthenticatedUser actor
    ) {
        return service.history(id, actor);
    }
}
