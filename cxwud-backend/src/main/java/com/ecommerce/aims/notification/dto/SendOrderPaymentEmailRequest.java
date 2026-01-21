package com.ecommerce.aims.notification.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;
import lombok.Data;

@Data
public class SendOrderPaymentEmailRequest {
    @Schema(example = "1")
    private Long orderId;

    @Schema(example = "10")
    private Long transactionId;

    @Schema(example = "Nguyen Van A")
    private String customerName;

    @Schema(example = "0901234567")
    private String customerPhone;

    @Schema(example = "123 Street")
    private String shippingAddress;

    @Schema(example = "Ha Noi")
    private String provinceCity;

    @Schema(example = "150000")
    private BigDecimal totalAmount;

    @Schema(example = "Thanh toan don hang")
    private String transactionContent;

    @Schema(example = "2025-01-15 08:30:00")
    private String transactionTime;

    @Schema(example = "customer@example.com")
    private String recipientEmail;
}
