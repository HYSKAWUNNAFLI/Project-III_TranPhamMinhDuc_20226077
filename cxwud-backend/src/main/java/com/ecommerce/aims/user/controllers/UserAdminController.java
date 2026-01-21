package com.ecommerce.aims.user.controllers;

import com.ecommerce.aims.common.dto.ApiResponse;
import com.ecommerce.aims.common.dto.PageResponse;
import com.ecommerce.aims.user.dto.UpdateUserRolesRequest;
import com.ecommerce.aims.user.dto.UserRequest;
import com.ecommerce.aims.user.dto.UserResponse;
import com.ecommerce.aims.user.services.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class UserAdminController {

    private final UserService userService;

    @PostMapping
    public ApiResponse<UserResponse> create(@Valid @RequestBody UserRequest request) {
        return ApiResponse.success(userService.createUser(request), "User created");
    }

    @PutMapping("/{id}")
    public ApiResponse<UserResponse> update(@PathVariable Long id, @Valid @RequestBody UserRequest request) {
        return ApiResponse.success(userService.updateUser(id, request), "User updated");
    }

    @GetMapping("/{id}")
    public ApiResponse<UserResponse> get(@PathVariable Long id) {
        return ApiResponse.success(userService.getUser(id), "User detail");
    }

    @GetMapping
    public ApiResponse<PageResponse<UserResponse>> list(@RequestParam(defaultValue = "0") int page,
                                                        @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.success(userService.listUsers(page, size), "Users list");
    }

    @PostMapping("/{id}/lock")
    public ApiResponse<UserResponse> lock(@PathVariable Long id) {
        return ApiResponse.success(userService.lockUser(id), "User locked");
    }

    @PostMapping("/{id}/unlock")
    public ApiResponse<UserResponse> unlock(@PathVariable Long id) {
        return ApiResponse.success(userService.unlockUser(id), "User unlocked");
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        userService.deleteUser(id);
        return ApiResponse.success(null, "User deleted");
    }

    @PutMapping("/{id}/roles")
    public ApiResponse<UserResponse> updateRoles(@PathVariable Long id, 
                                                  @Valid @RequestBody UpdateUserRolesRequest request) {
        return ApiResponse.success(userService.updateUserRoles(id, request.getRoles()), "User roles updated");
    }
}
