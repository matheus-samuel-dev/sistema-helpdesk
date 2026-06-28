package com.portfolio.helpdesk.attachment;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TicketAttachmentRepository extends JpaRepository<TicketAttachment, Long> {
    List<TicketAttachment> findByTicketIdOrderByCreatedAtDesc(Long ticketId);
}
