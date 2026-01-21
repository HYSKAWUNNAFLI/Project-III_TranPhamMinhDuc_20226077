package com.ecommerce.aims.notification.services;

import com.ecommerce.aims.notification.models.NotificationEventType;
import com.ecommerce.aims.notification.models.NotificationOutbox;
import com.ecommerce.aims.notification.models.NotificationOutboxStatus;
import com.ecommerce.aims.notification.repository.NotificationOutboxRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class NotificationOutboxService {

    private final NotificationOutboxRepository outboxRepository;
    private final ObjectMapper objectMapper;

    @Transactional
    public void enqueue(NotificationEventType eventType, Object payload) {
        enqueue(eventType, payload, null);
    }

    @Transactional
    public void enqueue(NotificationEventType eventType, Object payload, String idempotencyKey) {
        Objects.requireNonNull(eventType, "eventType must not be null");
        String normalizedKey = StringUtils.hasText(idempotencyKey) ? idempotencyKey.trim() : null;
        if (normalizedKey != null && outboxRepository.existsByIdempotencyKey(normalizedKey)) {
            return;
        }
        NotificationOutbox outbox = new NotificationOutbox();
        outbox.setEventType(eventType);
        outbox.setPayload(toPayloadMap(payload));
        outbox.setStatus(NotificationOutboxStatus.PENDING);
        outbox.setAttempts(0);
        outbox.setIdempotencyKey(normalizedKey);
        outbox.setCreatedAt(LocalDateTime.now());
        outboxRepository.save(outbox);
    }

    private Map<String, Object> toPayloadMap(Object payload) {
        if (payload == null) {
            return new HashMap<>();
        }
        if (payload instanceof Map<?, ?> map) {
            Map<String, Object> result = new HashMap<>();
            for (Map.Entry<?, ?> entry : map.entrySet()) {
                if (entry.getKey() != null) {
                    result.put(entry.getKey().toString(), entry.getValue());
                }
            }
            return result;
        }
        return objectMapper.convertValue(payload, new TypeReference<Map<String, Object>>() {});
    }
}
