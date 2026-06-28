package com.portfolio.helpdesk.user;

import com.portfolio.helpdesk.activity.ActivityService;
import com.portfolio.helpdesk.exception.BusinessException;
import com.portfolio.helpdesk.security.AuthenticatedUser;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {
    @Mock
    UserRepository repository;

    @Mock
    PasswordEncoder encoder;

    @Mock
    ActivityService activities;

    @InjectMocks
    UserService service;

    @Test
    void duplicateEmailIsRejected() {
        when(repository.existsByEmailIgnoreCase("admin@x.com")).thenReturn(true);
        var request = new UserDtos.CreateRequest("Admin", "admin@x.com", "12345678", UserRole.ADMIN);

        assertThatThrownBy(() -> service.create(request, admin()))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("E-mail");
        verify(repository, never()).save(any());
    }

    @Test
    void passwordIsNeverStoredInPlainText() {
        var adminUser = user(9L, UserRole.ADMIN, "Admin");
        when(repository.findById(9L)).thenReturn(Optional.of(adminUser));
        when(encoder.encode("12345678")).thenReturn("hash");
        when(repository.save(any())).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId(10L);
            return user;
        });

        var request = new UserDtos.CreateRequest("Cliente", "cliente@x.com", "12345678", UserRole.CLIENTE);
        service.create(request, admin());

        verify(repository).save(argThat(user -> user.getPassword().equals("hash")));
    }

    private AuthenticatedUser admin() {
        return new AuthenticatedUser(9L, "Admin", "admin@x.com", "hash", UserRole.ADMIN, true);
    }

    private User user(Long id, UserRole role, String name) {
        var user = new User();
        user.setId(id);
        user.setRole(role);
        user.setName(name);
        user.setEmail(name.toLowerCase() + "@x.com");
        user.setActive(true);
        return user;
    }
}
