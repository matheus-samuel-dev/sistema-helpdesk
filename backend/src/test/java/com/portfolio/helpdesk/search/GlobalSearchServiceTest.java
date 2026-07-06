package com.portfolio.helpdesk.search;

import com.portfolio.helpdesk.comment.CommentRepository;
import com.portfolio.helpdesk.security.AuthenticatedUser;
import com.portfolio.helpdesk.ticket.TicketRepository;
import com.portfolio.helpdesk.user.UserRepository;
import com.portfolio.helpdesk.user.UserRole;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verifyNoInteractions;

@ExtendWith(MockitoExtension.class)
class GlobalSearchServiceTest {
    @Mock
    TicketRepository tickets;

    @Mock
    UserRepository users;

    @Mock
    CommentRepository comments;

    @InjectMocks
    GlobalSearchService service;

    @Test
    void shortQueriesReturnEmptyResultsWithoutRepositoryAccess() {
        var result = service.search("a", new AuthenticatedUser(1L, "Admin", "admin@x.com", "hash", UserRole.ADMIN, true));

        assertThat(result.tickets()).isEmpty();
        assertThat(result.users()).isEmpty();
        assertThat(result.categories()).isEmpty();
        assertThat(result.comments()).isEmpty();
        verifyNoInteractions(tickets, users, comments);
    }
}

