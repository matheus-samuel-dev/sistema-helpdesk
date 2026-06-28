package com.portfolio.helpdesk.security;
import com.portfolio.helpdesk.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;
@Service @RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {
    private final UserRepository repository;
    public UserDetails loadUserByUsername(String username) { return repository.findByEmailIgnoreCase(username).map(AuthenticatedUser::from).orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado")); }
}
