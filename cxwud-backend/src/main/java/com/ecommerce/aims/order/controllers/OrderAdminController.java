package com.ecommerce.aims.order.controllers;

import com.ecommerce.aims.common.dto.ApiResponse;
import com.ecommerce.aims.common.dto.PageResponse;
import com.ecommerce.aims.order.dto.OrderSummaryResponse;
import com.ecommerce.aims.order.services.OrderReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/orders")
@RequiredArgsConstructor
public class OrderAdminController {

    private final OrderReviewService orderReviewService;

    @GetMapping("/pending")
    public ApiResponse<PageResponse<OrderSummaryResponse>> listPending(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "30") int size) {
        return ApiResponse.success(orderReviewService.listPending(page, size), "Pending orders");
    }

    @PostMapping("/{id}/approve")
    public ApiResponse<OrderSummaryResponse> approve(@PathVariable Long id) {
        return ApiResponse.success(orderReviewService.approve(id), "Order approved");
    }

    @PostMapping("/{id}/reject")
    public ApiResponse<OrderSummaryResponse> reject(@PathVariable Long id,
                                                    @RequestParam(required = false) String reason) {
        return ApiResponse.success(orderReviewService.reject(id, reason), "Order rejected");
    }
}
