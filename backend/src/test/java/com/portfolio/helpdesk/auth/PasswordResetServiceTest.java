package com.portfolio.helpdesk.auth;

import com.portfolio.helpdesk.activity.ActivityService;
import com.portfolio.helpdesk.exception.BusinessException;
import com.portfolio.helpdesk.user.User;
import com.portfolio.helpdesk.user.UserRepository;
import com.portfolio.helpdesk.user.UserRole;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.OffsetDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PasswordResetServiceTest {
    @Mock
    PasswordResetTokenRepository tokens;

    @Mock
    UserRepository users;

    @Mock
    PasswordEncoder encoder;

    @Mock
    ActivityService activities;

    @InjectMocks
    PasswordResetService service;

    @Test
    void requestGeneratesTokenForExistingUser() {
        var user = user();
        when(users.findByEmailIgnoreCase("cliente@x.com")).thenReturn(Optional.of(user));

        var response = service.request(new AuthController.PasswordResetRequest(" cliente@x.com "));

        assertThat(response.token()).isNotBlank();
        assertThat(response.expiresAt()).isAfter(OffsetDateTime.now());
        verify(tokens).save(argThat(token -> token.getUser().equals(user) && token.getToken().length() == 32));
    }

    @Test
    void expiredTokenIsRejected() {
        var token = token(OffsetDateTime.now().minusMinutes(1));
        when(tokens.findByToken("abc")).thenReturn(Optional.of(token));

        assertThatThrownBy(() -> service.confirm(new AuthController.PasswordResetConfirmRequest("abc", "NovaSenha123")))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("expirado");
        verify(encoder, never()).encode(any());
    }

    @Test
    void validTokenUpdatesPasswordAndMarksTokenAsUsed() {
        var token = token(OffsetDateTime.now().plusMinutes(30));
        when(tokens.findByToken("abc")).thenReturn(Optional.of(token));
        when(encoder.encode("NovaSenha123")).thenReturn("hash");

        var response = service.confirm(new AuthController.PasswordResetConfirmRequest("abc", "NovaSenha123"));

        assertThat(response.message()).contains("sucesso");
        assertThat(token.getUser().getPassword()).isEqualTo("hash");
        assertThat(token.getUsedAt()).isNotNull();
        verify(activities).record(any(), any(), any(), any(), any());
    }

    private PasswordResetToken token(OffsetDateTime expiresAt) {
        var token = new PasswordResetToken();
        token.setToken("abc");
        token.setUser(user());
        token.setExpiresAt(expiresAt);
        return token;
    }

    private User user() {
        var user = new User();
        user.setId(1L);
        user.setName("Cliente");
        user.setEmail("cliente@x.com");
        user.setRole(UserRole.CLIENTE);
        user.setActive(true);
        user.setPassword("old-hash");
        return user;
    }
}

