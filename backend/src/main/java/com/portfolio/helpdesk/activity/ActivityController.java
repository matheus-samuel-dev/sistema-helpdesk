package com.portfolio.helpdesk.activity;

import com.portfolio.helpdesk.common.PageResponse;
import com.portfolio.helpdesk.security.AuthenticatedUser;
import com.portfolio.helpdesk.user.UserRole;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/activities")
@RequiredArgsConstructor
public class ActivityController {
    private final ActivityService service;

    @GetMapping
    public PageResponse<ActivityDtos.Response> list(
        @RequestParam(required = false) String text,
        @RequestParam(required = false) ActivityEventType type,
        @RequestParam(required = false) UserRole role,
        @RequestParam(required = false) Long userId,
        @RequestParam(required = false) Long ticketId,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
        @PageableDefault(size = 10, sort = "createdAt") Pageable page,
        @AuthenticationPrincipal AuthenticatedUser actor
    ) {
        return PageResponse.from(service.list(text, type, role, userId, ticketId, startDate, endDate, actor, page));
    }
}
