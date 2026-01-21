package com.ecommerce.aims.payment.controllers;

import com.ecommerce.aims.common.dto.ApiResponse;
import com.ecommerce.aims.order.services.OrderPaymentService;
import com.ecommerce.aims.payment.models.PaymentProvider;
import com.ecommerce.aims.payment.models.PaymentStatus;
import com.ecommerce.aims.payment.models.PaymentTransaction;
import com.ecommerce.aims.payment.repository.PaymentTransactionRepository;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;

/**
 * Mock webhook controller for testing payment flows.
 * This simulates what your colleague's webhook handlers will do.
 * 
 * In production, this would be replaced by actual webhook endpoints from
 * PayPal/VietQR.
 */
@RestController
@RequestMapping("/api/webhooks/mock")
@RequiredArgsConstructor
public class MockWebhookController {

    private final PaymentTransactionRepository paymentTransactionRepository;
    private final OrderPaymentService orderPaymentService;

    /**
     * Mock webhook to simulate successful payment capture.
     * 
     * Usage:
     * POST /api/webhooks/mock/payment-captured
     * {
     * "orderId": 1,
     * "providerReference": "PAYPAL_12345"
     * }
     */
    @PostMapping("/payment-captured")
    public ApiResponse<String> mockPaymentCaptured(@RequestBody MockWebhookRequest request) {
        // Find payment transaction by orderId
        PaymentTransaction transaction = paymentTransactionRepository
                .findTopByOrderIdOrderByCreatedAtDesc(request.getOrderId())
                .orElseThrow(() -> new RuntimeException("Transaction not found for order: " + request.getOrderId()));

        // Update transaction status (Quang use these functions for ur webhook
        // controller)
        if (request.getProvider() != null) {
            transaction.setProvider(request.getProvider());
        }
        transaction.setStatus(PaymentStatus.SUCCESSFULL);
        transaction.setProviderReference(request.getProviderReference());
        transaction.setRawPayload("{\"event\": \"payment.captured\", \"orderId\": " + request.getOrderId() + "}");
        transaction.setWebhookReceivedAt(LocalDateTime.now());
        paymentTransactionRepository.save(transaction);

        // Call your OrderPaymentService to update order status
        orderPaymentService.handlePaymentCaptured(request.getOrderId());

        return ApiResponse.success("Payment captured, order status updated to PAID", "Webhook processed");
    }

    /**
     * Mock webhook to simulate payment timeout/expiry.
     * 
     * Usage:
     * POST /api/webhooks/mock/payment-timeout
     * {
     * "orderId": 1
     * }
     */
    @PostMapping("/payment-timeout")
    public ApiResponse<String> mockPaymentTimeout(@RequestBody MockWebhookRequest request) {
        // Find payment transaction by orderId
        PaymentTransaction transaction = paymentTransactionRepository
                .findTopByOrderIdOrderByCreatedAtDesc(request.getOrderId())
                .orElseThrow(() -> new RuntimeException("Transaction not found for order: " + request.getOrderId()));

        // Update transaction status (Quang use these functions for ur webhook
        // controller)
        if (request.getProvider() != null) {
            transaction.setProvider(request.getProvider());
        }
        transaction.setStatus(PaymentStatus.FAILED);
        transaction.setRawPayload("{\"event\": \"payment.expired\", \"orderId\": " + request.getOrderId() + "}");
        transaction.setWebhookReceivedAt(LocalDateTime.now());
        paymentTransactionRepository.save(transaction);

        // Call your OrderPaymentService to restore stock and cancel order
        orderPaymentService.handlePaymentTimeout(request.getOrderId());

        return ApiResponse.success("Payment timeout, stock restored and order cancelled", "Webhook processed");
    }

    /**
     * Mock webhook to simulate user cancelling payment.
     * 
     * Usage:
     * POST /api/webhooks/mock/payment-cancelled
     * {
     * "orderId": 1
     * }
     */
    @PostMapping("/payment-cancelled")
    public ApiResponse<String> mockPaymentCancelled(@RequestBody MockWebhookRequest request) {
        // Find payment transaction by orderId
        PaymentTransaction transaction = paymentTransactionRepository
                .findTopByOrderIdOrderByCreatedAtDesc(request.getOrderId())
                .orElseThrow(() -> new RuntimeException("Transaction not found for order: " + request.getOrderId()));

        // Update transaction status (Quang use these functions for ur webhook
        // controller)
        if (request.getProvider() != null) {
            transaction.setProvider(request.getProvider());
        }
        transaction.setStatus(PaymentStatus.FAILED);
        transaction.setRawPayload("{\"event\": \"payment.cancelled\", \"orderId\": " + request.getOrderId() + "}");
        transaction.setWebhookReceivedAt(LocalDateTime.now());
        paymentTransactionRepository.save(transaction);

        // Call your OrderPaymentService to restore stock and cancel order
        orderPaymentService.handleUserCancelledPayment(request.getOrderId());

        return ApiResponse.success("Payment cancelled by user, stock restored and order cancelled",
                "Webhook processed");
    }

    @Data
    public static class MockWebhookRequest {
        private Long orderId;
        private String providerReference; // Optional, only needed for capture
        private PaymentProvider provider; // PAYPAL or VIETQR - identifies which provider sent the webhook
    }
}
