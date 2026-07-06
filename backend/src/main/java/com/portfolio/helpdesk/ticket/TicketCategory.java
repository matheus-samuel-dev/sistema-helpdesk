package com.portfolio.helpdesk.ticket;

public enum TicketCategory {
    HARDWARE("Hardware"),
    SOFTWARE("Software"),
    REDE("Rede"),
    IMPRESSORA("Impressora"),
    ACESSO("Acesso"),
    BANCO_DE_DADOS("Banco de Dados"),
    INFRAESTRUTURA("Infraestrutura"),
    OUTROS("Outros");

    private final String label;

    TicketCategory(String label) {
        this.label = label;
    }

    public String label() {
        return label;
    }
}
