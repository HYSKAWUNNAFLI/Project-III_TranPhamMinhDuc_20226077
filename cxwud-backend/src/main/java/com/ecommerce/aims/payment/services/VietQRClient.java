package com.ecommerce.aims.payment.services;

import com.ecommerce.aims.common.exception.BusinessException;
import com.ecommerce.aims.payment.config.VietQrProperties;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Objects;
import lombok.Data;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import vn.payos.PayOS;
import vn.payos.model.webhooks.Webhook;
import vn.payos.model.webhooks.WebhookData;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkRequest;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkResponse;
import vn.payos.model.v2.paymentRequests.PaymentLink;

@Service
@lombok.extern.slf4j.Slf4j
public class VietQRClient {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private final WebClient.Builder webClientBuilder;
    private final VietQrProperties properties;
    private final PayOS payOS;

    public VietQRClient(WebClient.Builder webClientBuilder,
            VietQrProperties properties,
            @Value("${vietqr.client-id}") String clientId,
            @Value("${vietqr.api-key}") String apiKey,
            @Value("${vietqr.checksum-key}") String checksumKey) {
        this.webClientBuilder = webClientBuilder;
        this.properties = properties;
        this.payOS = new PayOS(clientId, apiKey, checksumKey);
    }

    public CreatePaymentLinkResponse createPaymentLink(CreatePaymentLinkRequest request) {
        try {
            return payOS.paymentRequests().create(request);
        } catch (Exception e) {
            throw new BusinessException("PayOS create payment link error: " + e.getMessage());
        }
    }

    public PaymentLink getPaymentLinkStatus(String paymentLinkIdOrOrderCode) {
        Objects.requireNonNull(paymentLinkIdOrOrderCode, "paymentLinkIdOrOrderCode must not be null");
        try {
            return payOS.paymentRequests().get(paymentLinkIdOrOrderCode);
        } catch (Exception e) {
            if (paymentLinkIdOrOrderCode.chars().allMatch(Character::isDigit)) {
                try {
                    return payOS.paymentRequests().get(Long.valueOf(paymentLinkIdOrOrderCode));
                } catch (Exception inner) {
                    throw new BusinessException("PayOS get payment link error: " + inner.getMessage());
                }
            }
            throw new BusinessException("PayOS get payment link error: " + e.getMessage());
        }
    }

    public PaymentLink getPaymentLink(Long orderCode) {
        try {
            return payOS.paymentRequests().get(orderCode);
        } catch (Exception e) {
            throw new BusinessException("PayOS get payment link error: " + e.getMessage());
        }
    }

    public PaymentLink cancelPaymentLink(Long orderCode, String cancellationReason) {
        try {
            return payOS.paymentRequests().cancel(orderCode, cancellationReason);
        } catch (Exception e) {
            throw new BusinessException("PayOS cancel payment link error: " + e.getMessage());
        }
    }

    /**
     * Verify webhook signature using PayOS SDK.
     * Internally uses HMAC-SHA256 with checksumKey to verify data integrity.
     * 
     * @param webhook The webhook object from PayOS
     * @return Verified WebhookData if signature is valid
     * @throws BusinessException if signature verification fails
     */
    public WebhookData verifyWebhook(Webhook webhook) {
        Objects.requireNonNull(webhook, "webhook must not be null");
        try {
            return payOS.webhooks().verify(webhook);
        } catch (Exception e) {
            throw new BusinessException("PayOS webhook signature verification failed: " + e.getMessage());
        }
    }

    public VietQrCreateResponse createQr(Long orderId, BigDecimal amount, String description) {
        try {
            VietQrCreateRequest payload = new VietQrCreateRequest();
            payload.setOrderId(orderId);
            payload.setAmount(amount.setScale(0, RoundingMode.HALF_UP));
            payload.setDescription(description);
            log.info("Calling VietQR generate at {}", buildGenerateUrl());

            String raw = webClientBuilder.build()
                    .post()
                    .uri(buildGenerateUrl())
                    .header("x-client-id",
                            Objects.requireNonNull(properties.getClientId(), "clientId must not be null"))
                    .header("x-api-key", Objects.requireNonNull(properties.getApiKey(), "apiKey must not be null"))
                    .contentType(Objects.requireNonNull(MediaType.APPLICATION_JSON, "mediaType must not be null"))
                    .bodyValue(Objects.requireNonNull(payload, "payload must not be null"))
                    .retrieve()
                    .onStatus(HttpStatusCode::isError, resp -> resp.bodyToMono(String.class)
                            .defaultIfEmpty("no-body")
                            .map(body -> (Throwable) new BusinessException(
                                    "VietQR create error: http " + resp.statusCode() + " - " + body)))
                    .bodyToMono(String.class)
                    .block();

            if (raw == null) {
                throw new BusinessException("VietQR create error: empty response");
            }

            JsonNode root = OBJECT_MAPPER.readTree(raw);
            String code = root.hasNonNull("code") ? root.get("code").asText() : null;
            if (code != null && !"00".equals(code) && !"0".equals(code)) {
                String desc = root.hasNonNull("desc") ? root.get("desc").asText() : "unknown";
                throw new BusinessException("VietQR create error: " + desc + " (code " + code + ")");
            }

            JsonNode data = root.has("data") ? root.get("data") : root;
            VietQrCreateResponse response = new VietQrCreateResponse();
            response.setQrContent(firstNonNullText(data, "qrContent", "qrData", "qrDataURL", "qrUrl"));
            response.setQrImage(firstNonNullText(data, "qrImage", "qrCode"));
            response.setTransactionId(firstNonNullText(data, "transactionId", "orderCode", "orderId"));
            return response;
        } catch (WebClientResponseException ex) {
            throw new BusinessException("VietQR create error: " + ex.getResponseBodyAsString());
        } catch (Exception ex) {
            throw new BusinessException("VietQR create error: " + ex.getMessage());
        }
    }

    private String buildGenerateUrl() {
        String base = Objects.requireNonNull(properties.getBaseUrl(), "baseUrl must not be null");
        if (base.endsWith("/")) {
            base = base.substring(0, base.length() - 1);
        }
        if (base.endsWith("/v2/generate")) {
            return base;
        }
        return base + "/v2/generate";
    }

    private String firstNonNullText(JsonNode node, String... fields) {
        if (node == null) {
            return null;
        }
        for (String f : fields) {
            JsonNode child = node.get(f);
            if (child != null && !child.isNull()) {
                String val = child.asText();
                if (val != null && !val.isEmpty()) {
                    return val;
                }
            }
        }
        return null;
    }

    @Data
    public static class VietQrCreateRequest {
        private Long orderId;
        private BigDecimal amount;
        private String description;
    }

    @Data
    public static class VietQrCreateResponse {
        private String qrContent;
        private String qrImage;
        private String transactionId;
    }
}
