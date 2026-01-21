package com.ecommerce.aims.payment.dto;

import com.ecommerce.aims.payment.models.PaymentStatus;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PaymentResultResponse {
    private Long transactionId;
    private PaymentStatus status;
    private String approvalUrl;
    private String captureUrl;
    private String qrContent;
    private String providerReference;
}
