package com.ecommerce.aims.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                // ✅ Specify exact origin (cannot use "*" with credentials)
                .allowedOrigins(
                        "http://localhost:5173", // Vite default
                        "http://localhost:3000", // React/Next.js alternative
                        "http://127.0.0.1:5173", // Alternative localhost
                        "https://aims-frontend-cxhp.onrender.com")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
                .allowedHeaders("*")
                // ✅ CRITICAL: Enable credentials for cookies
                .allowCredentials(true)
                // ✅ Optional: Expose headers if needed
                .exposedHeaders("Set-Cookie", "Authorization")
                // ✅ Optional: Cache preflight for 1 hour
                .maxAge(3600);
    }
}
