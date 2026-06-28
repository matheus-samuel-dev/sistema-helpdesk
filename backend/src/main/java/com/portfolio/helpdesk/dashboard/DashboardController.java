package com.portfolio.helpdesk.dashboard;
import com.portfolio.helpdesk.security.AuthenticatedUser;
import lombok.RequiredArgsConstructor; import org.springframework.security.core.annotation.AuthenticationPrincipal; import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/dashboard") @RequiredArgsConstructor
public class DashboardController {
 private final DashboardService service;
 @GetMapping public DashboardDtos.Response get(@AuthenticationPrincipal AuthenticatedUser a){return service.get(a);}
}
