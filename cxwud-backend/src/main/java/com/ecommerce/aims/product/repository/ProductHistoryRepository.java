package com.ecommerce.aims.product.repository;

import com.ecommerce.aims.product.models.ProductHistory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class ProductHistoryRepository {
    
    private final IProductHistoryRepository productHistoryRepository;
    
    public Optional<ProductHistory> findById(Long id) {
        return productHistoryRepository.findById(id);
    }
    
    public ProductHistory save(ProductHistory productHistory) {
        return productHistoryRepository.save(productHistory);
    }
    
    public void delete(ProductHistory productHistory) {
        productHistoryRepository.delete(productHistory);
    }
    
    public List<ProductHistory> findAll() {
        return productHistoryRepository.findAll();
    }
    
    public long countByActionAndCreatedAtBetween(String action, LocalDateTime start, LocalDateTime end) {
        return productHistoryRepository.countByActionAndCreatedAtBetween(action, start, end);
    }
}
