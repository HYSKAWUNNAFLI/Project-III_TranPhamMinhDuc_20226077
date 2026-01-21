package com.ecommerce.aims.product.services;

import com.ecommerce.aims.common.exception.BusinessException;
import com.ecommerce.aims.common.exception.NotFoundException;
import com.ecommerce.aims.common.util.MoneyUtils;
import com.ecommerce.aims.product.dto.BulkDeleteResponse;
import com.ecommerce.aims.product.dto.ProductRequest;
import com.ecommerce.aims.product.dto.ProductResponse;
import com.ecommerce.aims.product.models.Product;
import com.ecommerce.aims.product.models.ProductHistory;
import com.ecommerce.aims.product.models.ProductStatus;
import com.ecommerce.aims.product.models.ProductType;
import com.ecommerce.aims.product.models.TypeAttribute;
import com.ecommerce.aims.product.repository.IProductTypeRepository;
import com.ecommerce.aims.product.repository.ITypeAttributeRepository;
import com.ecommerce.aims.product.repository.ProductHistoryRepository;
import com.ecommerce.aims.product.repository.ProductRepository;
import com.ecommerce.aims.product.validation.AttributeValidator;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class ProductAdminService {

    private final ProductRepository productRepository;
    private final ProductHistoryRepository historyRepository;
    private final IProductTypeRepository productTypeRepository;
    private final ITypeAttributeRepository typeAttributeRepository;
    private final AttributeValidator attributeValidator;

    @Transactional
    @CacheEvict(value = "products", allEntries = true)
    public ProductResponse create(ProductRequest request) {
        Objects.requireNonNull(request, "request must not be null");
        validateRequest(request);
        Product product = new Product();
        applyRequest(product, request);
        product.setStatus(request.getStatus() != null ? request.getStatus() : ProductStatus.ACTIVE);
        Product saved = productRepository.save(product);
        historyRepository
                .save(ProductHistory.builder().product(saved).action("CREATE").note("Created product").build());
        return toResponse(saved);
    }

    @Transactional
    @CacheEvict(value = "products", allEntries = true)
    public ProductResponse update(Long id, ProductRequest request) {
        Long requiredId = Objects.requireNonNull(id, "id must not be null");
        Objects.requireNonNull(request, "request must not be null");
        validateRequest(request);
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Product not found"));
        
        applyRequest(product, request);
        Product saved = productRepository.save(product);
        historyRepository
                .save(ProductHistory.builder().product(saved).action("UPDATE").note("Updated product").build());
        return toResponse(saved);
    }

    @Transactional
    @CacheEvict(value = "products", allEntries = true)
    public void deleteOrDeactivate(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Product not found"));

        long deletesToday = countDeletesToday();
        if (deletesToday >= 20) {
            throw new BusinessException("Daily delete limit reached (20 products/day)");
        }

        Integer stock = product.getStock();
        if (stock != null && stock > 0) {
            product.setStatus(ProductStatus.DEACTIVATED);
            productRepository.save(product);
            historyRepository.save(ProductHistory.builder().product(product).action("DEACTIVATE")
                    .note("Stock remaining, deactivated").build());
            return;
        }
        historyRepository.save(ProductHistory.builder().product(null).action("DELETE")
                .note("Deleted product " + product.getId()).build());
        productRepository.delete(product);
    }

    @Transactional
    @CacheEvict(value = "products", allEntries = true)
    public BulkDeleteResponse bulkDelete(List<Long> productIds) {
        Objects.requireNonNull(productIds, "productIds must not be null");

        if (productIds.isEmpty()) {
            throw new BusinessException("Product IDs list cannot be empty");
        }

        if (productIds.size() > 10) {
            throw new BusinessException("Cannot delete more than 10 products at once");
        }

        long deletesToday = countDeletesToday();
        long remainingQuota = 20 - deletesToday;

        if (remainingQuota <= 0) {
            throw new BusinessException("Daily delete limit reached (20 products/day)");
        }

        if (productIds.size() > remainingQuota) {
            throw new BusinessException(
                    String.format("Cannot delete %d products. Daily quota remaining: %d",
                            productIds.size(), remainingQuota));
        }

        List<Long> deletedIds = new ArrayList<>();
        List<Long> deactivatedIds = new ArrayList<>();
        List<String> errors = new ArrayList<>();

        for (Long productId : productIds) {
            try {
                Product product = productRepository.findById(productId)
                        .orElseThrow(() -> new NotFoundException("Product not found: " + productId));

                Integer stock = product.getStock();
                if (stock != null && stock > 0) {
                    product.setStatus(ProductStatus.DEACTIVATED);
                    productRepository.save(product);
                    historyRepository.save(ProductHistory.builder()
                            .product(product)
                            .action("DEACTIVATE")
                            .note("Bulk operation: Stock remaining, deactivated")
                            .build());
                    deactivatedIds.add(productId);
                } else {
                    historyRepository.save(ProductHistory.builder()
                            .product(null)
                            .action("DELETE")
                            .note("Bulk operation: Deleted product " + productId)
                            .build());
                    productRepository.delete(product);
                    deletedIds.add(productId);
                }
            } catch (Exception e) {
                errors.add("Product " + productId + ": " + e.getMessage());
            }
        }

        return BulkDeleteResponse.builder()
                .deletedCount(deletedIds.size())
                .deactivatedCount(deactivatedIds.size())
                .deletedIds(deletedIds)
                .deactivatedIds(deactivatedIds)
                .errors(errors)
                .build();
    }

    private long countDeletesToday() {
        LocalDate today = LocalDate.now();
        LocalDateTime start = today.atStartOfDay();
        LocalDateTime end = today.plusDays(1).atStartOfDay();
        return historyRepository.countByActionAndCreatedAtBetween("DELETE", start, end);
    }

    private void applyRequest(Product product, ProductRequest request) {
        Objects.requireNonNull(product, "product must not be null");
        Objects.requireNonNull(request, "request must not be null");
        if (request.getOriginalValue() != null && request.getCurrentPrice() != null) {
            if (!MoneyUtils.isWithinPriceRule(request.getOriginalValue(), request.getCurrentPrice())) {
                throw new BusinessException("Current price must be between 30% and 150% of original value");
            }
        }
        ProductType productType = resolveProductType(request.getTypeCode());
        Map<String, Object> attributes = request.getAttributes();
        if (attributes == null) {
            attributes = new HashMap<>();
        }
        validateRequiredAttributes(productType, attributes);
        product.setProductType(productType);
        product.setStatus(request.getStatus() != null ? request.getStatus() : ProductStatus.ACTIVE);
        product.setImageUrl(request.getImageUrl());
        product.setBarcode(request.getBarcode());
        product.setTitle(request.getTitle());
        product.setCategory(request.getCategory());
        product.setDescription(request.getDescription());
        product.setConditionLabel(request.getConditionLabel());
        product.setDominantColor(request.getDominantColor());
        product.setReturnPolicy(request.getReturnPolicy());
        product.setHeight(request.getHeight());
        product.setWidth(request.getWidth());
        product.setLength(request.getLength());
        product.setWeight(request.getWeight());
        product.setOriginalValue(request.getOriginalValue());
        product.setCurrentPrice(request.getCurrentPrice());
        product.setStock(request.getStock());
        product.setAttributes(attributes);
    }

    private void validateRequest(ProductRequest request) {
        Objects.requireNonNull(request, "request must not be null");
        if (request.getOriginalValue() != null && request.getOriginalValue().signum() <= 0) {
            throw new BusinessException("Original value must be positive");
        }
        if (request.getCurrentPrice() != null && request.getCurrentPrice().signum() <= 0) {
            throw new BusinessException("Current price must be positive");
        }
        if (request.getStock() == null) {
            throw new BusinessException("Stock is required");
        }
        if (request.getStock() != null && request.getStock() < 0) {
            throw new BusinessException("Stock cannot be negative");
        }
    }

    private ProductType resolveProductType(String typeCode) {
        if (!StringUtils.hasText(typeCode)) {
            throw new BusinessException("Product type code is required");
        }
        return productTypeRepository.findByCodeIgnoreCase(typeCode.trim())
                .orElseThrow(() -> new NotFoundException("Product type not found"));
    }

    private void validateRequiredAttributes(ProductType productType, Map<String, Object> attributes) {
        List<TypeAttribute> requiredAttributes = typeAttributeRepository.findRequiredByProductType(productType);
        if (requiredAttributes.isEmpty()) {
            return;
        }
        attributeValidator.validateAttributes(attributes, requiredAttributes);
    }

    private ProductResponse toResponse(Product product) {
        Product requiredProduct = Objects.requireNonNull(product, "product must not be null");
        return ProductResponse.builder()
                .id(product.getId())
                .typeCode(product.getProductType() != null ? product.getProductType().getCode() : null)
                .status(product.getStatus())
                .imageUrl(product.getImageUrl())
                .barcode(product.getBarcode())
                .title(product.getTitle())
                .category(product.getCategory())
                .description(product.getDescription())
                .conditionLabel(product.getConditionLabel())
                .dominantColor(product.getDominantColor())
                .returnPolicy(product.getReturnPolicy())
                .height(product.getHeight())
                .width(product.getWidth())
                .length(product.getLength())
                .weight(product.getWeight())
                .originalValue(product.getOriginalValue())
                .currentPrice(product.getCurrentPrice())
                .stock(product.getStock())
                .attributes(product.getAttributes())
                .build();
    }
}
