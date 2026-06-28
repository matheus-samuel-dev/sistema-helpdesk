package com.portfolio.helpdesk.security;
import com.portfolio.helpdesk.user.*;
import org.springframework.security.core.*;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import java.util.Collection;
public record AuthenticatedUser(Long id, String name, String email, String password, UserRole role, boolean active) implements UserDetails {
    public static AuthenticatedUser from(User u) { return new AuthenticatedUser(u.getId(),u.getName(),u.getEmail(),u.getPassword(),u.getRole(),u.isActive()); }
    public Collection<? extends GrantedAuthority> getAuthorities() { return java.util.List.of(new SimpleGrantedAuthority("ROLE_"+role.name())); }
    public String getPassword() { return password; }
    public String getUsername() { return email; }
    public boolean isEnabled() { return active; }
}
