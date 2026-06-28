package com.portfolio.helpdesk.user;

import jakarta.validation.constraints.*;
import java.time.OffsetDateTime;

public final class UserDtos {
    private UserDtos() {}
    public record CreateRequest(
        @NotBlank(message = "Informe o nome do usuário.")
        @Size(max = 120, message = "O nome deve ter no máximo 120 caracteres.")
        String name,
        @NotBlank(message = "Informe o e-mail.")
        @Email(message = "Informe um e-mail válido.")
        String email,
        @NotBlank(message = "Informe a senha.")
        @Size(min = 8, max = 72, message = "A senha deve ter entre 8 e 72 caracteres.")
        String password,
        @NotNull(message = "Selecione o perfil.")
        UserRole role
    ) {}
    public record UpdateRequest(
        @NotBlank(message = "Informe o nome do usuário.")
        @Size(max = 120, message = "O nome deve ter no máximo 120 caracteres.")
        String name,
        @NotBlank(message = "Informe o e-mail.")
        @Email(message = "Informe um e-mail válido.")
        String email,
        @NotNull(message = "Selecione o perfil.")
        UserRole role,
        @NotNull(message = "Informe se o acesso está ativo.")
        Boolean active,
        @Size(min = 8, max = 72, message = "A senha deve ter entre 8 e 72 caracteres.")
        String password
    ) {}
    public record Summary(Long id, String name, String email, UserRole role, boolean active) {}
    public record Response(Long id, String name, String email, UserRole role, boolean active, OffsetDateTime createdAt, OffsetDateTime updatedAt) {}
    public static Summary summary(User u) { return new Summary(u.getId(),u.getName(),u.getEmail(),u.getRole(),u.isActive()); }
    public static Response response(User u) { return new Response(u.getId(),u.getName(),u.getEmail(),u.getRole(),u.isActive(),u.getCreatedAt(),u.getUpdatedAt()); }
}
