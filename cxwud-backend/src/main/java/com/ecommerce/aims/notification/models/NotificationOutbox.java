package com.ecommerce.aims.notification.models;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "notification_outbox")
@Getter
@Setter
public class NotificationOutbox {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false, length = 100)
    private NotificationEventType eventType;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    private Map<String, Object> payload = new HashMap<>();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private NotificationOutboxStatus status = NotificationOutboxStatus.PENDING;

    @Column(nullable = false)
    private int attempts;

    private LocalDateTime nextRetryAt;

    @Column(length = 120)
    private String idempotencyKey;

    @Column(columnDefinition = "TEXT")
    private String errorMessage;

    private LocalDateTime createdAt;

    private LocalDateTime processedAt;

    @PrePersist
    private void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (status == null) {
            status = NotificationOutboxStatus.PENDING;
        }
    }
}
