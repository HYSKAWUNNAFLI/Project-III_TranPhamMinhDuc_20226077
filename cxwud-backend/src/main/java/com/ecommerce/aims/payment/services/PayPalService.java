package com.ecommerce.aims.payment.services;

import com.ecommerce.aims.payment.dto.CreatePaymentRequest;
import com.ecommerce.aims.payment.dto.PaymentResultResponse;
import com.ecommerce.aims.payment.models.PaymentTransaction;
import com.ecommerce.aims.payment.models.PaymentStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PayPalService {

    private final PayPalClient payPalClient;

    public PaymentResultResponse initiatePayment(PaymentTransaction transaction, CreatePaymentRequest request) {
        PayPalClient.PayPalOrderResponse response = payPalClient.createOrder(request.getAmount(), request.getCurrency(),
                request.getSuccessReturnUrl(), request.getCancelReturnUrl());
        transaction.setProviderReference(response.getId());
        String approvalUrl = response.getApprovalLink();
        String captureUrl = response.getCaptureLink();
        return PaymentResultResponse.builder()
                .transactionId(transaction.getId())
                .status(PaymentStatus.PENDING)
                .approvalUrl(approvalUrl)
                .captureUrl(captureUrl != null ? captureUrl
                        : String.format("%s/v2/checkout/orders/%s/capture", payPalClient.getBaseUrlForDocs(),
                                response.getId()))
                .providerReference(transaction.getProviderReference())
                .build();
    }

    public PaymentResultResponse capture(String orderId, PaymentTransaction transaction) {
        PayPalClient.PayPalOrderResponse response = payPalClient.captureOrder(orderId);
        transaction.setCaptureId(response.getId());
        transaction.setStatus(PaymentStatus.SUCCESSFULL);
        return PaymentResultResponse.builder()
                .transactionId(transaction.getId())
                .status(transaction.getStatus())
                .providerReference(response.getId())
                .build();
    }

}
