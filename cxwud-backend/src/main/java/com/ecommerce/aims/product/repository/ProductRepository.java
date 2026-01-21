package com.ecommerce.aims.product.repository;

import com.ecommerce.aims.product.models.Product;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class ProductRepository {

    private final IProductRepository productRepository;

    public Optional<Product> findById(Long id) {
        return productRepository.findById(id);
    }

    public Product save(Product product) {
        return productRepository.save(product);
    }

    public void delete(Product product) {
        productRepository.delete(product);
    }

    public void deleteById(Long id) {
        productRepository.deleteById(id);
    }

    public List<Product> findAll() {
        return productRepository.findAll();
    }

    public Page<Product> findAll(Pageable pageable) {
        return productRepository.findAll(pageable);
    }

    public Page<Product> findAll(Specification<Product> spec, Pageable pageable) {
        return productRepository.findAll(spec, pageable);
    }

    public long count() {
        return productRepository.count();
    }

    public List<Product> findAllById(Iterable<Long> ids) {
        return productRepository.findAllById(ids);
    }

    public boolean existsById(Long id) {
        return productRepository.existsById(id);
    }

    public List<Product> findAllByIdInForUpdate(List<Long> ids) {
        return productRepository.findAllByIdInForUpdate(ids);
    }
}
