package com.ecommerce.aims.product.repository;

import com.ecommerce.aims.product.models.ProductType;
import com.ecommerce.aims.product.models.TypeAttribute;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class TypeAttributeRepository {
    
    private final ITypeAttributeRepository typeAttributeRepository;
    
    public Optional<TypeAttribute> findById(Long id) {
        return typeAttributeRepository.findById(id);
    }
    
    public TypeAttribute save(TypeAttribute typeAttribute) {
        return typeAttributeRepository.save(typeAttribute);
    }
    
    public void delete(TypeAttribute typeAttribute) {
        typeAttributeRepository.delete(typeAttribute);
    }
    
    public void deleteById(Long id) {
        typeAttributeRepository.deleteById(id);
    }
    
    public List<TypeAttribute> findAll() {
        return typeAttributeRepository.findAll();
    }
    
    public List<TypeAttribute> findRequiredByProductType(ProductType productType) {
        return typeAttributeRepository.findRequiredByProductType(productType);
    }
}
