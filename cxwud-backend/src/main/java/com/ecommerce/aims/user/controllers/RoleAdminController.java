package com.ecommerce.aims.user.controllers;

import com.ecommerce.aims.common.dto.ApiResponse;
import com.ecommerce.aims.user.dto.RoleRequest;
import com.ecommerce.aims.user.dto.RoleResponse;
import com.ecommerce.aims.user.services.RoleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/roles")
@RequiredArgsConstructor
public class RoleAdminController {

    private final RoleService roleService;

    @GetMapping
    public ApiResponse<List<RoleResponse>> getAllRoles() {
        List<RoleResponse> roles = roleService.getAllRoles().stream()
            .map(RoleResponse::from)
            .collect(Collectors.toList());
        return ApiResponse.success(roles, "Roles retrieved");
    }

    @GetMapping("/{id}")
    public ApiResponse<RoleResponse> getRoleById(@PathVariable Long id) {
        return ApiResponse.success(
            RoleResponse.from(roleService.getRoleById(id)),
            "Role retrieved"
        );
    }

    @PutMapping("/{id}")
    public ApiResponse<RoleResponse> updateRoleById(@PathVariable Long id, 
                                                     @Valid @RequestBody RoleRequest request) {
        return ApiResponse.success(
                RoleResponse.from(roleService.updateRoleById(id, request.getName())),
                "Role updated"
        );
    }

    @PostMapping
    public ApiResponse<RoleResponse> createRole(@Valid @RequestBody RoleRequest request) {
        return ApiResponse.success(
            RoleResponse.from(roleService.createRole(request.getName())),
            "Role created"
        );
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteRole(@PathVariable Long id) {
        roleService.deleteRole(id);
        return ApiResponse.success(null, "Role deleted");
    }
}
