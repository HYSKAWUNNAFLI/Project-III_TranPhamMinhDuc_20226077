package com.ecommerce.aims.user.services;

import com.ecommerce.aims.common.exception.BusinessException;
import com.ecommerce.aims.common.exception.NotFoundException;
import com.ecommerce.aims.user.models.Role;
import com.ecommerce.aims.user.models.RoleName;
import com.ecommerce.aims.user.repository.IRoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RoleService {

    private final IRoleRepository roleRepository;

    public List<Role> getAllRoles() {
        return roleRepository.findAll();
    }

    public Role getRoleById(Long id) {
        return roleRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Role not found"));
    }

    public Role getRoleByName(RoleName name) {
        return roleRepository.findByName(name)
            .orElseThrow(() -> new NotFoundException("Role not found: " + name));
    }

    @Transactional
    public Role updateRoleById(Long id, RoleName name) {
        Role role = getRoleById(id);
        
        if (roleRepository.findByName(name).isPresent()) {
            throw new BusinessException("Role name already exists: " + name);
        }
        
        role.setName(name);
        return roleRepository.save(role);
    }

    @Transactional
    public Role createRole(RoleName name) {
        if (roleRepository.findByName(name).isPresent()) {
            throw new BusinessException("Role already exists: " + name);
        }

        Role role = Role.builder()
            .name(name)
            .build();

        return roleRepository.save(role);
    }

    @Transactional
    public void deleteRole(Long id) {
        Role role = getRoleById(id);
        roleRepository.delete(role);
    }
}
