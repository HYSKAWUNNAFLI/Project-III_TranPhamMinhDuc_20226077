package com.ecommerce.aims.product.models;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "products")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "type_id", nullable = false)
    private ProductType productType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    @Builder.Default
    private ProductStatus status = ProductStatus.ACTIVE;

    private String imageUrl;

    @Column(nullable = false, unique = true)
    private String barcode;
    @Column(nullable = false)
    private String title;
    @Column(nullable = false)
    private String category;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    private String conditionLabel;
    private String dominantColor;
    private String returnPolicy;

    private BigDecimal height;
    private BigDecimal width;
    private BigDecimal length;
    private BigDecimal weight;

    private BigDecimal originalValue;
    private BigDecimal currentPrice;

    @Column(nullable = false)
    private Integer stock;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    @Builder.Default
    private Map<String, Object> attributes = new HashMap<>();

    @Builder.Default
    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL)
    private List<ProductHistory> history = new ArrayList<>();
}
