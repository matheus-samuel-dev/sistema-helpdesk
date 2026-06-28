package com.portfolio.helpdesk.search;

import java.util.List;

public final class SearchDtos {
    private SearchDtos() {}

    public record Result(String type, String label, String description, String targetUrl) {}

    public record Response(
        List<Result> tickets,
        List<Result> users,
        List<Result> categories,
        List<Result> comments
    ) {}
}
