package com.ecommerce.aims.payment.services;

import com.ecommerce.aims.common.exception.BusinessException;
import com.ecommerce.aims.payment.config.PayPalProperties;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@lombok.extern.slf4j.Slf4j
public class PayPalWebhookService {

    private final PayPalClient payPalClient;
    private final PayPalProperties payPalProperties;
    private final PaymentService paymentService;

    public void handleWebhook(Map<String, Object> payload,
                              String authAlgo,
                              String certUrl,
                              String transmissionId,
                              String transmissionSig,
                              String transmissionTime) {
        String webhookId = payPalProperties.getWebhookId();
        if (webhookId == null || webhookId.isBlank()) {
            throw new BusinessException("PayPal webhook id not configured");
        }
        if (authAlgo == null || certUrl == null || transmissionId == null || transmissionSig == null || transmissionTime == null) {
            throw new BusinessException("Missing PayPal webhook headers");
        }
        PayPalClient.PayPalVerifyWebhookResponse response = payPalClient.verifyWebhookSignature(
            authAlgo, certUrl, transmissionId, transmissionSig, transmissionTime, webhookId, payload);
        if (response == null || !"SUCCESS".equalsIgnoreCase(response.getVerificationStatus())) {
            throw new BusinessException("PayPal webhook verification failed");
        }
        String eventType = asString(payload.get("event_type"));
        if (eventType == null) {
            return;
        }
        switch (eventType) {
            case "CHECKOUT.ORDER.APPROVED" -> handleOrderApproved(payload);
            case "PAYMENT.CAPTURE.COMPLETED" -> handleCaptureCompleted(payload);
            default -> log.debug("Ignoring PayPal event {}", eventType);
        }
    }

    private void handleOrderApproved(Map<String, Object> payload) {
        Map<String, Object> resource = asMap(payload.get("resource"));
        if (resource == null) {
            return;
        }
        String paypalOrderId = asString(resource.get("id"));
        String customId = extractCustomId(resource);
        Long orderId = parseLong(customId);
        if (orderId == null || paypalOrderId == null) {
            log.warn("PayPal webhook missing order mapping: orderId={}, paypalOrderId={}", customId, paypalOrderId);
            return;
        }
        paymentService.capturePayPalOrder(orderId, paypalOrderId, null);
    }

    private void handleCaptureCompleted(Map<String, Object> payload) {
        Map<String, Object> resource = asMap(payload.get("resource"));
        if (resource == null) {
            return;
        }
        String captureId = asString(resource.get("id"));
        String customId = extractCustomId(resource);
        Long orderId = parseLong(customId);
        if (orderId == null) {
            log.warn("PayPal capture webhook missing order id: captureId={}", captureId);
            return;
        }
        String paypalOrderId = extractRelatedOrderId(resource);
        String providerReference = paypalOrderId != null ? paypalOrderId : captureId;
        paymentService.capturePayPalOrder(orderId, providerReference, captureId);
    }

    private String extractCustomId(Map<String, Object> resource) {
        String customId = asString(resource.get("custom_id"));
        if (customId != null) {
            return customId;
        }
        List<Map<String, Object>> purchaseUnits = asList(resource.get("purchase_units"));
        if (purchaseUnits != null) {
            for (Map<String, Object> unit : purchaseUnits) {
                String value = asString(unit.get("custom_id"));
                if (value != null) {
                    return value;
                }
            }
        }
        Map<String, Object> supplementary = asMap(resource.get("supplementary_data"));
        if (supplementary == null) {
            return null;
        }
        Map<String, Object> relatedIds = asMap(supplementary.get("related_ids"));
        return relatedIds != null ? asString(relatedIds.get("custom_id")) : null;
    }

    private String extractRelatedOrderId(Map<String, Object> resource) {
        Map<String, Object> supplementary = asMap(resource.get("supplementary_data"));
        if (supplementary == null) {
            return null;
        }
        Map<String, Object> relatedIds = asMap(supplementary.get("related_ids"));
        if (relatedIds == null) {
            return null;
        }
        return asString(relatedIds.get("order_id"));
    }

    private Long parseLong(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return Long.parseLong(value);
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> asMap(Object value) {
        if (value instanceof Map<?, ?> map) {
            return (Map<String, Object>) map;
        }
        return null;
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> asList(Object value) {
        if (value instanceof List<?> list) {
            return (List<Map<String, Object>>) list;
        }
        return null;
    }

    private String asString(Object value) {
        if (value instanceof String str && !str.isBlank()) {
            return str;
        }
        return null;
    }
}
