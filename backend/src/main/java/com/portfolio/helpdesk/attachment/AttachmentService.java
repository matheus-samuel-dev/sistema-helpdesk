package com.portfolio.helpdesk.attachment;

import com.portfolio.helpdesk.exception.BusinessException;
import com.portfolio.helpdesk.exception.ResourceNotFoundException;
import com.portfolio.helpdesk.security.AuthenticatedUser;
import com.portfolio.helpdesk.ticket.HistoryEventType;
import com.portfolio.helpdesk.ticket.TicketService;
import com.portfolio.helpdesk.user.User;
import com.portfolio.helpdesk.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AttachmentService {
    private static final long MAX_SIZE_BYTES = 10 * 1024 * 1024;
    private static final Set<String> ALLOWED_TYPES = Set.of(
        "application/pdf",
        "image/png",
        "image/jpeg",
        "image/webp",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    private final TicketAttachmentRepository attachments;
    private final TicketService tickets;
    private final UserRepository users;

    @Value("${app.attachments.storage-path:uploads}")
    private String storagePath;

    @Transactional(readOnly = true)
    public List<AttachmentDtos.Response> list(Long ticketId, AuthenticatedUser actor) {
        var ticket = tickets.entity(ticketId);
        tickets.assertView(ticket, actor);
        return attachments.findByTicketIdOrderByCreatedAtDesc(ticketId).stream()
            .map(AttachmentDtos::response)
            .toList();
    }

    @Transactional
    public AttachmentDtos.Response upload(Long ticketId, MultipartFile file, AuthenticatedUser actor) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException("Selecione um arquivo para anexar.");
        }
        if (file.getSize() > MAX_SIZE_BYTES) {
            throw new BusinessException("O anexo deve ter no máximo 10 MB.");
        }
        String contentType = file.getContentType() == null ? "application/octet-stream" : file.getContentType();
        if (!ALLOWED_TYPES.contains(contentType)) {
            throw new BusinessException("Formato de anexo não permitido.");
        }

        var ticket = tickets.entity(ticketId);
        tickets.assertView(ticket, actor);
        User author = user(actor.id());
        String originalName = sanitize(file.getOriginalFilename() == null ? "anexo" : file.getOriginalFilename());
        String storedName = UUID.randomUUID() + "-" + originalName;

        try {
            Path root = storageRoot();
            Files.createDirectories(root);
            Files.copy(file.getInputStream(), root.resolve(storedName));
        } catch (IOException ex) {
            throw new BusinessException("Não foi possível salvar o anexo.");
        }

        TicketAttachment attachment = new TicketAttachment();
        attachment.setTicket(ticket);
        attachment.setAuthor(author);
        attachment.setOriginalName(originalName);
        attachment.setStoredName(storedName);
        attachment.setContentType(contentType);
        attachment.setSizeBytes(file.getSize());
        TicketAttachment saved = attachments.save(attachment);

        tickets.record(ticket, author, HistoryEventType.ANEXO, "Anexo enviado: " + originalName + ".");
        return AttachmentDtos.response(saved);
    }

    @Transactional(readOnly = true)
    public Download download(Long ticketId, Long attachmentId, AuthenticatedUser actor) {
        var ticket = tickets.entity(ticketId);
        tickets.assertView(ticket, actor);
        TicketAttachment attachment = attachments.findById(attachmentId)
            .filter(item -> item.getTicket().getId().equals(ticketId))
            .orElseThrow(() -> new ResourceNotFoundException("Anexo não encontrado."));
        try {
            Resource resource = new UrlResource(storageRoot().resolve(attachment.getStoredName()).toUri());
            if (!resource.exists()) {
                throw new ResourceNotFoundException("Arquivo do anexo não encontrado.");
            }
            return new Download(resource, attachment.getOriginalName(), attachment.getContentType(), attachment.getSizeBytes());
        } catch (MalformedURLException ex) {
            throw new ResourceNotFoundException("Arquivo do anexo não encontrado.");
        }
    }

    private Path storageRoot() {
        return Path.of(storagePath).toAbsolutePath().normalize();
    }

    private User user(Long id) {
        return users.findById(id).orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));
    }

    private String sanitize(String name) {
        return name.replaceAll("[\\\\/:*?\"<>|]", "_").trim();
    }

    public record Download(Resource resource, String fileName, String contentType, long sizeBytes) {}
}
