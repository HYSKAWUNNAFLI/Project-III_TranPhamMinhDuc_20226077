package com.ecommerce.aims.product.services;

import com.ecommerce.aims.common.dto.PageResponse;
import com.ecommerce.aims.common.exception.NotFoundException;
import com.ecommerce.aims.product.dto.ProductFilterRequest;
import com.ecommerce.aims.product.dto.ProductResponse;
import com.ecommerce.aims.product.models.Product;
import com.ecommerce.aims.product.models.ProductStatus;
import com.ecommerce.aims.product.repository.ProductRepository;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class ProductService {

    private static final BigDecimal PRICE_200K = new BigDecimal("200000");
    private static final BigDecimal PRICE_500K = new BigDecimal("500000");

    private final ProductRepository productRepository;

    @Cacheable(value = "products", key = "#filterRequest")
    public PageResponse<ProductResponse> listProducts(ProductFilterRequest filterRequest) {
        Objects.requireNonNull(filterRequest, "filterRequest must not be null");
        Specification<Product> spec = Objects.requireNonNull(buildSpecification(filterRequest, true),
                "specification must not be null");
        int pageNumber = filterRequest.getPage();
        int pageSize = filterRequest.getSize();
        Page<Product> page = productRepository.findAll(spec, PageRequest.of(pageNumber, pageSize));
        return PageResponse.<ProductResponse>builder()
                .items(page.map(this::toResponse).getContent())
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .build();
    }

    public PageResponse<ProductResponse> listProductsForPM(ProductFilterRequest filterRequest) {
        Objects.requireNonNull(filterRequest, "filterRequest must not be null");
        Specification<Product> spec = Objects.requireNonNull(buildSpecification(filterRequest, false),
                "specification must not be null");
        int pageNumber = filterRequest.getPage();
        int pageSize = filterRequest.getSize();
        Page<Product> page = productRepository.findAll(spec, PageRequest.of(pageNumber, pageSize));
        return PageResponse.<ProductResponse>builder()
                .items(page.map(this::toResponse).getContent())
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .build();
    }

    public ProductResponse getProduct(Long id) {
        Long requiredId = Objects.requireNonNull(id, "id must not be null");
        Product product = productRepository.findById(requiredId)
                .orElseThrow(() -> new NotFoundException("Product not found"));
        return toResponse(product);
    }

    public List<ProductResponse> getProducts(List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return List.of();
        }
        return productRepository.findAllById(ids).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private Specification<Product> buildSpecification(ProductFilterRequest request, boolean activeOnly) {
        return (root, query, cb) -> {
            List<jakarta.persistence.criteria.Predicate> predicates = new ArrayList<>();
            if (StringUtils.hasText(request.getQuery())) {
                String like = "%" + request.getQuery().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("title")), like),
                        cb.like(cb.lower(root.get("category")), like)));
            }
            if (StringUtils.hasText(request.getCategory())) {
                predicates.add(cb.equal(cb.lower(root.get("category")), request.getCategory().toLowerCase()));
            }
            if (StringUtils.hasText(request.getTypeCode())) {
                predicates.add(cb.equal(
                        cb.lower(root.join("productType").get("code")),
                        request.getTypeCode().toLowerCase()));
            }
            if (activeOnly) {
                predicates.add(cb.equal(root.get("status"), ProductStatus.ACTIVE));
            }
            BigDecimal minPrice = request.getMinPrice();
            BigDecimal maxPrice = request.getMaxPrice();
            String priceRange = request.getPriceRange();
            if (StringUtils.hasText(priceRange)) {
                switch (priceRange.trim()) {
                    case "0-200000" -> {
                        minPrice = BigDecimal.ZERO;
                        maxPrice = PRICE_200K;
                    }
                    case "200000-500000" -> {
                        minPrice = PRICE_200K;
                        maxPrice = PRICE_500K;
                    }
                    case "500000+", "500000" -> {
                        minPrice = PRICE_500K;
                        maxPrice = null;
                    }
                    default -> {
                        // Ignore unknown price range.
                    }
                }
            }
            if (minPrice != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("currentPrice"), minPrice));
            }
            if (maxPrice != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("currentPrice"), maxPrice));
            }
            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };
    }

    private ProductResponse toResponse(Product product) {
        if (product == null) {
            return null;
        }
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
