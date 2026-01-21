package com.ecommerce.aims.order.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CheckOrderStateResponse {
    private OrderAction action;
    private Long orderId;
    private String message;

    public enum OrderAction {
        CREATE_NEW, // Cart changed or no existing order
        REUSE // Cart unchanged, reuse existing order
    }
}
