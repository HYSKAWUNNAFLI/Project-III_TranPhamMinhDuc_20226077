package com.ecommerce.aims.payment.controllers;

import com.ecommerce.aims.payment.services.PayPalWebhookService;
import com.ecommerce.aims.payment.services.VietQRService;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/payments/webhooks")
@RequiredArgsConstructor
public class PaymentWebhookController {

    private final PayPalWebhookService payPalWebhookService;
    private final VietQRService vietQRService;

    @PostMapping("/paypal")
    public ResponseEntity<Map<String, String>> handlePayPalWebhook(
            @RequestBody Map<String, Object> payload,
            @RequestHeader(value = "PAYPAL-AUTH-ALGO", required = false) String authAlgo,
            @RequestHeader(value = "PAYPAL-CERT-URL", required = false) String certUrl,
            @RequestHeader(value = "PAYPAL-TRANSMISSION-ID", required = false) String transmissionId,
            @RequestHeader(value = "PAYPAL-TRANSMISSION-SIG", required = false) String transmissionSig,
            @RequestHeader(value = "PAYPAL-TRANSMISSION-TIME", required = false) String transmissionTime) {
        payPalWebhookService.handleWebhook(payload, authAlgo, certUrl, transmissionId, transmissionSig,
                transmissionTime);
        return ResponseEntity.ok(Map.of("status", "ok"));
    }

    @PostMapping("/payos")
    public ResponseEntity<Map<String, String>> handlePayOSWebhook(@RequestBody Map<String, Object> payload) {
        vietQRService.handleWebhook(payload);
        return ResponseEntity.ok(Map.of("status", "ok"));
    }
}

//