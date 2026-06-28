package com.portfolio.helpdesk.security;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.security.core.userdetails.UserDetails;
import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
@Service
public class JwtService {
    private final SecretKey key; private final long expirationMs;
    public JwtService(@Value("${app.jwt.secret}") String secret, @Value("${app.jwt.expiration-ms}") long expirationMs) { this.key=Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8)); this.expirationMs=expirationMs; }
    public String generate(AuthenticatedUser user) { var now=Instant.now(); return Jwts.builder().subject(user.email()).claim("uid",user.id()).claim("role",user.role().name()).issuedAt(Date.from(now)).expiration(Date.from(now.plusMillis(expirationMs))).signWith(key).compact(); }
    public String subject(String token) { return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload().getSubject(); }
    public boolean valid(String token, UserDetails user) { try { var c=Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload(); return c.getSubject().equals(user.getUsername()) && c.getExpiration().after(new Date()) && user.isEnabled(); } catch (JwtException|IllegalArgumentException e) { return false; } }
    public long expirationSeconds() { return expirationMs/1000; }
}
