package com.ecommerce.aims.product.repository;

import com.ecommerce.aims.product.models.ProductHistory;
import java.time.LocalDateTime;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface IProductHistoryRepository extends JpaRepository<ProductHistory, Long> {
    long countByActionAndCreatedAtBetween(String action, LocalDateTime start, LocalDateTime end);
}
