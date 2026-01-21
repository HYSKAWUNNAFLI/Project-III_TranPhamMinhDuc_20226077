package com.ecommerce.aims.order.dto;

import com.ecommerce.aims.order.models.OrderStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class OrderSummaryResponse {
    private Long id;
    private OrderStatus status;
    private String customerName;
    private String customerEmail;
    private BigDecimal totalWithVat;
    private LocalDateTime createdAt;
}
