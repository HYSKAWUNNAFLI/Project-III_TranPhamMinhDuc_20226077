package com.ecommerce.aims.payment.services;

import com.ecommerce.aims.notification.models.NotificationEventType;
import com.ecommerce.aims.notification.services.NotificationOutboxService;
import com.ecommerce.aims.payment.dto.CreatePaymentRequest;
import com.ecommerce.aims.payment.dto.PaymentResultResponse;
import com.ecommerce.aims.payment.models.PaymentStatus;
import com.ecommerce.aims.payment.models.PaymentTransaction;
import java.math.RoundingMode;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkRequest;
import java.util.concurrent.ThreadLocalRandom;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkResponse;
import vn.payos.model.v2.paymentRequests.PaymentLink;
import vn.payos.model.v2.paymentRequests.PaymentLinkStatus;

@Service
@RequiredArgsConstructor
public class VietQRService {

    private final VietQRClient vietQRClient;

    @org.springframework.beans.factory.annotation.Autowired
    @org.springframework.context.annotation.Lazy
    private PaymentService paymentService;

    private final NotificationOutboxService notificationOutboxService;
    private final com.ecommerce.aims.payment.repository.IPaymentTransactionRepository paymentTransactionRepository;

    public CreatePaymentLinkResponse createPaymentLink(CreatePaymentRequest request) {
        Long orderCode = System.currentTimeMillis() / 1000;

        CreatePaymentLinkRequest paymentData = CreatePaymentLinkRequest.builder()
                .orderCode(orderCode)
                .amount(10000L)
                .description("Thanh toán đơn hàng ")
                .returnUrl(request.getSuccessReturnUrl())
                .cancelUrl(request.getCancelReturnUrl())
                .build();

        return vietQRClient.createPaymentLink(paymentData);
    }

    public PaymentResultResponse generateQr(PaymentTransaction transaction, CreatePaymentRequest request) {
        long orderCode = System.currentTimeMillis() * 1000L + ThreadLocalRandom.current().nextInt(1000);
        transaction.setCaptureId(String.valueOf(orderCode));
        CreatePaymentLinkRequest paymentData = CreatePaymentLinkRequest.builder()
                .orderCode(transaction.getId()) // Use transaction ID as orderCode for webhook handling
                .amount(transaction.getAmount().setScale(0, RoundingMode.HALF_UP).longValue())
                .description("AIMS order " + transaction.getOrderId())
                .returnUrl(request.getSuccessReturnUrl())
                .cancelUrl(request.getCancelReturnUrl())
                .build();

        CreatePaymentLinkResponse response = vietQRClient.createPaymentLink(paymentData);
        transaction.setProviderReference(response.getPaymentLinkId());
        transaction.setQrContent(response.getQrCode());
        return PaymentResultResponse.builder()
                .transactionId(transaction.getId())
                .status(PaymentStatus.PENDING)
                .qrContent(transaction.getQrContent())
                .providerReference(transaction.getProviderReference())
                .build();
    }

    public PaymentStatus refreshStatus(PaymentTransaction transaction) {
        Long orderCode = parseOrderCode(transaction.getCaptureId());
        if (orderCode == null) {
            orderCode = transaction.getId();
        }
        PaymentLink paymentLink = vietQRClient.getPaymentLink(orderCode);
        transaction.setProviderReference(paymentLink.getId());
        PaymentStatus updatedStatus = mapStatus(paymentLink.getStatus());
        if (transaction.getStatus() != PaymentStatus.SUCCESSFULL) {
            transaction.setStatus(updatedStatus);
        }
        return transaction.getStatus();
    }

