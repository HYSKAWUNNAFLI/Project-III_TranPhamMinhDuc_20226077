package com.ecommerce.aims.notification.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SubscriptionRequest {
    @Email
    @NotBlank
    private String email;
}
