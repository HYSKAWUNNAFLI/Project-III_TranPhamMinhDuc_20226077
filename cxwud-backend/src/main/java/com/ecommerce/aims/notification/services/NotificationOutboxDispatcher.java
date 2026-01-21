package com.ecommerce.aims.notification.services;

import com.ecommerce.aims.notification.dto.SendOrderPaymentEmailRequest;
import com.ecommerce.aims.notification.models.EmailTemplateType;
import com.ecommerce.aims.notification.models.NotificationEventType;
import com.ecommerce.aims.notification.models.NotificationOutbox;
import com.ecommerce.aims.notification.models.NotificationOutboxStatus;
import com.ecommerce.aims.notification.repository.NotificationOutboxRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class NotificationOutboxDispatcher {

    private final NotificationOutboxRepository outboxRepository;
    private final EmailNotificationService emailNotificationService;
    private final ObjectMapper objectMapper;

    @Value("${app.notification.outbox.batch-size:50}")
    private int batchSize;

    @Value("${app.notification.outbox.retry-minutes:5}")
    private long retryMinutes;

    @Value("${app.notification.outbox.max-attempts:5}")
    private int maxAttempts;

    @Scheduled(fixedDelayString = "${app.notification.outbox.poll-ms:5000}")
    @Transactional
    public void dispatchPending() {
        List<NotificationOutbox> batch = outboxRepository.lockNextBatch(batchSize);
        for (NotificationOutbox item : batch) {
            processItem(item);
        }
    }

    private void processItem(NotificationOutbox item) {
        Objects.requireNonNull(item, "item must not be null");
        if (item.getAttempts() >= maxAttempts) {
            item.setStatus(NotificationOutboxStatus.FAILED);
            item.setNextRetryAt(null);
            if (item.getErrorMessage() == null) {
                item.setErrorMessage("Max attempts reached");
            }
            return;
        }
        try {
            handle(item);
            item.setStatus(NotificationOutboxStatus.SENT);
            item.setProcessedAt(LocalDateTime.now());
            item.setErrorMessage(null);
            item.setNextRetryAt(null);
        } catch (Exception ex) {
            item.setAttempts(item.getAttempts() + 1);
            item.setStatus(NotificationOutboxStatus.FAILED);
            item.setErrorMessage(truncate(ex.getMessage(), 1000));
            item.setNextRetryAt(LocalDateTime.now().plusMinutes(retryMinutes));
        }
    }

    private void handle(NotificationOutbox item) {
        Map<String, Object> payload = item.getPayload() != null ? item.getPayload() : Map.of();
        NotificationEventType eventType = item.getEventType();
        if (eventType == null) {
            throw new IllegalArgumentException("Missing event type");
        }
        switch (eventType) {
            case RAW_EMAIL -> handleRawEmail(payload);
            case ORDER_PAYMENT_SUCCESS -> handleOrderPaymentSuccess(payload);
            case ORDER_CONFIRMATION_REQUESTED -> handleOrderConfirmation(payload);
            case PASSWORD_RESET -> handlePasswordReset(payload);
            case ADMIN_PASSWORD_RESET -> handleAdminPasswordReset(payload);
            case USER_CREATED_BY_ADMIN -> handleUserCreated(payload);
            case USER_UPDATED_BY_ADMIN -> handleUserUpdated(payload);
            case USER_DELETED_BY_ADMIN -> handleUserDeleted(payload);
            case USER_LOCKED_BY_ADMIN -> handleUserLocked(payload);
            case USER_UNLOCKED_BY_ADMIN -> handleUserUnlocked(payload);
            case SUBSCRIPTION_THANK_YOU -> handleSubscriptionThankYou(payload);
            default -> throw new IllegalArgumentException("Unsupported event type: " + eventType);
        }
    }

    private void handleRawEmail(Map<String, Object> payload) {
        String to = readString(payload, "to");
        String subject = readString(payload, "subject");
        String body = readString(payload, "body");
        String templateTypeValue = readString(payload, "templateType");
        EmailTemplateType templateType = templateTypeValue != null
                ? EmailTemplateType.valueOf(templateTypeValue)
                : EmailTemplateType.ORDER_CONFIRMATION;
        emailNotificationService.sendEmail(to, subject, body, templateType);
    }

    private void handleOrderPaymentSuccess(Map<String, Object> payload) {
        Long orderId = readLong(payload, "orderId");
        Long transactionId = readLong(payload, "transactionId");
        emailNotificationService.sendEmail(orderId, transactionId);
    }

    private void handleOrderConfirmation(Map<String, Object> payload) {
        SendOrderPaymentEmailRequest request = objectMapper.convertValue(payload, SendOrderPaymentEmailRequest.class);
        emailNotificationService.sendOrderConfirmationEmail(request);
    }

    private void handlePasswordReset(Map<String, Object> payload) {
        emailNotificationService.sendPasswordResetEmail(readString(payload, "email"), readString(payload, "token"));
    }

    private void handleAdminPasswordReset(Map<String, Object> payload) {
        emailNotificationService.sendAdminPasswordResetEmail(readString(payload, "email"), readString(payload, "token"));
    }

    private void handleUserCreated(Map<String, Object> payload) {
        emailNotificationService.sendUserCreatedByAdminEmail(
                readString(payload, "email"),
                readString(payload, "temporaryPassword"));
    }

    private void handleUserUpdated(Map<String, Object> payload) {
        emailNotificationService.sendUserUpdatedByAdminEmail(readString(payload, "email"));
    }

    private void handleUserDeleted(Map<String, Object> payload) {
        emailNotificationService.sendUserDeletedByAdminEmail(readString(payload, "email"));
    }

    private void handleUserLocked(Map<String, Object> payload) {
        emailNotificationService.sendUserLockedByAdminEmail(readString(payload, "email"));
    }

    private void handleUserUnlocked(Map<String, Object> payload) {
        emailNotificationService.sendUserUnlockedByAdminEmail(readString(payload, "email"));
    }

    private void handleSubscriptionThankYou(Map<String, Object> payload) {
        emailNotificationService.sendSubscriptionThankYouEmail(readString(payload, "email"));
    }

    private String readString(Map<String, Object> payload, String key) {
        Object value = payload.get(key);
        if (value == null) {
            return null;
        }
        String text = value.toString();
        return text.isBlank() ? null : text;
    }

    private Long readLong(Map<String, Object> payload, String key) {
        Object value = payload.get(key);
        if (value == null) {
            return null;
        }
        if (value instanceof Number number) {
            return number.longValue();
        }
        String text = value.toString();
        if (text.isBlank()) {
            return null;
        }
        return Long.parseLong(text);
    }

    private String truncate(String value, int maxLength) {
        if (value == null) {
            return null;
        }
        if (value.length() <= maxLength) {
            return value;
        }
        return value.substring(0, maxLength);
    }
}
