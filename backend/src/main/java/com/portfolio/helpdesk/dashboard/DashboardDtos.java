package com.portfolio.helpdesk.dashboard;

import com.portfolio.helpdesk.ticket.TicketDtos;
import com.portfolio.helpdesk.ticket.TicketCategory;
import com.portfolio.helpdesk.ticket.TicketPriority;
import com.portfolio.helpdesk.ticket.TicketStatus;
import com.portfolio.helpdesk.comment.CommentDtos;
import com.portfolio.helpdesk.activity.ActivityDtos;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public final class DashboardDtos {
    private DashboardDtos() {}

    public record RankingItem(String label, long total) {}

    public record DailyVolume(LocalDate date, long created, long resolved) {}

    public record TechnicianProductivity(
        String technician,
        long assigned,
        long inProgress,
        long resolved,
        long resolvedThisWeek,
        Long averageResolutionMinutes,
        long productivityPercent
    ) {}

    public record Response(
        long total,
        long open,
        long inProgress,
        long resolved,
        long canceled,
        long createdToday,
        long createdThisWeek,
        long resolvedToday,
        long resolvedThisWeek,
        long overdueSla,
        long nearDueSla,
        long withinSla,
        Long averageResolutionMinutes,
        Map<TicketStatus, Long> byStatus,
        Map<TicketPriority, Long> byPriority,
        Map<TicketCategory, Long> byCategory,
        List<RankingItem> byTechnician,
        List<RankingItem> byClient,
        List<RankingItem> productivityByTechnician,
        List<TechnicianProductivity> technicianProductivity,
        List<RankingItem> averageResolutionByCategory,
        List<DailyVolume> dailyVolume,
        List<TicketDtos.Response> recentTickets,
        List<CommentDtos.Response> recentComments,
        List<ActivityDtos.Response> recentActivities
    ) {}
}
