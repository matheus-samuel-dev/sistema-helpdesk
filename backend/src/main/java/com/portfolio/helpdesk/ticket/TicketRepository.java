package com.portfolio.helpdesk.ticket;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.time.OffsetDateTime;

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

    @Query("select count(t) from Ticket t where ((:role = 'ADMIN') or (:role = 'CLIENTE' and t.client.id = :userId) or (:role = 'TECNICO' and t.technician.id = :userId)) and t.createdAt >= :from and t.createdAt < :to")
    long countVisibleCreatedBetween(@Param("role") String role, @Param("userId") Long userId, @Param("from") OffsetDateTime from, @Param("to") OffsetDateTime to);

    @Query("select count(t) from Ticket t where ((:role = 'ADMIN') or (:role = 'CLIENTE' and t.client.id = :userId) or (:role = 'TECNICO' and t.technician.id = :userId)) and t.resolvedAt is not null and t.resolvedAt >= :from and t.resolvedAt < :to")
    long countVisibleResolvedBetween(@Param("role") String role, @Param("userId") Long userId, @Param("from") OffsetDateTime from, @Param("to") OffsetDateTime to);

    @Query("select t.technician.name, count(t) from Ticket t where ((:role = 'ADMIN') or (:role = 'CLIENTE' and t.client.id = :userId) or (:role = 'TECNICO' and t.technician.id = :userId)) and t.technician is not null group by t.technician.name")
    List<Object[]> countVisibleByTechnician(@Param("role") String role, @Param("userId") Long userId);

    @Query("select t.client.name, count(t) from Ticket t where (:role = 'ADMIN') or (:role = 'CLIENTE' and t.client.id = :userId) or (:role = 'TECNICO' and t.technician.id = :userId) group by t.client.name")
    List<Object[]> countVisibleByClient(@Param("role") String role, @Param("userId") Long userId);

    @Query("select t.technician.name, count(t) from Ticket t where ((:role = 'ADMIN') or (:role = 'CLIENTE' and t.client.id = :userId) or (:role = 'TECNICO' and t.technician.id = :userId)) and t.technician is not null and t.resolvedAt is not null and t.resolvedAt >= :from and t.resolvedAt < :to group by t.technician.name")
    List<Object[]> countVisibleResolvedByTechnicianBetween(@Param("role") String role, @Param("userId") Long userId, @Param("from") OffsetDateTime from, @Param("to") OffsetDateTime to);

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
