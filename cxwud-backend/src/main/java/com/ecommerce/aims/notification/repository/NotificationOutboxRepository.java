package com.ecommerce.aims.notification.repository;

import com.ecommerce.aims.notification.models.NotificationOutbox;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface NotificationOutboxRepository extends JpaRepository<NotificationOutbox, Long> {
    boolean existsByIdempotencyKey(String idempotencyKey);

    @Query(value = """
        SELECT * FROM notification_outbox
        WHERE status IN ('PENDING', 'FAILED')
          AND (next_retry_at IS NULL OR next_retry_at <= NOW())
        ORDER BY created_at
        LIMIT :limit
        FOR UPDATE SKIP LOCKED
        """, nativeQuery = true)
    List<NotificationOutbox> lockNextBatch(@Param("limit") int limit);
}
