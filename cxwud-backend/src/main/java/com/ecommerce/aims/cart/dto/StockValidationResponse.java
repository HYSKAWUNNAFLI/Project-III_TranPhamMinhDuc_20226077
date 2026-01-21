package com.ecommerce.aims.cart.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockValidationResponse {
    private Boolean valid;
    private List<StockValidationItem> stockItems;
}
