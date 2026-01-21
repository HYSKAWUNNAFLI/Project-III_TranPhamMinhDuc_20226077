package com.ecommerce.aims.order.controllers;

import com.ecommerce.aims.common.dto.ApiResponse;
import com.ecommerce.aims.order.dto.CalculateShippingFeeRequest;
import com.ecommerce.aims.order.dto.CheckOrderStateRequest;
import com.ecommerce.aims.order.dto.CheckOrderStateResponse;
import com.ecommerce.aims.order.dto.CreateOrderRequest;
import com.ecommerce.aims.order.dto.OrderResponse;
import com.ecommerce.aims.order.dto.UpdateDeliveryInfoRequest;
import com.ecommerce.aims.order.services.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    public ApiResponse<OrderResponse> createOrder(@Valid @RequestBody CreateOrderRequest request) {
        return ApiResponse.success(orderService.createOrder(request), "Order created");
    }

    @GetMapping("/{id}")
    public ApiResponse<OrderResponse> getOrder(@PathVariable Long id) {
        return ApiResponse.success(orderService.getOrder(id), "Order detail");
    }

    @PostMapping("/{id}/cancel")
    public ApiResponse<OrderResponse> cancel(@PathVariable Long id) {
        return ApiResponse.success(orderService.cancelOrder(id), "Order cancelled");
    }

    @PostMapping("/check-order-state")
    public ApiResponse<CheckOrderStateResponse> checkOrderState(@Valid @RequestBody CheckOrderStateRequest request) {
        return ApiResponse.success(orderService.checkOrderState(request), "Order state checked");
    }

    @PutMapping("/{id}/delivery-info")
    public ApiResponse<OrderResponse> updateDeliveryInfo(
            @PathVariable Long id,
            @Valid @RequestBody UpdateDeliveryInfoRequest request) {
        return ApiResponse.success(orderService.updateDeliveryInfo(id, request), "Delivery info updated");
    }

    @PostMapping("/shipping-fee")
    public ApiResponse<java.math.BigDecimal> calculateShippingFee(
            @Valid @RequestBody CalculateShippingFeeRequest request) {
        return ApiResponse.success(orderService.calculateShippingFeeFromRequest(request), "Shipping fee calculated");
    }
}
