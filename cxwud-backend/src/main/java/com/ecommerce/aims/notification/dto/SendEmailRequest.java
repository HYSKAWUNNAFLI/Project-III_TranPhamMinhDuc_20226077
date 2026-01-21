package com.ecommerce.aims.notification.dto;

import com.ecommerce.aims.notification.models.EmailTemplateType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SendEmailRequest {
    @Email
    @NotBlank
    private String to;

    @NotBlank
    private String subject;

    @NotBlank
    private String body;

    private EmailTemplateType templateType;
}
