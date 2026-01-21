package com.ecommerce.aims.user.services;

import com.ecommerce.aims.common.dto.PageResponse;
import com.ecommerce.aims.common.exception.BusinessException;
import com.ecommerce.aims.common.exception.NotFoundException;
import com.ecommerce.aims.middleware.security.jwt.JwtService;
import com.ecommerce.aims.notification.models.NotificationEventType;
import com.ecommerce.aims.notification.services.NotificationOutboxService;
import com.ecommerce.aims.user.dto.UserRequest;
import com.ecommerce.aims.user.dto.UserResponse;
import com.ecommerce.aims.user.models.Role;
import com.ecommerce.aims.user.models.RoleName;
import com.ecommerce.aims.user.models.User;
import com.ecommerce.aims.user.models.UserStatus;
import com.ecommerce.aims.user.repository.IRoleRepository;
import com.ecommerce.aims.user.repository.UserRepository;
import java.util.HashSet;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
// TODO: ISP violation - this service mixes multiple “client” use-cases:
// - Admin use-cases: listUsers(), lockUser(), unlockUser()
// - End-user profile use-cases: updateUser(), getUser()
// - Auth/registration use-cases: createUser()
// Why this is risky:
// - Any controller that injects UserService can access admin-only operations by accident.
// - Changes for one client type (e.g., admin auditing, extra validations) can unintentionally impact other flows.
// Recommended refactor:
// - Split into smaller interfaces/services (e.g., UserAdminService, UserProfileService, UserRegistrationService)
//   and inject only the narrow dependency needed per controller.
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final IRoleRepository IRoleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final NotificationOutboxService notificationOutboxService;

    @Transactional
    public UserResponse createUser(UserRequest request) {
        Objects.requireNonNull(request, "request must not be null");
        if (request.getEmail() == null || request.getPassword() == null) {
            throw new BusinessException("Email and password are required");
        }
        userRepository.findByEmail(request.getEmail()).ifPresent(u -> {
            throw new BusinessException("Email already exists");
        });
        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setStatus(request.getStatus() != null ? request.getStatus() : UserStatus.ACTIVE);
        user.setRoles(resolveRoles(request.getRoles()));
        User savedUser = userRepository.save(user);
        
        notificationOutboxService.enqueue(
                NotificationEventType.USER_CREATED_BY_ADMIN,
                Map.of("email", savedUser.getEmail(), "temporaryPassword", request.getPassword()),
                "user-created:" + savedUser.getId());
        
        return toResponse(savedUser);
    }

    @Transactional
    public UserResponse updateUser(Long id, UserRequest request) {
        Long requiredId = Objects.requireNonNull(id, "id must not be null");
        Objects.requireNonNull(request, "request must not be null");
        User user = userRepository.findById(requiredId)
            .orElseThrow(() -> new NotFoundException("User not found"));
        if (request.getEmail() != null) {
            userRepository.findByEmail(request.getEmail()).ifPresent(existing -> {
                if (!existing.getId().equals(requiredId)) {
                    throw new BusinessException("Email already exists");
                }
            });
            user.setEmail(request.getEmail());
        }
        if (request.getPassword() != null) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }
        if (request.getStatus() != null) {
            user.setStatus(request.getStatus());
        }
        if (request.getRoles() != null && !request.getRoles().isEmpty()) {
            user.setRoles(resolveRoles(request.getRoles()));
        }
        User savedUser = userRepository.save(user);
        
        notificationOutboxService.enqueue(
                NotificationEventType.USER_UPDATED_BY_ADMIN,
                Map.of("email", savedUser.getEmail()));
        
        return toResponse(savedUser);
    }

    public UserResponse getUser(Long id) {
        Long requiredId = Objects.requireNonNull(id, "id must not be null");
        return userRepository.findById(requiredId)
            .map(this::toResponse)
            .orElseThrow(() -> new NotFoundException("User not found"));
    }

    public PageResponse<UserResponse> listUsers(int page, int size) {
        Page<User> result = userRepository.findAll(PageRequest.of(page, size));
        return PageResponse.<UserResponse>builder()
            .items(result.map(this::toResponse).getContent())
            .page(result.getNumber())
            .size(result.getSize())
            .totalElements(result.getTotalElements())
            .totalPages(result.getTotalPages())
            .build();
    }

    @Transactional
    public UserResponse lockUser(Long id) {
        Long requiredId = Objects.requireNonNull(id, "id must not be null");
        User user = userRepository.findById(requiredId)
            .orElseThrow(() -> new NotFoundException("User not found"));
        user.setStatus(UserStatus.LOCKED);
        User savedUser = userRepository.save(user);
        
        notificationOutboxService.enqueue(
                NotificationEventType.USER_LOCKED_BY_ADMIN,
                Map.of("email", savedUser.getEmail()));
        
        return toResponse(savedUser);
    }

    @Transactional
    public UserResponse unlockUser(Long id) {
        Long requiredId = Objects.requireNonNull(id, "id must not be null");
        User user = userRepository.findById(requiredId)
            .orElseThrow(() -> new NotFoundException("User not found"));
        user.setStatus(UserStatus.ACTIVE);
        User savedUser = userRepository.save(user);
        
        notificationOutboxService.enqueue(
                NotificationEventType.USER_UNLOCKED_BY_ADMIN,
                Map.of("email", savedUser.getEmail()));
        
        return toResponse(savedUser);
    }

    @Transactional
    public void deleteUser(Long id) {
        Long requiredId = Objects.requireNonNull(id, "id must not be null");
        User user = userRepository.findById(requiredId)
            .orElseThrow(() -> new NotFoundException("User not found"));
        String email = user.getEmail();
        
        userRepository.delete(user);
        
        notificationOutboxService.enqueue(
                NotificationEventType.USER_DELETED_BY_ADMIN,
                Map.of("email", email),
                "user-deleted:" + requiredId);
    }

    @Transactional
    public void adminResetPassword(Long id) {
        Long requiredId = Objects.requireNonNull(id, "id must not be null");
        User user = userRepository.findById(requiredId)
            .orElseThrow(() -> new NotFoundException("User not found"));
        
        if (user.getStatus() == UserStatus.LOCKED) {
            throw new BusinessException("Cannot reset password for locked user");
        }
        
        String token = jwtService.generatePasswordResetToken(user.getEmail(), user.getId());
        
        notificationOutboxService.enqueue(
                NotificationEventType.ADMIN_PASSWORD_RESET,
                Map.of("email", user.getEmail(), "token", token),
                "admin-password-reset:" + user.getId() + ":" + token);
    }

    @Transactional
    public UserResponse updateUserRoles(Long userId, Set<String> roleNames) {
        Long requiredId = Objects.requireNonNull(userId, "userId must not be null");
        Objects.requireNonNull(roleNames, "roleNames must not be null");
        
        if (roleNames.isEmpty()) {
            throw new BusinessException("Role list cannot be empty");
        }
        
        User user = userRepository.findById(requiredId)
            .orElseThrow(() -> new NotFoundException("User not found"));
        
        Set<Role> newRoles = resolveRoles(roleNames);
        
        User updatedUser = userRepository.updateUserRoles(requiredId, newRoles);
        
        notificationOutboxService.enqueue(
                NotificationEventType.USER_UPDATED_BY_ADMIN,
                Map.of("email", updatedUser.getEmail()));
        
        return toResponse(updatedUser);
    }

    private Set<Role> resolveRoles(Set<String> roleNames) {
        if (roleNames == null || roleNames.isEmpty()) {
            return new HashSet<>();
        }
        return roleNames.stream()
            .map(name -> {
                try {
                    RoleName roleName = RoleName.valueOf(name);
                    return IRoleRepository.findByName(roleName)
                        // TODO: SRP violation - UserService is responsible for user management but is also managing Role lifecycle.
                        // Why this is risky:
                        // - Assigning roles becomes coupled to role creation rules (defaults, description, permissions, etc.).
                        // - Silent creation can mask configuration errors (typos in role name suddenly create a new Role row).
                        // - Expanding Role (extra fields) will force changes in UserService, reducing cohesion.
                        // Recommended refactor:
                        // - Only allow assigning pre-existing roles; if missing, throw a clear BusinessException.
                        // - Move role creation/maintenance into a dedicated RoleService or an admin provisioning flow.
                        .orElseGet(() -> IRoleRepository.save(Role.builder().name(roleName).build()));
                } catch (IllegalArgumentException e) {
                    throw new BusinessException("Invalid role name: " + name);
                }
            })
            .collect(Collectors.toSet());
    }

    private UserResponse toResponse(User user) {
        User requiredUser = Objects.requireNonNull(user, "user must not be null");
        Set<Role> roles = requiredUser.getRoles() == null ? Set.of() : requiredUser.getRoles();
        return UserResponse.builder()
            .id(requiredUser.getId())
            .email(requiredUser.getEmail())
            .status(requiredUser.getStatus())
            .roles(roles.stream()
                .map(role -> role.getName().name())
                .collect(Collectors.toSet()))
            .build();
    }
}
