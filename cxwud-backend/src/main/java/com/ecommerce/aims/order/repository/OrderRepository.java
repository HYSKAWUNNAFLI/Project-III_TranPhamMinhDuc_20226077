package com.ecommerce.aims.order.repository;

import com.ecommerce.aims.order.models.Order;
import com.ecommerce.aims.order.models.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    Page<Order> findByStatus(OrderStatus status, Pageable pageable);

    // Find expired orders for auto-cancellation
    List<Order> findByStatusAndExpiresAtBefore(OrderStatus status, LocalDateTime expiresAt);

    // Find old orders for cleanup
    List<Order> findByStatusAndUpdatedAtBefore(OrderStatus status, LocalDateTime updatedAt);

    // Find most recent pending order by cart session key
    Order findTopByCartSessionKeyAndStatusOrderByCreatedAtDesc(String cartSessionKey, OrderStatus status);
}
