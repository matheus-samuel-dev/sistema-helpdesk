package com.portfolio.helpdesk.user;

import com.portfolio.helpdesk.activity.ActivityEventType;
import com.portfolio.helpdesk.activity.ActivityService;
import com.portfolio.helpdesk.exception.BusinessException;
import com.portfolio.helpdesk.exception.ResourceNotFoundException;
import com.portfolio.helpdesk.security.AuthenticatedUser;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository repository;
    private final PasswordEncoder encoder;
    private final ActivityService activities;

    @Transactional(readOnly = true)
    public Page<UserDtos.Response> list(String text, UserRole role, Boolean active, Pageable page) {
        return repository.findAll((root, query, cb) -> {
            var predicate = cb.conjunction();
            if (text != null && !text.isBlank()) {
                var like = "%" + text.toLowerCase() + "%";
                predicate = cb.and(predicate, cb.or(
                    cb.like(cb.lower(root.get("name")), like),
                    cb.like(cb.lower(root.get("email")), like)
                ));
            }
            if (role != null) {
                predicate = cb.and(predicate, cb.equal(root.get("role"), role));
            }
            if (active != null) {
                predicate = cb.and(predicate, cb.equal(root.get("active"), active));
            }
            return predicate;
        }, page).map(UserDtos::response);
    }

    @Transactional(readOnly = true)
    public UserDtos.Response get(Long id) {
        return UserDtos.response(entity(id));
    }

    @Transactional
    public UserDtos.Response create(UserDtos.CreateRequest request, AuthenticatedUser actor) {
        if (repository.existsByEmailIgnoreCase(request.email())) {
            throw new BusinessException("E-mail já cadastrado.");
        }
        User user = new User();
        user.setName(request.name().trim());
        user.setEmail(request.email().trim());
        user.setPassword(encoder.encode(request.password()));
        user.setRole(request.role());
        User saved = repository.save(user);
        activities.record(
            ActivityEventType.USUARIO_CRIADO,
            "Usuário criado",
            saved.getName() + " foi cadastrado com perfil " + saved.getRole() + ".",
            actor(actor),
            null
        );
        return UserDtos.response(saved);
    }

    @Transactional
    public UserDtos.Response update(Long id, UserDtos.UpdateRequest request, AuthenticatedUser actor) {
        User user = entity(id);
        repository.findByEmailIgnoreCase(request.email())
            .filter(existing -> !existing.getId().equals(id))
            .ifPresent(existing -> {
                throw new BusinessException("E-mail já cadastrado.");
            });

        boolean wasActive = user.isActive();
        user.setName(request.name().trim());
        user.setEmail(request.email().trim());
        user.setRole(request.role());
        user.setActive(request.active());
        if (request.password() != null && !request.password().isBlank()) {
            user.setPassword(encoder.encode(request.password()));
            activities.record(
                ActivityEventType.SENHA_REDEFINIDA,
                "Senha redefinida",
                "Senha redefinida para " + user.getName() + " pelo painel de gestão.",
                actor(actor),
                null
            );
        }

        ActivityEventType type = wasActive != user.isActive()
            ? user.isActive() ? ActivityEventType.USUARIO_ATIVADO : ActivityEventType.USUARIO_DESATIVADO
            : ActivityEventType.USUARIO_EDITADO;
        activities.record(
            type,
            type == ActivityEventType.USUARIO_EDITADO ? "Usuário editado" : user.isActive() ? "Usuário ativado" : "Usuário desativado",
            user.getName() + " teve seus dados atualizados.",
            actor(actor),
            null
        );
        return UserDtos.response(user);
    }

    @Transactional
    public void deactivate(Long id, AuthenticatedUser actor) {
        User user = entity(id);
        user.setActive(false);
        activities.record(
            ActivityEventType.USUARIO_DESATIVADO,
            "Usuário desativado",
            user.getName() + " teve o acesso desativado.",
            actor(actor),
            null
        );
    }

    public User entity(Long id) {
        return repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));
    }

    private User actor(AuthenticatedUser actor) {
        return repository.findById(actor.id()).orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));
    }
}
