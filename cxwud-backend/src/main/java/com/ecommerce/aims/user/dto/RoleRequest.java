package com.ecommerce.aims.user.dto;

import com.ecommerce.aims.user.models.RoleName;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class RoleRequest {
    @NotNull(message = "Role name is required")
    private RoleName name;
}
