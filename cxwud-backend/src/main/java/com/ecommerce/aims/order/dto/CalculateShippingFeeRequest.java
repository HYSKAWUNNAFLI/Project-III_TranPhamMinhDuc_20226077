package com.ecommerce.aims.order.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CalculateShippingFeeRequest {
    @NotBlank(message = "Province is required")
    private String province;

    private String address;
    private BigDecimal cartValue;
    private String cartSessionKey;
}
