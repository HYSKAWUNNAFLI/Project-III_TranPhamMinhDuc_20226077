package com.ecommerce.aims.cart.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockValidationItem {
    private Long productId;
    private Integer quantityRequested;
    private Integer quantityAvailable;
    private Boolean isEnough;
}
