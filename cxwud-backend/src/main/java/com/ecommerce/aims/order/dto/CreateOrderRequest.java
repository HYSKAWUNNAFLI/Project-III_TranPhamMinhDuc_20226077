package com.ecommerce.aims.order.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.math.BigDecimal;
import java.util.List;
import lombok.Data;
import io.swagger.v3.oas.annotations.media.Schema;

@Data
public class CreateOrderRequest {
    @Schema(example = "customer@example.com")
    @Email
    @NotBlank
    private String customerEmail;
    @Schema(example = "Nguyen Van A")
    @NotBlank
    private String customerName;
    @Schema(example = "0901234567")
    @NotBlank
    private String phone;
    @Schema(example = "123 Street")
    @NotBlank
    private String addressLine;
    @Schema(example = "Ha Noi")
    @NotBlank
    private String province;
    @Schema(example = "100000")
    @NotBlank
    private String cartSessionKey;
    @Schema(example = "25000")
    private BigDecimal shippingFee;

    @Schema(example = "PAYPAL")
    private com.ecommerce.aims.payment.models.PaymentProvider provider;
    @Schema(example = "USD")
    @NotBlank
    private String currency;
    @Schema(example = "http://localhost:3000/success")
    @NotBlank
    private String successReturnUrl;
    @Schema(example = "http://localhost:3000/cancel")
    @NotBlank
    private String cancelReturnUrl;

    @NotEmpty
    @Valid
    private List<OrderItemRequest> items;

    @Data
    public static class OrderItemRequest {
        @Schema(example = "1")
        private Long productId;
        private String productTitle;
        @Schema(example = "2")
        @Min(1)
        private Integer quantity;
        @Schema(example = "120000")
        @Min(0)
        private BigDecimal price;
    }
}
