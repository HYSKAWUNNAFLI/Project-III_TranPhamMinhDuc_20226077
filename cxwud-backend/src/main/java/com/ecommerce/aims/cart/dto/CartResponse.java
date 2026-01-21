package com.ecommerce.aims.cart.dto;

import java.math.BigDecimal;
import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CartResponse {
    private Long cartId;
    private String sessionKey;
    private List<CartLine> items;
    private BigDecimal totalBeforeVat;
    private BigDecimal totalWithVat;

    @Data
    @Builder
    public static class CartLine {
        private Long productId;
        private String productName;
        private String imageUrl;
        private Integer quantity;
        private BigDecimal price;
        private BigDecimal totalPrice;
    }
}
