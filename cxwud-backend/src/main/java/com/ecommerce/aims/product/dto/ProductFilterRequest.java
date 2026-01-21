package com.ecommerce.aims.product.dto;

import java.math.BigDecimal;
import lombok.Data;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

@Data
public class ProductFilterRequest {
    private String query;
    private String category;
    private String typeCode;
    private String priceRange;
    private BigDecimal minPrice;
    private BigDecimal maxPrice;
//    private ProductType productType;
    @Min(0)
    private int page = 0;
    @Min(1)
    @Max(100)
    private int size = 9;
}
