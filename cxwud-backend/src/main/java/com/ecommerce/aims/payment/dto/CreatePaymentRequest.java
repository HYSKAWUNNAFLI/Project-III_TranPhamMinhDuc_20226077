package com.ecommerce.aims.payment.dto;

import com.ecommerce.aims.payment.models.PaymentProvider;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;
import lombok.Data;

@Data
public class CreatePaymentRequest {
    private Long orderId;
    private PaymentProvider provider;
    @DecimalMin(value = "0.1")
    private BigDecimal amount;
    @NotBlank
    private String currency;
    @NotBlank
    private String successReturnUrl;
    @NotBlank
    private String cancelReturnUrl;
}
