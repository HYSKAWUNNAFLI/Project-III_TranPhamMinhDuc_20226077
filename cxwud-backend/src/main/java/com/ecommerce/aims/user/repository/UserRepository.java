package com.ecommerce.aims.user.repository;

import com.ecommerce.aims.user.models.Role;
import com.ecommerce.aims.user.models.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.Set;

@Repository
@RequiredArgsConstructor
public class UserRepository {
    
    private final IUserRepository userRepository;
    
    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }
    
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }
    
    public Optional<User> findByEmailWithRoles(String email) {
        return userRepository.findByEmailWithRoles(email);
    }
    
    public User save(User user) {
        return userRepository.save(user);
    }
    
    public void delete(User user) {
        userRepository.delete(user);
    }
    
    public List<User> findAll() {
        return userRepository.findAll();
    }
    
    public org.springframework.data.domain.Page<User> findAll(org.springframework.data.domain.Pageable pageable) {
        return userRepository.findAll(pageable);
    }
    
    @Transactional
    public User updateUserRoles(Long userId, Set<Role> newRoles) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        user.getRoles().clear();
        user.getRoles().addAll(newRoles);
        
        return userRepository.save(user);
    }
}
