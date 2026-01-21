package com.ecommerce.aims.notification.controllers;

import com.ecommerce.aims.common.dto.ApiResponse;
import com.ecommerce.aims.notification.dto.SendEmailRequest;
import com.ecommerce.aims.notification.dto.SendOrderPaymentEmailRequest;
import com.ecommerce.aims.notification.dto.SubscriptionRequest;
import com.ecommerce.aims.notification.models.EmailTemplateType;
import com.ecommerce.aims.notification.models.NotificationEventType;
import com.ecommerce.aims.notification.services.NotificationOutboxService;
import jakarta.validation.Valid;
import java.util.HashMap;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationOutboxService notificationOutboxService;

    @PostMapping("/email")
    public ApiResponse<Void> sendEmail(@Valid @RequestBody SendEmailRequest request) {
        EmailTemplateType templateType = request.getTemplateType() != null
                ? request.getTemplateType()
                : EmailTemplateType.ORDER_CONFIRMATION;
        notificationOutboxService.enqueue(
                NotificationEventType.RAW_EMAIL,
                Map.of(
                        "to", request.getTo(),
                        "subject", request.getSubject(),
                        "body", request.getBody(),
                        "templateType", templateType.name()));
        return ApiResponse.success(null, "Email queued");
    }

    @PostMapping("/order-payment-email")
    public ApiResponse<Void> sendOrderPaymentEmail(@Valid @RequestBody SendOrderPaymentEmailRequest request) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("orderId", request.getOrderId());
        payload.put("transactionId", request.getTransactionId());
        String idempotencyKey = request.getOrderId() != null
                ? "order-payment-success:" + request.getOrderId() + ":" + request.getTransactionId()
                : null;
        notificationOutboxService.enqueue(NotificationEventType.ORDER_PAYMENT_SUCCESS, payload, idempotencyKey);
        return ApiResponse.success(null, "Email queued");
    }

    @PostMapping({ "/test-email", "/test-emai" })
    public ApiResponse<Void> sendTestEmail(@Valid @RequestBody SendOrderPaymentEmailRequest request) {
        notificationOutboxService.enqueue(NotificationEventType.ORDER_CONFIRMATION_REQUESTED, request);
        return ApiResponse.success(null, "Email queued");
    }

    @PostMapping("/test/user-created")
    public ApiResponse<Void> testUserCreated(@RequestBody java.util.Map<String, String> request) {
        String email = request.getOrDefault("email", "ductranphamminh4924@gmail.com");
        String password = request.getOrDefault("temporaryPassword", "tempPass123");
        notificationOutboxService.enqueue(
                NotificationEventType.USER_CREATED_BY_ADMIN,
                Map.of("email", email, "temporaryPassword", password));
        return ApiResponse.success(null, "Test email USER_CREATED queued to " + email);
    }

    @PostMapping("/test/user-updated")
    public ApiResponse<Void> testUserUpdated(@RequestBody java.util.Map<String, String> request) {
        String email = request.getOrDefault("email", "ductranphamminh4924@gmail.com");
        notificationOutboxService.enqueue(
                NotificationEventType.USER_UPDATED_BY_ADMIN,
                Map.of("email", email));
        return ApiResponse.success(null, "Test email USER_UPDATED queued to " + email);
    }

    @PostMapping("/test/user-deleted")
    public ApiResponse<Void> testUserDeleted(@RequestBody java.util.Map<String, String> request) {
        String email = request.getOrDefault("email", "ductranphamminh4924@gmail.com");
        notificationOutboxService.enqueue(
                NotificationEventType.USER_DELETED_BY_ADMIN,
                Map.of("email", email));
        return ApiResponse.success(null, "Test email USER_DELETED queued to " + email);
    }

    @PostMapping("/test/user-locked")
    public ApiResponse<Void> testUserLocked(@RequestBody java.util.Map<String, String> request) {
        String email = request.getOrDefault("email", "ductranphamminh4924@gmail.com");
        notificationOutboxService.enqueue(
                NotificationEventType.USER_LOCKED_BY_ADMIN,
                Map.of("email", email));
        return ApiResponse.success(null, "Test email USER_LOCKED queued to " + email);
    }

    @PostMapping("/test/user-unlocked")
    public ApiResponse<Void> testUserUnlocked(@RequestBody java.util.Map<String, String> request) {
        String email = request.getOrDefault("email", "ductranphamminh4924@gmail.com");
        notificationOutboxService.enqueue(
                NotificationEventType.USER_UNLOCKED_BY_ADMIN,
                Map.of("email", email));
        return ApiResponse.success(null, "Test email USER_UNLOCKED queued to " + email);
    }

    @PostMapping("/test/password-reset")
    public ApiResponse<Void> testPasswordReset(@RequestBody java.util.Map<String, String> request) {
        String email = request.getOrDefault("email", "ductranphamminh4924@gmail.com");
        String token = request.getOrDefault("token", "test-token-123");
        notificationOutboxService.enqueue(
                NotificationEventType.ADMIN_PASSWORD_RESET,
                Map.of("email", email, "token", token));
        return ApiResponse.success(null, "Test email PASSWORD_RESET queued to " + email);
    }

    @PostMapping("/subscription-thank-you")
    public ApiResponse<Void> sendSubscriptionThankYouEmail(@Valid @RequestBody SubscriptionRequest request) {
        notificationOutboxService.enqueue(
                NotificationEventType.SUBSCRIPTION_THANK_YOU,
                Map.of("email", request.getEmail()));
        return ApiResponse.success(null, "Subscription thank you email queued to " + request.getEmail());
    }
}
