package com.ecommerce.aims.user.dto;

import com.ecommerce.aims.user.models.Role;
import com.ecommerce.aims.user.models.RoleName;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class RoleResponse {
    private Long id;
    private RoleName name;

    public static RoleResponse from(Role role) {
        return RoleResponse.builder()
            .id(role.getId())
            .name(role.getName())
            .build();
    }
}
