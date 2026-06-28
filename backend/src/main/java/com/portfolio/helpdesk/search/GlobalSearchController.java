package com.portfolio.helpdesk.search;

import com.portfolio.helpdesk.security.AuthenticatedUser;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
public class GlobalSearchController {
    private final GlobalSearchService service;

    @GetMapping
    public SearchDtos.Response search(@RequestParam String q, @AuthenticationPrincipal AuthenticatedUser actor) {
        return service.search(q, actor);
    }
}
