package com.portfolio.helpdesk.dashboard;

import com.portfolio.helpdesk.activity.ActivityService;
import com.portfolio.helpdesk.activity.ActivityDtos;
import com.portfolio.helpdesk.comment.Comment;
import com.portfolio.helpdesk.comment.CommentDtos;
import com.portfolio.helpdesk.comment.CommentRepository;
import com.portfolio.helpdesk.security.AuthenticatedUser;
import com.portfolio.helpdesk.ticket.*;
import com.portfolio.helpdesk.user.UserRole;
import jakarta.persistence.criteria.JoinType;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {
    private static final int TREND_DAYS = 7;

    private final TicketRepository repository;
    private final TicketService tickets;
    private final CommentRepository comments;
    private final ActivityService activities;

    @Transactional(readOnly = true)
    public DashboardDtos.Response get(AuthenticatedUser actor) {
        String role = actor.role().name();
        long userId = actor.id();
        OffsetDateTime now = OffsetDateTime.now();

        var status = new EnumMap<TicketStatus, Long>(TicketStatus.class);
        for (var item : TicketStatus.values()) {
            status.put(item, 0L);
        }
        repository.countVisibleGroupedByStatus(role, userId)
            .forEach(row -> status.put((TicketStatus) row[0], (Long) row[1]));

        var priority = new EnumMap<TicketPriority, Long>(TicketPriority.class);
        for (var item : TicketPriority.values()) {
            priority.put(item, 0L);
        }
        repository.countVisibleGroupedByPriority(role, userId)
            .forEach(row -> priority.put((TicketPriority) row[0], (Long) row[1]));

        var category = new EnumMap<TicketCategory, Long>(TicketCategory.class);
        for (var item : TicketCategory.values()) {
            category.put(item, 0L);
        }
        repository.countVisibleGroupedByCategory(role, userId)
            .forEach(row -> category.put((TicketCategory) row[0], (Long) row[1]));

        List<Ticket> visibleTickets = repository.findVisibleForDashboard(role, userId);
        ZoneId zone = ZoneId.systemDefault();
        LocalDate today = LocalDate.now(zone);
        LocalDate weekStart = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));

        long createdToday = visibleTickets.stream()
            .filter(ticket -> ticket.getCreatedAt().atZoneSameInstant(zone).toLocalDate().isEqual(today))
            .count();

        long createdThisWeek = visibleTickets.stream()
            .filter(ticket -> !ticket.getCreatedAt().atZoneSameInstant(zone).toLocalDate().isBefore(weekStart))
            .count();

        long resolvedToday = visibleTickets.stream()
            .filter(ticket -> ticket.getResolvedAt() != null && ticket.getResolvedAt().atZoneSameInstant(zone).toLocalDate().isEqual(today))
            .count();

        long resolvedThisWeek = visibleTickets.stream()
            .filter(ticket -> ticket.getResolvedAt() != null && !ticket.getResolvedAt().atZoneSameInstant(zone).toLocalDate().isBefore(weekStart))
            .count();

        long overdueSla = visibleTickets.stream()
            .filter(ticket -> ticket.getStatus() != TicketStatus.RESOLVIDO && ticket.getStatus() != TicketStatus.CANCELADO)
            .filter(ticket -> TicketSla.status(ticket, now) == SlaStatus.VENCIDO)
            .count();

        long nearDueSla = visibleTickets.stream()
            .filter(ticket -> ticket.getStatus() != TicketStatus.RESOLVIDO && ticket.getStatus() != TicketStatus.CANCELADO)
            .filter(ticket -> TicketSla.status(ticket, now) == SlaStatus.PROXIMO_DO_VENCIMENTO)
            .count();

        long withinSla = visibleTickets.stream()
            .filter(ticket -> TicketSla.status(ticket, now) == SlaStatus.DENTRO_DO_PRAZO)
            .count();

        Long averageResolutionMinutes = visibleTickets.stream()
            .filter(ticket -> ticket.getResolvedAt() != null)
            .mapToLong(ticket -> ChronoUnit.MINUTES.between(ticket.getCreatedAt(), ticket.getResolvedAt()))
            .average()
            .stream()
            .mapToLong(Math::round)
            .boxed()
            .findFirst()
            .orElse(null);

        LocalDate trendStart = today.minusDays(TREND_DAYS - 1L);
        List<DashboardDtos.DailyVolume> dailyVolume = trendStart.datesUntil(today.plusDays(1))
            .map(date -> new DashboardDtos.DailyVolume(
                date,
                visibleTickets.stream().filter(ticket -> ticket.getCreatedAt().atZoneSameInstant(zone).toLocalDate().isEqual(date)).count(),
                visibleTickets.stream().filter(ticket -> ticket.getResolvedAt() != null && ticket.getResolvedAt().atZoneSameInstant(zone).toLocalDate().isEqual(date)).count()
            ))
            .toList();

        List<DashboardDtos.RankingItem> byTechnician = toRanking(
            visibleTickets.stream()
                .filter(ticket -> ticket.getTechnician() != null)
                .collect(Collectors.groupingBy(ticket -> ticket.getTechnician().getName(), Collectors.counting()))
        );

        List<DashboardDtos.RankingItem> byClient = toRanking(
            visibleTickets.stream()
                .collect(Collectors.groupingBy(ticket -> ticket.getClient().getName(), Collectors.counting()))
        );

        List<DashboardDtos.RankingItem> productivityByTechnician = toRanking(
            visibleTickets.stream()
                .filter(ticket -> ticket.getTechnician() != null)
                .collect(Collectors.groupingBy(ticket -> ticket.getTechnician().getName(), Collectors.counting()))
        );

        List<DashboardDtos.TechnicianProductivity> technicianProductivity = technicianProductivity(
            visibleTickets,
            weekStart,
            zone
        );

        List<DashboardDtos.RankingItem> resolvedThisWeekByTechnician = toRanking(
            visibleTickets.stream()
                .filter(ticket -> ticket.getTechnician() != null)
                .filter(ticket -> ticket.getResolvedAt() != null)
                .filter(ticket -> !ticket.getResolvedAt().atZoneSameInstant(zone).toLocalDate().isBefore(weekStart))
                .collect(Collectors.groupingBy(ticket -> ticket.getTechnician().getName(), Collectors.counting()))
        );
        if (!resolvedThisWeekByTechnician.isEmpty()) {
            productivityByTechnician = resolvedThisWeekByTechnician;
        }

        List<DashboardDtos.RankingItem> averageResolutionByCategory = averageResolutionByCategory(visibleTickets);

        var recent = tickets.list(
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            "updatedAt",
            "desc",
            actor,
            PageRequest.of(0, 6)
        ).getContent();

        var recentComments = comments.findAll((root, query, cb) -> {
            var ticketJoin = root.join("ticket");
            var clientJoin = ticketJoin.join("client");
            var technicianJoin = ticketJoin.join("technician", JoinType.LEFT);
            var predicate = cb.conjunction();
            if (actor.role() == UserRole.CLIENTE) {
                predicate = cb.and(predicate, cb.equal(clientJoin.get("id"), actor.id()), cb.isFalse(root.get("internal")));
            }
            if (actor.role() == UserRole.TECNICO) {
                predicate = cb.and(predicate, cb.equal(technicianJoin.get("id"), actor.id()));
            }
            if (query != null) {
                query.distinct(true);
            }
            return predicate;
        }, PageRequest.of(0, 5, Sort.by(Sort.Direction.DESC, "createdAt"))).stream().map(CommentDtos::response).toList();

        var recentActivities = activities.list(
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            actor,
            PageRequest.of(0, 24, Sort.by(Sort.Direction.DESC, "createdAt"))
        ).getContent().stream()
            .filter(this::isDashboardActivity)
            .limit(6)
            .toList();

        return new DashboardDtos.Response(
            repository.countVisible(role, userId),
            status.get(TicketStatus.ABERTO),
            status.get(TicketStatus.EM_ANDAMENTO),
            status.get(TicketStatus.RESOLVIDO),
            status.get(TicketStatus.CANCELADO),
            createdToday,
            createdThisWeek,
            resolvedToday,
            resolvedThisWeek,
            overdueSla,
            nearDueSla,
            withinSla,
            averageResolutionMinutes,
            status,
            priority,
            category,
            byTechnician,
            byClient,
            productivityByTechnician,
            technicianProductivity,
            averageResolutionByCategory,
            dailyVolume,
            recent,
            recentComments,
            recentActivities
        );
    }

    private List<DashboardDtos.TechnicianProductivity> technicianProductivity(
        List<Ticket> tickets,
        LocalDate weekStart,
        ZoneId zone
    ) {
        return tickets.stream()
            .filter(ticket -> ticket.getTechnician() != null)
            .collect(Collectors.groupingBy(ticket -> ticket.getTechnician().getName()))
            .entrySet()
            .stream()
            .map(entry -> {
                List<Ticket> assignedTickets = entry.getValue();
                long assigned = assignedTickets.size();
                long inProgress = assignedTickets.stream()
                    .filter(ticket -> ticket.getStatus() == TicketStatus.EM_ANDAMENTO)
                    .count();
                long resolved = assignedTickets.stream()
                    .filter(ticket -> ticket.getStatus() == TicketStatus.RESOLVIDO)
                    .count();
                long resolvedThisWeek = assignedTickets.stream()
                    .filter(ticket -> ticket.getResolvedAt() != null)
                    .filter(ticket -> !ticket.getResolvedAt().atZoneSameInstant(zone).toLocalDate().isBefore(weekStart))
                    .count();
                Long averageResolutionMinutes = assignedTickets.stream()
                    .filter(ticket -> ticket.getResolvedAt() != null)
                    .mapToLong(ticket -> ChronoUnit.MINUTES.between(ticket.getCreatedAt(), ticket.getResolvedAt()))
                    .average()
                    .stream()
                    .mapToLong(Math::round)
                    .boxed()
                    .findFirst()
                    .orElse(null);
                long productivityPercent = assigned == 0
                    ? 0
                    : Math.min(100, Math.round(((resolved + (inProgress * 0.45D)) / assigned) * 100));

                return new DashboardDtos.TechnicianProductivity(
                    entry.getKey(),
                    assigned,
                    inProgress,
                    resolved,
                    resolvedThisWeek,
                    averageResolutionMinutes,
                    productivityPercent
                );
            })
            .sorted((left, right) -> {
                int byWeek = Long.compare(right.resolvedThisWeek(), left.resolvedThisWeek());
                if (byWeek != 0) {
                    return byWeek;
                }
                int byProductivity = Long.compare(right.productivityPercent(), left.productivityPercent());
                if (byProductivity != 0) {
                    return byProductivity;
                }
                return left.technician().compareToIgnoreCase(right.technician());
            })
            .limit(5)
            .toList();
    }

    private boolean isDashboardActivity(ActivityDtos.Response activity) {
        return switch (activity.type()) {
            case LOGIN_REALIZADO,
                LOGOUT_REALIZADO,
                SENHA_REDEFINIDA,
                USUARIO_CRIADO,
                USUARIO_EDITADO,
                USUARIO_ATIVADO,
                USUARIO_DESATIVADO -> false;
            default -> true;
        };
    }

    private List<DashboardDtos.RankingItem> toRanking(Map<String, Long> values) {
        return values.entrySet().stream()
            .sorted(Map.Entry.<String, Long>comparingByValue().reversed().thenComparing(Map.Entry.comparingByKey()))
            .limit(5)
            .map(entry -> new DashboardDtos.RankingItem(entry.getKey(), entry.getValue()))
            .toList();
    }

    private List<DashboardDtos.RankingItem> averageResolutionByCategory(List<Ticket> tickets) {
        return tickets.stream()
            .filter(ticket -> ticket.getResolvedAt() != null)
            .collect(Collectors.groupingBy(ticket -> categoryLabel(ticket.getCategory()), Collectors.averagingLong(ticket -> ChronoUnit.MINUTES.between(ticket.getCreatedAt(), ticket.getResolvedAt()))))
            .entrySet()
            .stream()
            .sorted(Map.Entry.comparingByKey())
            .limit(8)
            .map(entry -> new DashboardDtos.RankingItem(entry.getKey(), Math.round(entry.getValue())))
            .toList();
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
