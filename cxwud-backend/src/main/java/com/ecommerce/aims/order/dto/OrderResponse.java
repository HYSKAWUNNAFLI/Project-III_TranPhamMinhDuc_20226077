package com.ecommerce.aims.order.dto;

import com.ecommerce.aims.order.models.DeliveryInfo;
import com.ecommerce.aims.order.models.OrderStatus;
import com.ecommerce.aims.payment.models.PaymentStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class OrderResponse {
    private Long id;
    private OrderStatus status;
    private String customerEmail;
    private String customerName;
    private DeliveryInfo deliveryInfo;
    private BigDecimal shippingFee;
    private BigDecimal totalBeforeVat;
    private BigDecimal totalWithVat;
    private LocalDateTime createdAt;
    private Integer paymentMinutes;
    private List<OrderLine> items;
    private com.ecommerce.aims.payment.dto.PaymentResultResponse paymentResult;
    private Long paymentTransactionId;
    private PaymentStatus paymentStatus;

    @Data
    @Builder
    public static class OrderLine {
        private Long productId;
        private String productTitle;
        private Integer quantity;
        private BigDecimal price;
        private BigDecimal totalPrice;
    }
}
