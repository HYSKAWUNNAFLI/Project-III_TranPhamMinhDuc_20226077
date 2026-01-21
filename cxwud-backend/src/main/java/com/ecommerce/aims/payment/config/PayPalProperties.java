package com.ecommerce.aims.payment.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.math.BigDecimal;

@ConfigurationProperties(prefix = "paypal")
public class PayPalProperties {
    private String baseUrl;
    private String clientId;
    private String clientSecret;
    private String currency = "USD";
    private BigDecimal vndToUsdRate = new BigDecimal("25000");

    public String getBaseUrl() {
        return baseUrl;
    }

    public void setBaseUrl(String baseUrl) {
        this.baseUrl = baseUrl;
    }

    public String getClientId() {
        return clientId;
    }

    public void setClientId(String clientId) {
        this.clientId = clientId;
    }

    public String getClientSecret() {
        return clientSecret;
    }

    public void setClientSecret(String clientSecret) {
        this.clientSecret = clientSecret;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public BigDecimal getVndToUsdRate() {
        return vndToUsdRate;
    }

    public void setVndToUsdRate(BigDecimal vndToUsdRate) {
        this.vndToUsdRate = vndToUsdRate;
    }

    private String webhookId;

    public String getWebhookId() {
        return webhookId;
    }

    public void setWebhookId(String webhookId) {
        this.webhookId = webhookId;
    }
}
