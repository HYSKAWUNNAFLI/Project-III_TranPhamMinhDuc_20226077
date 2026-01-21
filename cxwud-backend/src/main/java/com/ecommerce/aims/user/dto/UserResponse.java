package com.ecommerce.aims.user.dto;

import com.ecommerce.aims.user.models.UserStatus;
import java.util.Set;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserResponse {
    private Long id;
    private String email;
    private UserStatus status;
    private Set<String> roles;
}
