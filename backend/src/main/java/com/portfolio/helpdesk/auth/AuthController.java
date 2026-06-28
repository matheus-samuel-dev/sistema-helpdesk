package com.portfolio.helpdesk.auth;

import com.portfolio.helpdesk.activity.ActivityEventType;
import com.portfolio.helpdesk.activity.ActivityService;
import com.portfolio.helpdesk.security.AuthenticatedUser;
import com.portfolio.helpdesk.security.JwtService;
import com.portfolio.helpdesk.user.UserDtos;
import com.portfolio.helpdesk.user.UserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthenticationManager authenticationManager;
    private final JwtService jwt;
    private final PasswordResetService passwordReset;
    private final UserRepository users;
    private final ActivityService activities;

    public record LoginRequest(@Email String email, @NotBlank String password) {}
    public record LoginResponse(String token, String tokenType, long expiresIn, UserDtos.Summary user) {}
    public record PasswordResetRequest(@NotBlank @Email String email) {}
    public record PasswordResetConfirmRequest(
        @NotBlank String token,
        @NotBlank @Size(min = 8, max = 72, message = "A senha deve ter entre 8 e 72 caracteres.") String password
    ) {}
    public record PasswordResetResponse(String message, String token, OffsetDateTime expiresAt) {}
    public record MessageResponse(String message) {}

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        var auth = authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(request.email(), request.password()));
        var principal = (AuthenticatedUser) auth.getPrincipal();
        users.findById(principal.id()).ifPresent(user -> activities.record(
            ActivityEventType.LOGIN_REALIZADO,
            "Login realizado",
            "Usuário entrou no sistema.",
            user,
            null
        ));
        return new LoginResponse(jwt.generate(principal), "Bearer", jwt.expirationSeconds(), new UserDtos.Summary(principal.id(), principal.name(), principal.email(), principal.role(), principal.active()));
    }

    @PostMapping("/logout")
    public MessageResponse logout(@AuthenticationPrincipal AuthenticatedUser principal) {
        users.findById(principal.id()).ifPresent(user -> activities.record(
            ActivityEventType.LOGOUT_REALIZADO,
            "Logout realizado",
            "Usuário saiu do sistema.",
            user,
            null
        ));
        return new MessageResponse("Logout registrado.");
    }

    @PostMapping("/password-reset/request")
    public PasswordResetResponse requestPasswordReset(@Valid @RequestBody PasswordResetRequest request) {
        return passwordReset.request(request);
    }

    @PostMapping("/password-reset/confirm")
    public MessageResponse confirmPasswordReset(@Valid @RequestBody PasswordResetConfirmRequest request) {
        return passwordReset.confirm(request);
    }

    @GetMapping("/me")
    public UserDtos.Summary me(@AuthenticationPrincipal AuthenticatedUser principal) {
        return new UserDtos.Summary(principal.id(), principal.name(), principal.email(), principal.role(), principal.active());
    }
}
