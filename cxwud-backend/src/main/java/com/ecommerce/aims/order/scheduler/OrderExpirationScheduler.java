package com.ecommerce.aims.order.scheduler;

import com.ecommerce.aims.order.models.Order;
import com.ecommerce.aims.order.models.OrderStatus;
import com.ecommerce.aims.order.repository.OrderRepository;
import com.ecommerce.aims.order.services.OrderPaymentService;
import com.ecommerce.aims.payment.models.PaymentStatus;
import com.ecommerce.aims.payment.repository.IPaymentTransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Scheduled job to automatically expire pending orders and payment
 * transactions.
 * 
 * Runs every minute to check for expired orders and handles:
 * 1. Cancelling orders past their expiration time
 * 2. Restoring stock for expired orders
 * 3. Marking payment transactions as FAILED
 * 4. Resetting cart checkout flags for retry
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class OrderExpirationScheduler {

    private final OrderRepository orderRepository;
    private final IPaymentTransactionRepository paymentTransactionRepository;
    private final OrderPaymentService orderPaymentService;

    @jakarta.annotation.PostConstruct
    public void init() {
        log.info("OrderExpirationScheduler initialized and ready to run");
    }

    /**
     * Runs every minute (60 seconds)
     * Cron: second minute hour day month weekday
     */
    @Scheduled(cron = "0 * * * * *") // Every minute at 0 seconds
    @Transactional
    public void expireOrders() {
        log.debug("OrderExpirationScheduler.expireOrders() triggered at {}", LocalDateTime.now());
        LocalDateTime now = LocalDateTime.now();

        // Find all pending orders that have expired
        List<Order> expiredOrders = orderRepository.findByStatusAndExpiresAtBefore(
                OrderStatus.PENDING_PROCESSING,
                now);

        log.debug("Found {} expired orders (status=PENDING_PROCESSING, expiresAt before {})", 
                  expiredOrders.size(), now);

        if (expiredOrders.isEmpty()) {
            return; // No expired orders to process
        }

        log.info("Found {} expired orders to process", expiredOrders.size());

        for (Order order : expiredOrders) {
            try {
                log.info("Expiring order ID: {} (expired at: {})", order.getId(), order.getExpiresAt());

                // Use the existing OrderPaymentService.handlePaymentTimeout() logic
                // This will:
                // 1. Cancel the order
                // 2. Restore stock
                // 3. Reset cart checkout flag
                orderPaymentService.handlePaymentTimeout(order.getId());

                // Mark payment transaction as FAILED if not already updated
                paymentTransactionRepository.findTopByOrderIdOrderByCreatedAtDesc(order.getId()).ifPresent(transaction -> {
                    if (transaction.getStatus() == PaymentStatus.PENDING) {
                        transaction.setStatus(PaymentStatus.FAILED);
                        paymentTransactionRepository.save(transaction);
                        log.info("Payment transaction {} marked as FAILED for expired order {}",
                                transaction.getId(), order.getId());
                    }
                });

            } catch (Exception e) {
                log.error("Error expiring order ID: {}", order.getId(), e);
                // Continue processing other orders even if one fails
            }
        }

        log.info("Completed expiring {} orders", expiredOrders.size());
    }

    /**
     * Optional: Clean up old cancelled orders (e.g., after 30 days)
     * Runs daily at 2 AM
     */
    @Scheduled(cron = "0 0 2 * * *")
    @Transactional
    public void cleanupOldOrders() {
        LocalDateTime threshold = LocalDateTime.now().minusDays(30);

        List<Order> oldCancelledOrders = orderRepository.findByStatusAndUpdatedAtBefore(
                OrderStatus.CANCELLED,
                threshold);
        List<Order> oldFailedOrders = orderRepository.findByStatusAndUpdatedAtBefore(
                OrderStatus.FAILED,
                threshold);
        int totalOldOrders = oldCancelledOrders.size() + oldFailedOrders.size();

        if (totalOldOrders > 0) {
            log.info("Found {} old failed/cancelled orders to clean up", totalOldOrders);
            // Option 1: Archive to separate table (recommended)
            // Option 2: Delete (use with caution)
            // orderRepository.deleteAll(oldCancelledOrders);
            log.info("Cleanup of old orders completed");
        }
    }
}
