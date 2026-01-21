package com.ecommerce.aims.payment.services;

import com.ecommerce.aims.common.exception.BusinessException;
import com.ecommerce.aims.payment.config.PayPalProperties;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

@Service
@RequiredArgsConstructor
public class PayPalClient {

    private final WebClient.Builder webClientBuilder;
    private final PayPalProperties properties;

    public String fetchAccessToken() {
        try {
            PayPalTokenResponse response = client()
                    .post()
                    .uri("/v1/oauth2/token")
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .headers(h -> h.setBasicAuth(properties.getClientId(), properties.getClientSecret()))
                    .body(BodyInserters.fromFormData("grant_type", "client_credentials"))
                    .retrieve()
                    .bodyToMono(PayPalTokenResponse.class)
                    .block();
            if (response == null || response.getAccessToken() == null) {
                throw new BusinessException("Unable to fetch PayPal access token");
            }
            return response.getAccessToken();
        } catch (WebClientResponseException ex) {
            throw new BusinessException("PayPal token error: " + ex.getResponseBodyAsString());
        }
    }

    public PayPalOrderResponse createOrder(BigDecimal amount, String currency, String successUrl, String cancelUrl) {
        String token = fetchAccessToken();
        try {
            Map<String, Object> payload = Map.of(
                    "intent", "CAPTURE",
                    "purchase_units", List.of(Map.of(
                            "amount", Map.of(
                                    "currency_code", Objects.requireNonNull(currency, "currency must not be null"),
                                    "value",
                                    Objects.requireNonNull(amount, "amount must not be null")
                                            .setScale(2, RoundingMode.HALF_UP).toString()))),
                    "application_context", Map.of(
                            "return_url", Objects.requireNonNull(successUrl, "successUrl must not be null"),
                            "cancel_url", Objects.requireNonNull(cancelUrl, "cancelUrl must not be null")));
            return client()
                    .post()
                    .uri("/v2/checkout/orders")
                    .headers(h -> h.setBearerAuth(token))
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(Objects.requireNonNull(payload, "payload must not be null"))
                    .retrieve()
                    .bodyToMono(PayPalOrderResponse.class)
                    .block();
        } catch (WebClientResponseException ex) {
            throw new BusinessException("PayPal create order error: " + ex.getResponseBodyAsString());
        }
    }

    public PayPalOrderResponse captureOrder(String orderId) {
        String token = fetchAccessToken();
        try {
            return client()
                    .post()
                    .uri("/v2/checkout/orders/{orderId}/capture",
                            Objects.requireNonNull(orderId, "orderId must not be null"))
                    .headers(h -> h.setBearerAuth(token))
                    .retrieve()
                    .bodyToMono(PayPalOrderResponse.class)
                    .block();
        } catch (WebClientResponseException ex) {
            throw new BusinessException("PayPal capture error: " + ex.getResponseBodyAsString());
        }
    }

    public PayPalVerifyWebhookResponse verifyWebhookSignature(
            String authAlgo, String certUrl, String transmissionId, String transmissionSig, String transmissionTime,
            String webhookId, Map<String, Object> eventBody) {
        String token = fetchAccessToken();
        try {
            Map<String, Object> payload = Map.of(
                    "auth_algo", authAlgo,
                    "cert_url", certUrl,
                    "transmission_id", transmissionId,
                    "transmission_sig", transmissionSig,
                    "transmission_time", transmissionTime,
                    "webhook_id", webhookId,
                    "webhook_event", eventBody);
            return client()
                    .post()
                    .uri("/v1/notifications/verify-webhook-signature")
                    .headers(h -> h.setBearerAuth(token))
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(payload)
                    .retrieve()
                    .bodyToMono(PayPalVerifyWebhookResponse.class)
                    .block();
        } catch (WebClientResponseException ex) {
            throw new BusinessException("PayPal webhook verification error: " + ex.getResponseBodyAsString());
        }
    }

    private WebClient client() {
        return webClientBuilder.baseUrl(properties.getBaseUrl()).build();
    }

    // Helper for constructing capture URL when PayPal response doesn't include a
    // capture link
    public String getBaseUrlForDocs() {
        return properties.getBaseUrl();
    }

    @Data
    public static class PayPalTokenResponse {
        private String access_token;

        public String getAccessToken() {
            return access_token;
        }
    }

    @Data
    public static class PayPalOrderResponse {
        private String id;
        private String status;
        private List<Link> links;

        public String getApprovalLink() {
            if (CollectionUtils.isEmpty(links)) {
                return null;
            }
            return links.stream()
                    .filter(l -> "approve".equalsIgnoreCase(l.getRel()))
                    .map(Link::getHref)
                    .findFirst()
                    .orElse(null);
        }

        public String getCaptureLink() {
            if (CollectionUtils.isEmpty(links)) {
                return null;
            }
            return links.stream()
                    .filter(l -> "capture".equalsIgnoreCase(l.getRel()))
                    .map(Link::getHref)
                    .findFirst()
                    .orElse(null);
        }
    }

    @Data
    public static class Link {
        private String href;
        private String rel;
        private String method;
    }

    @Data
    public static class PayPalVerifyWebhookResponse {
        private String verification_status;

        public String getVerificationStatus() {
            return verification_status;
        }
    }
}
