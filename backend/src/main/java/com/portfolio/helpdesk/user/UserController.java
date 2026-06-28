package com.portfolio.helpdesk.user;

import com.portfolio.helpdesk.common.PageResponse;
import com.portfolio.helpdesk.security.AuthenticatedUser;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class UserController {
    private final UserService service;

    @GetMapping
    public PageResponse<UserDtos.Response> list(
        @RequestParam(required = false) String text,
        @RequestParam(required = false) UserRole role,
        @RequestParam(required = false) Boolean active,
        @PageableDefault(size = 10, sort = "name") Pageable page
    ) {
        return PageResponse.from(service.list(text, role, active, page));
    }

    @GetMapping("/{id}")
    public UserDtos.Response get(@PathVariable Long id) {
        return service.get(id);
    }

    @PostMapping
    public ResponseEntity<UserDtos.Response> create(
        @Valid @RequestBody UserDtos.CreateRequest request,
        @AuthenticationPrincipal AuthenticatedUser actor
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request, actor));
    }

    @PutMapping("/{id}")
    public UserDtos.Response update(
        @PathVariable Long id,
        @Valid @RequestBody UserDtos.UpdateRequest request,
        @AuthenticationPrincipal AuthenticatedUser actor
    ) {
        return service.update(id, request, actor);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deactivate(@PathVariable Long id, @AuthenticationPrincipal AuthenticatedUser actor) {
        service.deactivate(id, actor);
    }
}
