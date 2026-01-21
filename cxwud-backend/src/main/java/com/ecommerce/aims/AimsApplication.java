package com.ecommerce.aims;

import com.ecommerce.aims.payment.config.PayPalProperties;
import com.ecommerce.aims.payment.config.VietQrProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableAsync
@EnableScheduling
@EnableCaching
@EnableConfigurationProperties({ PayPalProperties.class, VietQrProperties.class })
public class AimsApplication {
    public static void main(String[] args) {
        SpringApplication.run(AimsApplication.class, args);
    }
}
