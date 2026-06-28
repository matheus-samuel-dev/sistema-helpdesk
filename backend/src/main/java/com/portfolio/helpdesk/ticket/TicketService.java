package com.portfolio.helpdesk.ticket;

import com.portfolio.helpdesk.activity.ActivityEventType;
import com.portfolio.helpdesk.activity.ActivityService;
import com.portfolio.helpdesk.exception.BusinessException;
import com.portfolio.helpdesk.exception.ResourceNotFoundException;
import com.portfolio.helpdesk.security.AuthenticatedUser;
import com.portfolio.helpdesk.user.User;
import com.portfolio.helpdesk.user.UserRepository;
import com.portfolio.helpdesk.user.UserRole;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class TicketService {
    private final TicketRepository tickets;
    private final TicketHistoryRepository history;
    private final UserRepository users;
    private final ActivityService activities;

    @Transactional
    public TicketDtos.Response create(TicketDtos.CreateRequest request, AuthenticatedUser actor) {
        User client = resolveClientForCreation(request, actor);
        Ticket ticket = new Ticket();
        ticket.setTitle(request.title().trim());
        ticket.setDescription(request.description().trim());
        ticket.setClient(client);
        ticket.setPriority(request.priority());
        ticket.setCategory(request.category());
        ticket.setStatus(TicketStatus.ABERTO);
        tickets.save(ticket);

        record(
            ticket,
            user(actor.id()),
            HistoryEventType.CRIACAO,
            "Chamado criado com prioridade " + priorityLabel(request.priority()) + " na categoria " + categoryLabel(request.category()) + "."
        );
        return TicketDtos.response(ticket);
    }

    @Transactional(readOnly = true)
    public Page<TicketDtos.Response> list(
        TicketStatus status,
        TicketPriority priority,
        TicketCategory category,
        Long technicianId,
        Long clientId,
        String text,
        LocalDate from,
        LocalDate to,
        String sortBy,
        String direction,
        AuthenticatedUser actor,
        Pageable pageable
    ) {
        Pageable pagination = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize());
        return tickets.findAll((root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            var clientJoin = root.join("client");
            var technicianJoin = root.join("technician", JoinType.LEFT);

            if (actor.role() == UserRole.CLIENTE) {
                predicates.add(cb.equal(root.get("client").get("id"), actor.id()));
            }
            if (actor.role() == UserRole.TECNICO) {
                predicates.add(cb.equal(root.get("technician").get("id"), actor.id()));
            }
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (priority != null) {
                predicates.add(cb.equal(root.get("priority"), priority));
            }
            if (category != null) {
                predicates.add(cb.equal(root.get("category"), category));
            }
            if (technicianId != null) {
                predicates.add(cb.equal(root.get("technician").get("id"), technicianId));
            }
            if (clientId != null) {
                predicates.add(cb.equal(root.get("client").get("id"), clientId));
            }
            if (text != null && !text.isBlank()) {
                String normalizedText = text.trim().toLowerCase();
                String like = "%" + normalizedText + "%";
                List<Predicate> searchPredicates = new ArrayList<>();
                searchPredicates.add(cb.like(cb.lower(root.get("title")), like));
                searchPredicates.add(cb.like(cb.lower(root.get("description")), like));
                searchPredicates.add(cb.like(cb.lower(clientJoin.get("name")), like));
                searchPredicates.add(cb.like(cb.lower(clientJoin.get("email")), like));
                searchPredicates.add(cb.like(cb.lower(technicianJoin.get("name")), like));
                searchPredicates.add(cb.like(cb.lower(technicianJoin.get("email")), like));
                searchPredicates.add(cb.like(cb.lower(root.get("category").as(String.class)), like));
                try {
                    searchPredicates.add(cb.equal(root.get("id"), Long.parseLong(normalizedText)));
                } catch (NumberFormatException ignored) {
                    // Non numeric searches are handled by the text predicates.
                }
                predicates.add(cb.or(searchPredicates.toArray(Predicate[]::new)));
            }
            if (from != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), from.atStartOfDay().atOffset(ZoneOffset.UTC)));
            }
            if (to != null) {
                predicates.add(cb.lessThan(root.get("createdAt"), to.plusDays(1).atStartOfDay().atOffset(ZoneOffset.UTC)));
            }

            if (query != null) {
                query.distinct(true);
                if (!Long.class.equals(query.getResultType()) && !long.class.equals(query.getResultType())) {
                    applyOrdering(root, query, cb, sortBy, direction);
                }
            }

            return cb.and(predicates.toArray(Predicate[]::new));
        }, pagination).map(TicketDtos::response);
    }

    @Transactional(readOnly = true)
    public TicketDtos.Response get(Long id, AuthenticatedUser actor) {
        Ticket ticket = entity(id);
        assertView(ticket, actor);
        return TicketDtos.response(ticket);
    }

    @Transactional
    public TicketDtos.Response update(Long id, TicketDtos.UpdateRequest request, AuthenticatedUser actor) {
        Ticket ticket = entity(id);
        assertView(ticket, actor);
        User actorUser = user(actor.id());
        updateTicketDetails(ticket, request, actor, actorUser);
        updateTechnician(ticket, request, actor, actorUser);
        updatePriority(ticket, request, actor, actorUser);
        updateStatus(ticket, request, actor, actorUser);
        return TicketDtos.response(ticket);
    }

    @Transactional(readOnly = true)
    public List<TicketDtos.HistoryResponse> history(Long id, AuthenticatedUser actor) {
        Ticket ticket = entity(id);
        assertView(ticket, actor);
        return history.findByTicketIdOrderByCreatedAtDesc(id).stream().map(TicketDtos::history).toList();
    }

    public void assertView(Ticket ticket, AuthenticatedUser actor) {
        boolean allowed = actor.role() == UserRole.ADMIN
            || (actor.role() == UserRole.CLIENTE && ticket.getClient().getId().equals(actor.id()))
            || (actor.role() == UserRole.TECNICO && isAssignedTechnician(ticket, actor));
        if (!allowed) {
            throw new AccessDeniedException("Sem acesso ao chamado.");
        }
    }

    public Ticket entity(Long id) {
        return tickets.findById(id).orElseThrow(() -> new ResourceNotFoundException("Chamado não encontrado."));
    }

    @Transactional
    public void record(Ticket ticket, User actor, HistoryEventType type, String description) {
        TicketHistory item = new TicketHistory();
        item.setTicket(ticket);
        item.setActor(actor);
        item.setEventType(type);
        item.setDescription(description);
        history.save(item);
        activities.record(activityType(type), historyLabel(type), description, actor, ticket);
    }

    private void updateTicketDetails(Ticket ticket, TicketDtos.UpdateRequest request, AuthenticatedUser actor, User actorUser) {
        if (request.title() == null && request.description() == null && request.category() == null) {
            return;
        }

        assertCanEditDetails(ticket, actor);
        List<String> changedFields = new ArrayList<>();

        if (request.title() != null) {
            String title = request.title().trim();
            if (!title.equals(ticket.getTitle())) {
                ticket.setTitle(title);
                changedFields.add("título");
            }
        }
        if (request.description() != null) {
            String description = request.description().trim();
            if (!description.equals(ticket.getDescription())) {
                ticket.setDescription(description);
                changedFields.add("descrição");
            }
        }
        if (request.category() != null && request.category() != ticket.getCategory()) {
            TicketCategory previous = ticket.getCategory();
            ticket.setCategory(request.category());
            record(
                ticket,
                actorUser,
                HistoryEventType.ALTERACAO_CATEGORIA,
                "Categoria alterada de " + categoryLabel(previous) + " para " + categoryLabel(request.category()) + "."
            );
        }

        if (!changedFields.isEmpty()) {
            record(ticket, actorUser, HistoryEventType.ATUALIZACAO_DADOS, "Dados atualizados: " + String.join(", ", changedFields) + ".");
        }
    }

    private void updateTechnician(Ticket ticket, TicketDtos.UpdateRequest request, AuthenticatedUser actor, User actorUser) {
        if (request.technicianId() == null) {
            return;
        }

        Long currentTechnicianId = ticket.getTechnician() == null ? null : ticket.getTechnician().getId();
        if (Objects.equals(request.technicianId(), currentTechnicianId)) {
            return;
        }
        if (actor.role() != UserRole.ADMIN) {
            throw new AccessDeniedException("Somente administradores podem atribuir analistas.");
        }

        User technician = user(request.technicianId());
        if (technician.getRole() != UserRole.TECNICO || !technician.isActive()) {
            throw new BusinessException("Selecione um analista ativo com perfil técnico.");
        }

        String previous = ticket.getTechnician() == null ? "não atribuído" : ticket.getTechnician().getName();
        ticket.setTechnician(technician);
        record(ticket, actorUser, HistoryEventType.ATRIBUICAO_TECNICO, "Analista alterado de " + previous + " para " + technician.getName() + ".");
    }

    private void updatePriority(Ticket ticket, TicketDtos.UpdateRequest request, AuthenticatedUser actor, User actorUser) {
        if (request.priority() == null || request.priority() == ticket.getPriority()) {
            return;
        }
        if (actor.role() != UserRole.ADMIN) {
            throw new AccessDeniedException("Somente administradores podem alterar a prioridade.");
        }

        TicketPriority previous = ticket.getPriority();
        ticket.setPriority(request.priority());
        record(
            ticket,
            actorUser,
            HistoryEventType.ALTERACAO_PRIORIDADE,
            "Prioridade alterada de " + priorityLabel(previous) + " para " + priorityLabel(request.priority()) + "."
        );
    }

    private void updateStatus(Ticket ticket, TicketDtos.UpdateRequest request, AuthenticatedUser actor, User actorUser) {
        if (request.status() == null || request.status() == ticket.getStatus()) {
            return;
        }
        changeStatus(ticket, request.status(), actor, actorUser);
    }

    private void changeStatus(Ticket ticket, TicketStatus target, AuthenticatedUser actor, User actorUser) {
        TicketStatus current = ticket.getStatus();
        validateStatusTransition(ticket, target, actor);

        ticket.setStatus(target);
        if (target == TicketStatus.RESOLVIDO) {
            ticket.setResolvedAt(OffsetDateTime.now());
        } else {
            ticket.setResolvedAt(null);
        }

        HistoryEventType eventType = current == TicketStatus.RESOLVIDO && target == TicketStatus.EM_ANDAMENTO
            ? HistoryEventType.REABERTURA
            : target == TicketStatus.RESOLVIDO
                ? HistoryEventType.RESOLUCAO
                : target == TicketStatus.CANCELADO ? HistoryEventType.CANCELAMENTO : HistoryEventType.ALTERACAO_STATUS;
        record(ticket, actorUser, eventType, "Status alterado de " + statusLabel(current) + " para " + statusLabel(target) + ".");
    }

    private void validateStatusTransition(Ticket ticket, TicketStatus target, AuthenticatedUser actor) {
        if (target == TicketStatus.ABERTO) {
            throw new BusinessException("O status Aberto é definido apenas na criação do chamado.");
        }
        if (actor.role() == UserRole.CLIENTE) {
            throw new AccessDeniedException("Clientes acompanham chamados, mas não alteram status.");
        }
        if (actor.role() == UserRole.TECNICO && !isAssignedTechnician(ticket, actor)) {
            throw new AccessDeniedException("O chamado não está atribuído a este analista.");
        }

        TicketStatus current = ticket.getStatus();
        boolean allowed = switch (current) {
            case ABERTO -> target == TicketStatus.EM_ANDAMENTO || target == TicketStatus.CANCELADO;
            case EM_ANDAMENTO -> target == TicketStatus.RESOLVIDO || target == TicketStatus.CANCELADO;
            case RESOLVIDO -> target == TicketStatus.EM_ANDAMENTO;
            case CANCELADO -> false;
        };
        if (!allowed) {
            throw new BusinessException("A mudança de status solicitada não é válida para o fluxo atual do chamado.");
        }
    }

    private void applyOrdering(
        jakarta.persistence.criteria.Root<Ticket> root,
        jakarta.persistence.criteria.CriteriaQuery<?> query,
        jakarta.persistence.criteria.CriteriaBuilder cb,
        String sortBy,
        String direction
    ) {
        boolean ascending = "asc".equalsIgnoreCase(direction);
        Expression<?> sortExpression = switch (sortBy) {
            case "title" -> cb.lower(root.get("title"));
            case "priority" -> cb.selectCase(root.get("priority"))
                .when(TicketPriority.BAIXA, 0)
                .when(TicketPriority.MEDIA, 1)
                .when(TicketPriority.ALTA, 2)
                .when(TicketPriority.URGENTE, 3)
                .otherwise(4);
            case "status" -> cb.selectCase(root.get("status"))
                .when(TicketStatus.ABERTO, 0)
                .when(TicketStatus.EM_ANDAMENTO, 1)
                .when(TicketStatus.RESOLVIDO, 2)
                .when(TicketStatus.CANCELADO, 3)
                .otherwise(4);
            case "sla" -> cb.selectCase(root.get("priority"))
                .when(TicketPriority.URGENTE, 0)
                .when(TicketPriority.ALTA, 1)
                .when(TicketPriority.MEDIA, 2)
                .when(TicketPriority.BAIXA, 3)
                .otherwise(4);
            case "createdAt", "date" -> root.get("createdAt");
            default -> root.get("updatedAt");
        };

        query.orderBy(
            ascending ? cb.asc(sortExpression) : cb.desc(sortExpression),
            cb.desc(root.get("updatedAt")),
            cb.desc(root.get("id"))
        );
    }

    private void assertCanEditDetails(Ticket ticket, AuthenticatedUser actor) {
        boolean allowed = actor.role() == UserRole.ADMIN || (actor.role() == UserRole.TECNICO && isAssignedTechnician(ticket, actor));
        if (!allowed) {
            throw new AccessDeniedException("Você não tem permissão para editar os dados deste chamado.");
        }
    }

    private boolean isAssignedTechnician(Ticket ticket, AuthenticatedUser actor) {
        return ticket.getTechnician() != null && ticket.getTechnician().getId().equals(actor.id());
    }

    private User resolveClientForCreation(TicketDtos.CreateRequest request, AuthenticatedUser actor) {
        if (actor.role() == UserRole.CLIENTE) {
            return user(actor.id());
        }
        if (actor.role() == UserRole.ADMIN && request.clientId() != null) {
            User client = user(request.clientId());
            if (client.getRole() != UserRole.CLIENTE) {
                throw new BusinessException("O solicitante selecionado precisa ter perfil de cliente.");
            }
            return client;
        }
        throw new BusinessException("Informe um solicitante válido.");
    }

    private User user(Long id) {
        return users.findById(id).orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));
    }

    private ActivityEventType activityType(HistoryEventType type) {
        return switch (type) {
            case CRIACAO -> ActivityEventType.CHAMADO_CRIADO;
            case ALTERACAO_STATUS -> ActivityEventType.STATUS_ALTERADO;
            case ALTERACAO_PRIORIDADE -> ActivityEventType.PRIORIDADE_ALTERADA;
            case ALTERACAO_CATEGORIA -> ActivityEventType.CATEGORIA_ALTERADA;
            case ATRIBUICAO_TECNICO -> ActivityEventType.ANALISTA_ATRIBUIDO;
            case ATUALIZACAO_DADOS -> ActivityEventType.CHAMADO_EDITADO;
            case COMENTARIO -> ActivityEventType.COMENTARIO_ADICIONADO;
            case COMENTARIO_REMOVIDO -> ActivityEventType.COMENTARIO_REMOVIDO;
            case ANEXO -> ActivityEventType.ANEXO_ENVIADO;
            case REABERTURA -> ActivityEventType.CHAMADO_REABERTO;
            case RESOLUCAO -> ActivityEventType.CHAMADO_RESOLVIDO;
            case CANCELAMENTO -> ActivityEventType.CHAMADO_CANCELADO;
        };
    }

    private String historyLabel(HistoryEventType type) {
        return switch (type) {
            case CRIACAO -> "Chamado criado";
            case ALTERACAO_STATUS -> "Status alterado";
            case ALTERACAO_PRIORIDADE -> "Prioridade alterada";
            case ALTERACAO_CATEGORIA -> "Categoria alterada";
            case ATRIBUICAO_TECNICO -> "Analista atribuído";
            case ATUALIZACAO_DADOS -> "Chamado editado";
            case COMENTARIO -> "Comentário adicionado";
            case COMENTARIO_REMOVIDO -> "Comentário removido";
            case ANEXO -> "Anexo enviado";
            case REABERTURA -> "Chamado reaberto";
            case RESOLUCAO -> "Chamado resolvido";
            case CANCELAMENTO -> "Chamado cancelado";
        };
    }

    private String statusLabel(TicketStatus status) {
        return switch (status) {
            case ABERTO -> "Aberto";
            case EM_ANDAMENTO -> "Em andamento";
            case RESOLVIDO -> "Resolvido";
            case CANCELADO -> "Cancelado";
        };
    }

    private String priorityLabel(TicketPriority priority) {
        return switch (priority) {
            case BAIXA -> "Baixa";
            case MEDIA -> "Média";
            case ALTA -> "Alta";
            case URGENTE -> "Urgente";
        };
    }

    private String categoryLabel(TicketCategory category) {
        return switch (category) {
            case HARDWARE -> "Hardware";
            case SOFTWARE -> "Software";
            case REDE -> "Rede";
            case IMPRESSORA -> "Impressora";
            case ACESSO -> "Acesso";
            case BANCO_DE_DADOS -> "Banco de Dados";
            case INFRAESTRUTURA -> "Infraestrutura";
            case OUTROS -> "Outros";
        };
    }
}
