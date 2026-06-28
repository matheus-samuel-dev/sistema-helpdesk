package com.portfolio.helpdesk.ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface TicketHistoryRepository extends JpaRepository<TicketHistory, Long> {
    List<TicketHistory> findByTicketIdOrderByCreatedAtDesc(Long ticketId);
}
