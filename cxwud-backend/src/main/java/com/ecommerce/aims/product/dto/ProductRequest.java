package com.ecommerce.aims.product.dto;

import com.ecommerce.aims.product.models.ProductStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import java.math.BigDecimal;
import java.util.Map;
import lombok.Data;

@Data
public class ProductRequest {
    @NotBlank
    private String typeCode;
    private ProductStatus status;
    @NotBlank
    private String barcode;
    private String imageUrl;
    @NotBlank
    private String title;
    @NotBlank
    private String category;
    private String description;
    private String conditionLabel;
    private String dominantColor;
    private String returnPolicy;

    @PositiveOrZero
    private BigDecimal height;
    @PositiveOrZero
    private BigDecimal width;
    @PositiveOrZero
    private BigDecimal length;
    @PositiveOrZero
    private BigDecimal weight;

    @DecimalMin(value = "0.0", inclusive = false)
    private BigDecimal originalValue;
    @DecimalMin(value = "0.0", inclusive = false)
    private BigDecimal currentPrice;
    @NotNull
    @PositiveOrZero
    private Integer stock;

    private Map<String, Object> attributes;
}
