package com.ecommerce.aims.middleware.security.jwt;

import com.ecommerce.aims.user.models.UserPrincipal;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class JwtService {

    @Value("${security.jwt.secret-key}")
    private String secretKey;

    @Value("${security.jwt.access-token-expiration:900000}")
    private long accessTokenExpirationMs;

    @Value("${security.jwt.refresh-token-expiration:604800000}")
    private long refreshTokenExpirationMs;

    @Value("${security.jwt.password-reset-expiration:86400000}")
    private long passwordResetExpirationMs;

    @Value("${security.jwt.issuer:aims-backend}")
    private String issuer;

    public String generateAccessToken(UserPrincipal principal) {
        List<String> roles = principal.getAuthorities().stream()
            .map(GrantedAuthority::getAuthority)
            .collect(Collectors.toList());

        Instant now = Instant.now();
        Instant expiration = now.plusMillis(accessTokenExpirationMs);

        return Jwts.builder()
            .subject(principal.getUsername())
            .claim("userId", principal.getId())
            .claim("roles", roles)
            .issuer(issuer)
            .issuedAt(Date.from(now))
            .expiration(Date.from(expiration))
            .signWith(getSigningKey())
            .compact();
    }

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public Long extractUserId(String token) {
        return extractClaim(token, claims -> claims.get("userId", Long.class));
    }

    @SuppressWarnings("unchecked")
    public List<String> extractRoles(String token) {
        return extractClaim(token, claims -> claims.get("roles", List.class));
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        try {
            final String username = extractUsername(token);
            return username.equals(userDetails.getUsername()) && !isTokenExpired(token);
        } catch (Exception e) {
            return false;
        }
    }

    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    private <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
            .verifyWith(getSigningKey())
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }

    private SecretKey getSigningKey() {
        byte[] keyBytes = secretKey.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public Instant getAccessTokenExpiration() {
        return Instant.now().plusMillis(accessTokenExpirationMs);
    }

    public String generateRefreshToken(UserPrincipal principal) {
        Instant now = Instant.now();
        Instant expiration = now.plusMillis(refreshTokenExpirationMs);

        return Jwts.builder()
            .subject(principal.getUsername())
            .claim("userId", principal.getId())
            .claim("type", "refresh")
            .issuer(issuer)
            .issuedAt(Date.from(now))
            .expiration(Date.from(expiration))
            .signWith(getSigningKey())
            .compact();
    }

    public boolean isRefreshToken(String token) {
        try {
            String type = extractClaim(token, claims -> claims.get("type", String.class));
            return "refresh".equals(type);
        } catch (Exception e) {
            return false;
        }
    }

    public Instant getRefreshTokenExpiration() {
        return Instant.now().plusMillis(refreshTokenExpirationMs);
    }

    public String generatePasswordResetToken(String email, Long userId) {
        Instant now = Instant.now();
        Instant expiration = now.plusMillis(passwordResetExpirationMs);

        return Jwts.builder()
            .subject(email)
            .claim("userId", userId)
            .claim("type", "password-reset")
            .issuer(issuer)
            .issuedAt(Date.from(now))
            .expiration(Date.from(expiration))
            .signWith(getSigningKey())
            .compact();
    }

    public boolean isPasswordResetToken(String token) {
        try {
            String type = extractClaim(token, claims -> claims.get("type", String.class));
            return "password-reset".equals(type);
        } catch (Exception e) {
            return false;
        }
    }

    public boolean isPasswordResetTokenValid(String token) {
        try {
            return isPasswordResetToken(token) && !isTokenExpired(token);
        } catch (Exception e) {
            return false;
        }
    }
}
