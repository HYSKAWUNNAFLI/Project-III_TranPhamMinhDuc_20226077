package com.ecommerce.aims.user.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.Set;

@Data
public class UpdateUserRolesRequest {
    @NotEmpty(message = "Roles cannot be empty")
    private Set<String> roles;
}
