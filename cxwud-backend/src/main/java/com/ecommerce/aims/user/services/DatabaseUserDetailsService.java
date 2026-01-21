package com.ecommerce.aims.user.services;

import com.ecommerce.aims.user.models.User;
import com.ecommerce.aims.user.models.UserPrincipal;
import com.ecommerce.aims.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class DatabaseUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByEmailWithRoles(username)
            .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

        return new UserPrincipal(user);
    }
}
