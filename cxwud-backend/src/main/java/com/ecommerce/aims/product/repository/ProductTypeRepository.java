package com.ecommerce.aims.product.repository;

import com.ecommerce.aims.product.models.ProductType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class ProductTypeRepository {
    
    private final IProductTypeRepository productTypeRepository;
    
    public Optional<ProductType> findById(Long id) {
        return productTypeRepository.findById(id);
    }
    
    public Optional<ProductType> findByCodeIgnoreCase(String code) {
        return productTypeRepository.findByCodeIgnoreCase(code);
    }
    
    public ProductType save(ProductType productType) {
        return productTypeRepository.save(productType);
    }
    
    public void delete(ProductType productType) {
        productTypeRepository.delete(productType);
    }
    
    public void deleteById(Long id) {
        productTypeRepository.deleteById(id);
    }
    
    public List<ProductType> findAll() {
        return productTypeRepository.findAll();
    }
    
    public boolean existsById(Long id) {
        return productTypeRepository.existsById(id);
    }
}
