package com.portfolio.helpdesk.ticket;

import com.portfolio.helpdesk.activity.ActivityService;
import com.portfolio.helpdesk.exception.BusinessException;
import com.portfolio.helpdesk.security.AuthenticatedUser;
import com.portfolio.helpdesk.user.User;
import com.portfolio.helpdesk.user.UserRepository;
import com.portfolio.helpdesk.user.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.time.OffsetDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.argThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TicketServiceTest {
    @Mock
    TicketRepository tickets;

    @Mock
    TicketHistoryRepository history;

    @Mock
    UserRepository users;

    @Mock
    ActivityService activities;

    @InjectMocks
    TicketService service;

    private User client;
    private User technician;

    @BeforeEach
    void setup() {
        client = user(1L, UserRole.CLIENTE, "Cliente");
        technician = user(2L, UserRole.TECNICO, "Tecnico");
    }

    @Test
    void newTicketAlwaysStartsOpen() {
        when(users.findById(1L)).thenReturn(Optional.of(client));
        when(tickets.save(any())).thenAnswer(invocation -> {
            Ticket ticket = invocation.getArgument(0);
            ticket.setId(10L);
            ticket.setCreatedAt(OffsetDateTime.now().minusMinutes(5));
            ticket.setUpdatedAt(ticket.getCreatedAt());
            return ticket;
        });

        var actor = new AuthenticatedUser(1L, "Cliente", "c@x.com", "x", UserRole.CLIENTE, true);
        var result = service.create(
            new TicketDtos.CreateRequest("Erro", "Descricao detalhada", TicketPriority.ALTA, TicketCategory.SOFTWARE, null),
            actor
        );

        assertThat(result.status()).isEqualTo(TicketStatus.ABERTO);
        assertThat(result.category()).isEqualTo(TicketCategory.SOFTWARE);
        assertThat(result.slaDueAt()).isNotNull();
        verify(history).save(argThat(item -> item.getEventType() == HistoryEventType.CRIACAO));
    }

    @Test
    void clientCannotChangeStatus() {
        var ticket = ticket(TicketStatus.ABERTO);
        when(tickets.findById(10L)).thenReturn(Optional.of(ticket));
        when(users.findById(1L)).thenReturn(Optional.of(client));

        var actor = new AuthenticatedUser(1L, "Cliente", "c@x.com", "x", UserRole.CLIENTE, true);

        assertThatThrownBy(() -> service.update(
            10L,
            new TicketDtos.UpdateRequest(null, null, TicketStatus.CANCELADO, null, null, null),
            actor
        )).isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void adminCanFollowProfessionalStatusFlow() {
        var ticket = ticket(TicketStatus.ABERTO);
        var adminUser = user(9L, UserRole.ADMIN, "Admin");
        when(tickets.findById(10L)).thenReturn(Optional.of(ticket));
        when(users.findById(9L)).thenReturn(Optional.of(adminUser));

        var admin = new AuthenticatedUser(9L, "Admin", "a@x.com", "x", UserRole.ADMIN, true);
        var inProgress = service.update(
            10L,
            new TicketDtos.UpdateRequest(null, null, TicketStatus.EM_ANDAMENTO, null, null, null),
            admin
        );
        var resolved = service.update(
            10L,
            new TicketDtos.UpdateRequest(null, null, TicketStatus.RESOLVIDO, null, null, null),
            admin
        );
        var reopened = service.update(
            10L,
            new TicketDtos.UpdateRequest(null, null, TicketStatus.EM_ANDAMENTO, null, null, null),
            admin
        );
        var canceled = service.update(
            10L,
            new TicketDtos.UpdateRequest(null, null, TicketStatus.CANCELADO, null, null, null),
            admin
        );

        assertThat(inProgress.status()).isEqualTo(TicketStatus.EM_ANDAMENTO);
        assertThat(resolved.status()).isEqualTo(TicketStatus.RESOLVIDO);
        assertThat(resolved.resolvedAt()).isNotNull();
        assertThat(reopened.status()).isEqualTo(TicketStatus.EM_ANDAMENTO);
        assertThat(reopened.resolvedAt()).isNull();
        assertThat(canceled.status()).isEqualTo(TicketStatus.CANCELADO);
        verify(history).save(argThat(item -> item.getEventType() == HistoryEventType.ALTERACAO_STATUS));
        verify(history).save(argThat(item -> item.getEventType() == HistoryEventType.RESOLUCAO));
        verify(history).save(argThat(item -> item.getEventType() == HistoryEventType.REABERTURA));
        verify(history).save(argThat(item -> item.getEventType() == HistoryEventType.CANCELAMENTO));
    }

    @Test
    void adminCannotReturnTicketToOpenStatus() {
        var ticket = ticket(TicketStatus.EM_ANDAMENTO);
        var adminUser = user(9L, UserRole.ADMIN, "Admin");
        when(tickets.findById(10L)).thenReturn(Optional.of(ticket));
        when(users.findById(9L)).thenReturn(Optional.of(adminUser));

        var actor = new AuthenticatedUser(9L, "Admin", "a@x.com", "x", UserRole.ADMIN, true);

        assertThatThrownBy(() -> service.update(
            10L,
            new TicketDtos.UpdateRequest(null, null, TicketStatus.ABERTO, null, null, null),
            actor
        ))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("status Aberto");
    }

    @Test
    void technicianCannotResolveOpenTicketDirectly() {
        var ticket = ticket(TicketStatus.ABERTO);
        ticket.setTechnician(technician);
        when(tickets.findById(10L)).thenReturn(Optional.of(ticket));
        when(users.findById(2L)).thenReturn(Optional.of(technician));

        var actor = new AuthenticatedUser(2L, "Tecnico", "t@x.com", "x", UserRole.TECNICO, true);

        assertThatThrownBy(() -> service.update(
            10L,
            new TicketDtos.UpdateRequest(null, null, TicketStatus.RESOLVIDO, null, null, null),
            actor
        ))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("fluxo atual");
    }

    private Ticket ticket(TicketStatus status) {
        var ticket = new Ticket();
        ticket.setId(10L);
        ticket.setTitle("Erro");
        ticket.setDescription("Descricao detalhada");
        ticket.setClient(client);
        ticket.setStatus(status);
        ticket.setPriority(TicketPriority.ALTA);
        ticket.setCategory(TicketCategory.OUTROS);
        ticket.setCreatedAt(OffsetDateTime.now().minusHours(2));
        ticket.setUpdatedAt(ticket.getCreatedAt());
        return ticket;
    }

    private User user(Long id, UserRole role, String name) {
        var user = new User();
        user.setId(id);
        user.setRole(role);
        user.setName(name);
        user.setEmail(name + "@x.com");
        user.setActive(true);
        return user;
    }
}
