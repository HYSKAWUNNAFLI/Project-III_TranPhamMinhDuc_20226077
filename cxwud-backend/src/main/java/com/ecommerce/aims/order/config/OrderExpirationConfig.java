package com.ecommerce.aims.order.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration properties for order and payment expiration settings.
 * 
 * Configure in application.yml:
 * order:
 * expiration:
 * payment-minutes: 15
 * cleanup-days: 30
 */
@Configuration
@ConfigurationProperties(prefix = "order.expiration")
@Data
public class OrderExpirationConfig {

    /**
     * How many minutes until an unpaid order expires.
     * Default: 15 minutes
     */
    private int paymentMinutes = 5;

    /**
     * How many days to keep cancelled orders before cleanup.
     * Default: 30 days
     */
    private int cleanupDays = 30;
}
