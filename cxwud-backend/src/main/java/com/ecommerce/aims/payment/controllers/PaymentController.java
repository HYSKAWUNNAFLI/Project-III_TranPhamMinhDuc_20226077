package com.ecommerce.aims.payment.controllers;

import com.ecommerce.aims.common.dto.ApiResponse;
import com.ecommerce.aims.payment.dto.CreatePaymentRequest;
import com.ecommerce.aims.payment.dto.PaymentResultResponse;
import com.ecommerce.aims.payment.services.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping
    public ApiResponse<PaymentResultResponse> createPayment(@Valid @RequestBody CreatePaymentRequest request) {
        System.out.println(">>> CREATE PAYMENT REQUEST: " + request);
        return ApiResponse.success(paymentService.createPayment(request), "Payment initiated");
    }

    @PostMapping("/{id}/capture")
    public ApiResponse<PaymentResultResponse> capture(@PathVariable Long id,
            @RequestParam(required = false) String providerReference) {
        return ApiResponse.success(paymentService.markCaptured(id, providerReference), "Payment captured");
    }

    @PostMapping("/{id}/cancel")
    public ApiResponse<PaymentResultResponse> cancel(@PathVariable Long id,
            @RequestBody(required = false) java.util.Map<String, String> body) {
        String reason = body != null ? body.get("reason") : null;
        return ApiResponse.success(paymentService.cancelTransaction(id, reason), "Transaction cancelled");
    }
}
