package com.ecommerce.aims.product.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class StockAdjustmentRequest {
    @NotNull(message = "Quantity change is required")
    private Integer quantityChange;
    
    @NotBlank(message = "Reason is required")
    private String reason;
}
