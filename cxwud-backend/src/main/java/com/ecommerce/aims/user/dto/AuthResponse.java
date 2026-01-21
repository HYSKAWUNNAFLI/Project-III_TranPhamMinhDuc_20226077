package com.ecommerce.aims.user.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String accessToken;
    private String refreshToken;
    private String tokenType;
    private Instant accessTokenExpiresAt;
    private UserResponse user;
    
    public static AuthResponse of(String accessToken, String refreshToken, Instant expiresAt, UserResponse user) {
        return AuthResponse.builder()
            .accessToken(accessToken)
            .refreshToken(refreshToken)
            .tokenType("Bearer")
            .accessTokenExpiresAt(expiresAt)
            .user(user)
            .build();
    }
}