    private Long parseOrderCode(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return Long.valueOf(value);
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    public PaymentLink getPaymentStatus(String id) {
        return vietQRClient.getPaymentLinkStatus(id);
    }

    public vn.payos.model.v2.paymentRequests.PaymentLink cancelPaymentLink(Long orderCode, String cancellationReason) {
        return vietQRClient.cancelPaymentLink(orderCode, cancellationReason);
    }

    private PaymentStatus mapStatus(PaymentLinkStatus status) {
        // SOLID: Mapping is hardcoded; new gateway statuses require code changes (OCP).
        return switch (status) {
            case PAID -> PaymentStatus.SUCCESSFULL;
            case CANCELLED, EXPIRED, FAILED, UNDERPAID -> PaymentStatus.FAILED;
            default -> PaymentStatus.PENDING;
        };
    }

    /**
     * Handle PayOS webhook with signature verification using PayOS SDK.
     * The SDK internally verifies the HMAC-SHA256 signature to ensure data
     * integrity.
     */
    public void handleWebhook(java.util.Map<String, Object> payload) {
        if (payload == null) {
            return;
        }

        try {
            // Verify and extract webhook data
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            mapper.registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());

            vn.payos.model.webhooks.WebhookData webhook = mapper.convertValue(payload.get("data"),
                    vn.payos.model.webhooks.WebhookData.class);
            String signature = (String) payload.get("signature");

            // Reconstruct the full webhook structure for verification
            vn.payos.model.webhooks.WebhookData receivedWebhook = new vn.payos.model.webhooks.WebhookData(
                    webhook.getOrderCode(),
                    webhook.getAmount(),
                    webhook.getDescription(),
                    webhook.getAccountNumber(),
                    webhook.getReference(),
                    webhook.getTransactionDateTime(),
                    webhook.getCurrency(),
                    webhook.getPaymentLinkId(),
                    webhook.getCode(),
                    webhook.getDesc(),
                    webhook.getCounterAccountBankId(),
                    webhook.getCounterAccountBankName(),
                    webhook.getCounterAccountName(),
                    webhook.getCounterAccountNumber(),
                    webhook.getVirtualAccountName(),
                    webhook.getVirtualAccountNumber());

            vn.payos.model.webhooks.Webhook verifiedWebhook = new vn.payos.model.webhooks.Webhook();
            verifiedWebhook.setCode(webhook.getCode());
            verifiedWebhook.setDesc(webhook.getDesc());
            verifiedWebhook.setData(receivedWebhook);
            verifiedWebhook.setSignature(signature);

            vn.payos.model.webhooks.WebhookData verifiedData = vietQRClient.verifyWebhook(verifiedWebhook);

            if (verifiedData == null || verifiedData.getOrderCode() == null) {
                throw new com.ecommerce.aims.common.exception.BusinessException(
                        "Invalid webhook data or missing order code");
            }

            String orderCodeValue = String.valueOf(verifiedData.getOrderCode());
            System.out.println(">>> RECEIVED WEBHOOK for OrderCode: " + orderCodeValue);
            System.out.println(">>> Verified Data: " + verifiedData);

            PaymentTransaction transaction = paymentTransactionRepository
                    .findTopByCaptureIdOrderByCreatedAtDesc(orderCodeValue)
                    .orElse(null);
            if (transaction == null) {
                transaction = paymentTransactionRepository.findById(verifiedData.getOrderCode()).orElse(null);
            }
            if (transaction == null) {
                throw new com.ecommerce.aims.common.exception.BusinessException(
                        "No transaction found for order code " + orderCodeValue);
            }

            // Mark transaction as captured
            com.ecommerce.aims.payment.dto.PaymentResultResponse response = paymentService.markCaptured(
                    transaction.getId(), null);

            // Enqueue email specifically for VietQR payments
            try {
                PaymentTransaction capturedTransaction = paymentTransactionRepository
                        .findById(response.getTransactionId())
                        .orElse(null);

                if (capturedTransaction != null) {
                    notificationOutboxService.enqueue(
                            NotificationEventType.ORDER_PAYMENT_SUCCESS,
                            Map.of("orderId", transaction.getOrderId(), "transactionId", transaction.getId()),
                            "order-payment-success:" + transaction.getOrderId() + ":" + transaction.getId());
                }
            } catch (Exception e) {
                System.err.println("Failed to enqueue VietQR success email: " + e.getMessage());
                // Do not throw, keep transaction success
            }

        } catch (com.ecommerce.aims.common.exception.BusinessException e) {
            System.err.println("Webhook verification failed: " + e.getMessage());
            throw e;
        } catch (Exception e) {
            System.err.println("Unexpected error processing webhook: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Webhook processing failed: " + e.getMessage());
        }
    }
}
