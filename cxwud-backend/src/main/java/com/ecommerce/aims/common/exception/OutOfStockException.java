package com.ecommerce.aims.common.exception;

import lombok.Getter;

@Getter
public class OutOfStockException extends RuntimeException {
    private final Long productId;
    private final Integer requestedQuantity;
    private final Integer availableQuantity;

    public OutOfStockException(Long productId, Integer requestedQuantity, Integer availableQuantity) {
        super(String.format("Insufficient stock for product ID %d. Requested: %d, Available: %d", 
            productId, requestedQuantity, availableQuantity));
        this.productId = productId;
        this.requestedQuantity = requestedQuantity;
        this.availableQuantity = availableQuantity;
    }

    public OutOfStockException(String productTitle, Long productId, Integer requestedQuantity, Integer availableQuantity) {
        super(String.format("Insufficient stock for product '%s'. Requested: %d, Available: %d", 
            productTitle, requestedQuantity, availableQuantity));
        this.productId = productId;
        this.requestedQuantity = requestedQuantity;
        this.availableQuantity = availableQuantity;
    }
}
