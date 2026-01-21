package com.ecommerce.aims.payment.services;

import com.ecommerce.aims.common.exception.NotFoundException;
import com.ecommerce.aims.notification.models.NotificationEventType;
import com.ecommerce.aims.notification.services.NotificationOutboxService;
import com.ecommerce.aims.order.models.Order;
import com.ecommerce.aims.order.repository.OrderRepository;
import com.ecommerce.aims.payment.dto.CreatePaymentRequest;
import com.ecommerce.aims.payment.dto.PaymentResultResponse;
import com.ecommerce.aims.payment.models.PaymentProvider;
import com.ecommerce.aims.payment.models.PaymentStatus;
import com.ecommerce.aims.payment.models.PaymentTransaction;
import com.ecommerce.aims.payment.repository.IPaymentTransactionRepository;
import java.math.BigDecimal;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.ecommerce.aims.order.services.OrderPaymentService;

@Service
@RequiredArgsConstructor
public class PaymentService {

    // SOLID: This service coordinates transaction creation, provider dispatch, and
    // order state updates.
    // Consider splitting orchestration vs. order updates if/when refactoring.
    private final IPaymentTransactionRepository IPaymentTransactionRepository;
    private final PayPalService payPalService;
    private final VietQRService vietQRService;
    private final OrderRepository orderRepository;
    private final NotificationOutboxService notificationOutboxService;
    private final OrderPaymentService orderPaymentService;

    @Transactional(noRollbackFor = com.ecommerce.aims.common.exception.BusinessException.class)
    public PaymentResultResponse createPayment(CreatePaymentRequest request) {
        Objects.requireNonNull(request, "request must not be null");
        Long orderId = Objects.requireNonNull(request.getOrderId(), "orderId must not be null");
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order not found"));
        BigDecimal totalBeforeVat = order.getTotalBeforeVat() != null ? order.getTotalBeforeVat() : BigDecimal.ZERO;
        BigDecimal shippingFee = order.getShippingFee() != null ? order.getShippingFee() : BigDecimal.ZERO;
        BigDecimal vatAmount = totalBeforeVat.multiply(new BigDecimal("0.10"));
        BigDecimal totalWithVat = order.getTotalWithVat();
        if (totalWithVat == null) {
            totalWithVat = totalBeforeVat.add(vatAmount).add(shippingFee);
            order.setTotalWithVat(totalWithVat);
            orderRepository.save(order);
        }
        if (request.getProvider() == PaymentProvider.VIETQR || request.getAmount() == null) {
            request.setAmount(totalWithVat);
        }

        // Check for existing active payment transaction to reuse
        PaymentTransaction existingTransaction = IPaymentTransactionRepository
                .findTopByOrderIdOrderByCreatedAtDesc(orderId)
                .orElse(null);

        // Reuse existing transaction if:
        // 1. It exists
        // 2. It's in INIT status (not failed/captured)
        // 3. The amount matches (order total hasn't changed)
        if (existingTransaction != null
                && existingTransaction.getStatus() == PaymentStatus.PENDING
                && existingTransaction.getAmount() != null
                && existingTransaction.getAmount().compareTo(request.getAmount()) == 0
                && existingTransaction.getProvider() == request.getProvider()) {

            // Return existing payment result
            return PaymentResultResponse.builder()
                    .transactionId(existingTransaction.getId())
                    .status(existingTransaction.getStatus())
                    .qrContent(existingTransaction.getQrContent())
                    .providerReference(existingTransaction.getProviderReference())
                    .build();
        }

        // Create new transaction with timestamp-based ID
        Long transactionId = System.currentTimeMillis() / 1000;
        PaymentTransaction transaction = Objects.requireNonNull(PaymentTransaction.builder()
                .id(transactionId)
                .orderId(orderId)
                .provider(request.getProvider())
                .status(PaymentStatus.PENDING)
                .amount(request.getAmount())
                .currency(request.getCurrency())
                .providerReference(UUID.randomUUID().toString())
                .build());
        PaymentTransaction saved = IPaymentTransactionRepository.save(transaction);

        PaymentResultResponse response;
        try {
            // SOLID: Provider branching here means adding a new provider requires editing
            // this method (OCP).
            if (request.getProvider() == PaymentProvider.PAYPAL) {
                response = payPalService.initiatePayment(saved, request);
            } else if (request.getProvider() == PaymentProvider.VIETQR) {
                response = vietQRService.generateQr(saved, request);
            } else {
                response = PaymentResultResponse.builder()
                        .transactionId(saved.getId())
                        .status(saved.getStatus())
                        .providerReference(saved.getProviderReference())
                        .build();
            }
        } catch (Exception e) {
            // Update status to FAILED and persist before re-throwing
            saved.setStatus(PaymentStatus.FAILED);
            IPaymentTransactionRepository.save(saved);
            throw e;
        }

        IPaymentTransactionRepository.save(saved);
        return response;
    }

