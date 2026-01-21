package com.ecommerce.aims.user.repository;

import com.ecommerce.aims.user.models.Role;
import com.ecommerce.aims.user.models.RoleName;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class RoleRepository {
    
    private final IRoleRepository roleRepository;
    
    public Optional<Role> findById(Long id) {
        return roleRepository.findById(id);
    }
    
    public Optional<Role> findByName(RoleName name) {
        return roleRepository.findByName(name);
    }
    
    public Role save(Role role) {
        return roleRepository.save(role);
    }
    
    public void delete(Role role) {
        roleRepository.delete(role);
    }
}
