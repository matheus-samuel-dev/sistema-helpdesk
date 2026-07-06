package com.portfolio.helpdesk.ticket;

public enum TicketPriority {
    BAIXA("Baixa", 72),
    MEDIA("Média", 48),
    ALTA("Alta", 24),
    URGENTE("Urgente", 8),
    CRITICA("Crítica", 4);

    private final String label;
    private final long slaHours;

    TicketPriority(String label, long slaHours) {
        this.label = label;
        this.slaHours = slaHours;
    }

    public String label() {
        return label;
    }

    public long slaHours() {
        return slaHours;
    }
}
