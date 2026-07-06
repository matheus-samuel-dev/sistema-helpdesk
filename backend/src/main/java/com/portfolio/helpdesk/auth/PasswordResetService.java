package com.portfolio.helpdesk.auth;

import com.portfolio.helpdesk.activity.ActivityEventType;
import com.portfolio.helpdesk.activity.ActivityService;
import com.portfolio.helpdesk.exception.BusinessException;
import com.portfolio.helpdesk.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PasswordResetService {
    private static final long EXPIRATION_MINUTES = 30;

    private final PasswordResetTokenRepository tokens;
    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final ActivityService activities;

    @Transactional
    public AuthController.PasswordResetResponse request(AuthController.PasswordResetRequest request) {
        return users.findByEmailIgnoreCase(request.email().trim())
            .map(user -> {
                PasswordResetToken token = new PasswordResetToken();
                token.setUser(user);
                token.setToken(UUID.randomUUID().toString().replace("-", ""));
                token.setExpiresAt(OffsetDateTime.now().plusMinutes(EXPIRATION_MINUTES));
                tokens.save(token);
                log.info("Password reset token generated userId={} expiresAt={}", user.getId(), token.getExpiresAt());
                return new AuthController.PasswordResetResponse(
                    "Token de redefinição gerado para demonstração.",
                    token.getToken(),
                    token.getExpiresAt()
                );
            })
            .orElseGet(() -> new AuthController.PasswordResetResponse(
                "Se o e-mail existir, um token de redefinição será gerado.",
                null,
                null
            ));
    }

    @Transactional
    public AuthController.MessageResponse confirm(AuthController.PasswordResetConfirmRequest request) {
        PasswordResetToken token = tokens.findByToken(request.token().trim())
            .orElseThrow(() -> new BusinessException("Token de redefinição inválido."));
        if (token.getUsedAt() != null) {
            throw new BusinessException("Este token já foi utilizado.");
        }
        if (token.getExpiresAt().isBefore(OffsetDateTime.now())) {
            throw new BusinessException("Token expirado. Solicite uma nova redefinição.");
        }

        token.getUser().setPassword(encoder.encode(request.password()));
        token.setUsedAt(OffsetDateTime.now());
        log.info("Password reset completed userId={}", token.getUser().getId());
        activities.record(
            ActivityEventType.SENHA_REDEFINIDA,
            "Senha redefinida",
            "Senha redefinida por fluxo de recuperação.",
            token.getUser(),
            null
        );
        return new AuthController.MessageResponse("Senha redefinida com sucesso.");
    }
}
