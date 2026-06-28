package com.portfolio.helpdesk.ticket;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TicketRepository extends JpaRepository<Ticket, Long>, JpaSpecificationExecutor<Ticket> {
    long countByStatus(TicketStatus status);

    @Query("select t.status, count(t) from Ticket t group by t.status")
    List<Object[]> countGroupedByStatus();

    @Query("select t.priority, count(t) from Ticket t group by t.priority")
    List<Object[]> countGroupedByPriority();

    @Query("select t.category, count(t) from Ticket t group by t.category")
    List<Object[]> countGroupedByCategory();

    @Query("select count(t) from Ticket t where (:role = 'ADMIN') or (:role = 'CLIENTE' and t.client.id = :userId) or (:role = 'TECNICO' and t.technician.id = :userId)")
    long countVisible(@Param("role") String role, @Param("userId") Long userId);

    @Query("select t.status, count(t) from Ticket t where (:role = 'ADMIN') or (:role = 'CLIENTE' and t.client.id = :userId) or (:role = 'TECNICO' and t.technician.id = :userId) group by t.status")
    List<Object[]> countVisibleGroupedByStatus(@Param("role") String role, @Param("userId") Long userId);

    @Query("select t.priority, count(t) from Ticket t where (:role = 'ADMIN') or (:role = 'CLIENTE' and t.client.id = :userId) or (:role = 'TECNICO' and t.technician.id = :userId) group by t.priority")
    List<Object[]> countVisibleGroupedByPriority(@Param("role") String role, @Param("userId") Long userId);

    @Query("select t.category, count(t) from Ticket t where (:role = 'ADMIN') or (:role = 'CLIENTE' and t.client.id = :userId) or (:role = 'TECNICO' and t.technician.id = :userId) group by t.category")
    List<Object[]> countVisibleGroupedByCategory(@Param("role") String role, @Param("userId") Long userId);

    @Query("""
        select t from Ticket t
        left join fetch t.client
        left join fetch t.technician
        where (:role = 'ADMIN')
           or (:role = 'CLIENTE' and t.client.id = :userId)
           or (:role = 'TECNICO' and t.technician.id = :userId)
        """)
    List<Ticket> findVisibleForDashboard(@Param("role") String role, @Param("userId") Long userId);
}
