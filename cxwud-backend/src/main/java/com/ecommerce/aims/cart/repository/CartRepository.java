package com.ecommerce.aims.cart.repository;

import com.ecommerce.aims.cart.models.Cart;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CartRepository extends JpaRepository<Cart, Long> {
    Optional<Cart> findBySessionKey(String sessionKey);
}