    @Transactional
    public PaymentResultResponse markCaptured(Long transactionId, String providerReference) {
        Long id = Objects.requireNonNull(transactionId, "transactionId must not be null");

        PaymentTransaction transaction = IPaymentTransactionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Transaction not found"));

        if (providerReference != null) {
            transaction.setProviderReference(providerReference);
            transaction.setCaptureId(providerReference);
        }

        // Update webhook timestamp
        transaction.setWebhookReceivedAt(java.time.LocalDateTime.now());

        PaymentResultResponse response;
        if (transaction.getProvider() == PaymentProvider.PAYPAL) {
            response = payPalService.capture(transaction.getProviderReference(), transaction);
        } else {
            transaction.setStatus(PaymentStatus.SUCCESSFULL);
            response = PaymentResultResponse.builder()
                    .transactionId(transaction.getId())
                    .status(transaction.getStatus())
                    .providerReference(transaction.getProviderReference())
                    .build();
        }
        IPaymentTransactionRepository.save(transaction);

        // Use OrderPaymentService for robust order handling (stock, cart, etc.)
        orderPaymentService.handlePaymentCaptured(transaction.getOrderId());

        return response;
    }

    @Transactional
    public void capturePayPalOrder(Long orderId, String providerReference, String captureId) {
        if (orderId == null) {
            return;
        }
        PaymentTransaction transaction = IPaymentTransactionRepository.findTopByOrderIdOrderByCreatedAtDesc(orderId)
                .orElse(null);

        if (transaction != null && transaction.getStatus() != PaymentStatus.SUCCESSFULL) {
            if (providerReference != null) {
                transaction.setProviderReference(providerReference);
            }
            if (captureId != null) {
                transaction.setCaptureId(captureId);
            }

            // Update webhook timestamp
            transaction.setWebhookReceivedAt(java.time.LocalDateTime.now());
            transaction.setStatus(PaymentStatus.SUCCESSFULL);
            IPaymentTransactionRepository.save(transaction);

            // Use OrderPaymentService for robust order handling
            orderPaymentService.handlePaymentCaptured(orderId);

            notificationOutboxService.enqueue(
                    NotificationEventType.ORDER_PAYMENT_SUCCESS,
                    Map.of("orderId", orderId, "transactionId", transaction.getId()),
                    "order-payment-success:" + orderId + ":" + transaction.getId());
        }
    }

    @Transactional
    public PaymentResultResponse cancelTransaction(Long transactionId, String reason) {
        PaymentTransaction transaction = IPaymentTransactionRepository.findById(transactionId)
                .orElseThrow(() -> new NotFoundException("Transaction not found"));

        if (transaction.getStatus() == PaymentStatus.SUCCESSFULL) {
            throw new com.ecommerce.aims.common.exception.BusinessException("Cannot cancel captured transaction");
        }

        if (transaction.getProvider() == PaymentProvider.VIETQR) {
            try {
                // Cancel on PayOS
                vietQRService.cancelPaymentLink(transaction.getId(), reason != null ? reason : "User cancelled");
            } catch (Exception e) {
                System.err.println("Failed to cancel PayOS link: " + e.getMessage());
                // Continue to cancel local transaction even if PayOS fails (link might strictly
                // expire)
            }
        }

        transaction.setStatus(PaymentStatus.FAILED);

        IPaymentTransactionRepository.save(transaction);

        return PaymentResultResponse.builder()
                .transactionId(transaction.getId())
                .status(transaction.getStatus())
                .build();
    }
}
