package com.ecommerce.aims.user.dto;

import com.ecommerce.aims.user.models.UserStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.Set;
import lombok.Data;

@Data
public class UserRequest {
    @Email
    @NotBlank
    private String email;
    @NotBlank
    @Size(min = 6)
    private String password;
    private UserStatus status;
    private Set<String> roles;
}
