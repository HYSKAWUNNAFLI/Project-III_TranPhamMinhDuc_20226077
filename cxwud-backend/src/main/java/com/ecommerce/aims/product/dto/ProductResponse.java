package com.ecommerce.aims.product.dto;

import com.ecommerce.aims.product.models.ProductStatus;
import java.io.Serializable;
import java.math.BigDecimal;
import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductResponse implements Serializable {
    private Long id;
    private String typeCode;
    private ProductStatus status;
    private String imageUrl;
    private String barcode;
    private String title;
    private String category;
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
    private Integer stock;
    private Map<String, Object> attributes;

}
