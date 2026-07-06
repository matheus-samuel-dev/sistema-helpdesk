package com.portfolio.helpdesk.attachment;

import com.portfolio.helpdesk.exception.BusinessException;
import com.portfolio.helpdesk.security.AuthenticatedUser;
import com.portfolio.helpdesk.ticket.HistoryEventType;
import com.portfolio.helpdesk.ticket.Ticket;
import com.portfolio.helpdesk.ticket.TicketCategory;
import com.portfolio.helpdesk.ticket.TicketPriority;
import com.portfolio.helpdesk.ticket.TicketService;
import com.portfolio.helpdesk.ticket.TicketStatus;
import com.portfolio.helpdesk.user.User;
import com.portfolio.helpdesk.user.UserRepository;
import com.portfolio.helpdesk.user.UserRole;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.file.Files;
import java.nio.file.Path;
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
class AttachmentServiceTest {
    @Mock
    TicketAttachmentRepository attachments;

    @Mock
    TicketService tickets;

    @Mock
    UserRepository users;

    @InjectMocks
    AttachmentService service;

    @TempDir
    Path tempDir;

    @Test
    void unsupportedContentTypeIsRejected() {
        var file = new MockMultipartFile("file", "script.exe", "application/x-msdownload", new byte[] {1});

        assertThatThrownBy(() -> service.upload(10L, file, actor()))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("Formato");
        verify(tickets, never()).entity(any());
    }

    @Test
    void uploadStoresSanitizedFileAndRegistersHistory() throws Exception {
        ReflectionTestUtils.setField(service, "storagePath", tempDir.toString());
        var ticket = ticket();
        var author = user();
        when(tickets.entity(10L)).thenReturn(ticket);
        when(users.findById(1L)).thenReturn(Optional.of(author));
        when(attachments.save(any())).thenAnswer(invocation -> {
            TicketAttachment attachment = invocation.getArgument(0);
            attachment.setId(99L);
            attachment.setCreatedAt(OffsetDateTime.now());
            return attachment;
        });

        var file = new MockMultipartFile("file", "erro:rede?.png", "image/png", new byte[] {1, 2, 3});
        var response = service.upload(10L, file, actor());

        assertThat(response.name()).isEqualTo("erro_rede_.png");
        assertThat(Files.list(tempDir)).anyMatch(path -> path.getFileName().toString().endsWith("erro_rede_.png"));
        verify(tickets).assertView(ticket, actor());
        verify(tickets).record(
            argThat(savedTicket -> savedTicket.getId().equals(10L)),
            argThat(savedAuthor -> savedAuthor.getId().equals(1L)),
            argThat(type -> type == HistoryEventType.ANEXO),
            argThat(description -> description.contains("erro_rede_.png"))
        );
    }

    private AuthenticatedUser actor() {
        return new AuthenticatedUser(1L, "Cliente", "cliente@x.com", "hash", UserRole.CLIENTE, true);
    }

    private Ticket ticket() {
        var ticket = new Ticket();
        ticket.setId(10L);
        ticket.setTitle("Erro");
        ticket.setDescription("Descricao");
        ticket.setClient(user());
        ticket.setStatus(TicketStatus.ABERTO);
        ticket.setPriority(TicketPriority.MEDIA);
        ticket.setCategory(TicketCategory.SOFTWARE);
        ticket.setCreatedAt(OffsetDateTime.now());
        ticket.setUpdatedAt(ticket.getCreatedAt());
        return ticket;
    }

    private User user() {
        var user = new User();
        user.setId(1L);
        user.setName("Cliente");
        user.setEmail("cliente@x.com");
        user.setRole(UserRole.CLIENTE);
        user.setActive(true);
        return user;
    }
}

