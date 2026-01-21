package com.ecommerce.aims.notification.services;

import com.ecommerce.aims.common.exception.NotFoundException;
import com.ecommerce.aims.notification.dto.SendOrderPaymentEmailRequest;
import com.ecommerce.aims.notification.models.EmailTemplateType;
import com.ecommerce.aims.order.models.DeliveryInfo;
import com.ecommerce.aims.order.models.Invoice;
import com.ecommerce.aims.order.models.Order;
import com.ecommerce.aims.order.repository.OrderRepository;
import com.ecommerce.aims.payment.models.PaymentTransaction;
import com.ecommerce.aims.payment.repository.IPaymentTransactionRepository;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

@Service
@RequiredArgsConstructor
public class EmailNotificationService {

    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private static final String ORDER_PAYMENT_TEMPLATE = "order-payment-confirmation";
    private static final String TEST_RECIPIENT = "ductranphamminh4924@gmail.com";

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;
    private final OrderRepository orderRepository;
    private final IPaymentTransactionRepository IPaymentTransactionRepository;

    @Value("${spring.mail.from:${spring.mail.username:no-reply@localhost}}")
    private String fromAddress;

    @Value("${app.notification.order-detail-url:http://localhost:5173/orders/{orderId}}")
    private String orderDetailUrlTemplate;

    public void sendEmail(String to, String subject, String body, EmailTemplateType templateType) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(to);
        message.setSubject(subject);
        message.setText(body);
        mailSender.send(message);
    }

    public void sendEmail(Long orderId, Long transactionId) {
        Long requiredOrderId = Objects.requireNonNull(orderId, "orderId must not be null");
        Order order = orderRepository.findById(requiredOrderId)
                .orElseThrow(() -> new NotFoundException("Order not found"));
        PaymentTransaction transaction = resolveTransaction(requiredOrderId, transactionId);
        sendPaymentSuccessEmail(order, transaction);
    }

    public void sendOrderConfirmationEmail(SendOrderPaymentEmailRequest request) {
        Objects.requireNonNull(request, "request must not be null");
        String subject = buildSubject(request.getOrderId());
        Context context = buildContextFromRequest(request);
        String htmlBody = templateEngine.process(ORDER_PAYMENT_TEMPLATE, context);
        sendHtmlEmail(TEST_RECIPIENT, subject, htmlBody);
    }

    public void sendPaymentSuccessEmail(Order order, PaymentTransaction transaction) {
        Order requiredOrder = Objects.requireNonNull(order, "order must not be null");
        String to = requiredOrder.getCustomerEmail();
        if (to == null || to.isBlank()) {
            return;
        }
        String subject = buildSubject(requiredOrder.getId());
        Context context = buildContextFromOrder(requiredOrder, transaction);
        String htmlBody = templateEngine.process(ORDER_PAYMENT_TEMPLATE, context);
        sendHtmlEmail(to, subject, htmlBody);
    }

    private void sendHtmlEmail(String to, String subject, String htmlBody) {
        MimeMessage mimeMessage = mailSender.createMimeMessage();
        try {
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
        } catch (MessagingException e) {
            throw new IllegalStateException("Failed to build email message", e);
        }
        mailSender.send(mimeMessage);
    }

    private PaymentTransaction resolveTransaction(Long orderId, Long transactionId) {
        if (transactionId != null) {
            return IPaymentTransactionRepository.findById(transactionId).orElse(null);
        }
        return IPaymentTransactionRepository.findTopByOrderIdOrderByCreatedAtDesc(orderId).orElse(null);
    }

    private Context buildContextFromOrder(Order order, PaymentTransaction transaction) {
        Invoice invoice = order.getInvoice();
        DeliveryInfo delivery = invoice != null ? invoice.getDeliveryInfo() : null;
        String orderTotal = formatAmount(resolveOrderTotal(order, invoice),
                transaction != null ? transaction.getCurrency() : null);
        return buildContext(
                resolveCustomerName(order, delivery),
                delivery != null ? delivery.getPhone() : null,
                delivery != null ? delivery.getAddressLine() : null,
                resolveProvinceCity(delivery),
                orderTotal,
                resolveTransactionCode(transaction),
                resolveTransactionContent(transaction),
                formatDateTime(resolveTransactionTime(transaction)),
                buildOrderDetailsUrl(order.getId()));
    }

    private Context buildContextFromRequest(SendOrderPaymentEmailRequest request) {
        String orderTotal = formatAmount(request.getTotalAmount(), null);
        String transactionCode = request.getTransactionId() != null ? request.getTransactionId().toString() : null;
        return buildContext(
                request.getCustomerName(),
                request.getCustomerPhone(),
                request.getShippingAddress(),
                request.getProvinceCity(),
                orderTotal,
                transactionCode,
                request.getTransactionContent(),
                request.getTransactionTime(),
                buildOrderDetailsUrl(request.getOrderId()));
    }

    private Context buildContext(String customerName,
            String customerPhone,
            String shippingAddress,
            String provinceCity,
            String orderTotal,
            String transactionCode,
            String transactionContent,
            String transactionTime,
            String orderDetailsUrl) {
        Context context = new Context(Locale.US);
        context.setVariable("customerName", safeValue(customerName));
        context.setVariable("customerPhone", safeValue(customerPhone));
        context.setVariable("shippingAddress", safeValue(shippingAddress));
        context.setVariable("provinceCity", safeValue(provinceCity));
        context.setVariable("orderTotal", safeValue(orderTotal));
        context.setVariable("transactionCode", safeValue(transactionCode));
        context.setVariable("transactionContent", safeValue(transactionContent));
        context.setVariable("transactionTime", safeValue(transactionTime));
        context.setVariable("orderDetailsUrl", resolveOrderDetailsUrl(orderDetailsUrl));
        return context;
    }

    private String buildSubject(Long orderId) {
        if (orderId == null) {
            return "Payment confirmation";
        }
        return "Payment confirmation - Order #" + orderId;
    }

    private String buildOrderDetailsUrl(Long orderId) {
        if (orderId == null) {
            return null;
        }
        String base = orderDetailUrlTemplate;
        if (base == null || base.isBlank()) {
            return null;
        }
        String orderIdValue = orderId.toString();
        if (base.contains("{orderId}")) {
            return base.replace("{orderId}", orderIdValue);
        }
        return base;
    }

    private String resolveOrderDetailsUrl(String url) {
        if (url == null || url.isBlank()) {
            return "#";
        }
        return url;
    }

    private String resolveCustomerName(Order order, DeliveryInfo delivery) {
        String fromDelivery = delivery != null ? delivery.getRecipientName() : null;
        return firstNonBlank(fromDelivery, order.getCustomerName(), null);
    }

    private String resolveProvinceCity(DeliveryInfo delivery) {
        if (delivery == null) {
            return null;
        }
        return joinNonBlank(delivery.getCity(), delivery.getProvince(), ", ");
    }

    private BigDecimal resolveOrderTotal(Order order, Invoice invoice) {
        if (invoice != null && invoice.getTotalWithVat() != null) {
            return invoice.getTotalWithVat();
        }
        return order.getTotalWithVat();
    }

    private String resolveTransactionCode(PaymentTransaction transaction) {
        if (transaction == null) {
            return null;
        }
        if (transaction.getId() != null) {
            return transaction.getId().toString();
        }
        return firstNonBlank(transaction.getProviderReference(), transaction.getCaptureId(), null);
    }

    private String resolveTransactionContent(PaymentTransaction transaction) {
        if (transaction == null) {
            return null;
        }
        return firstNonBlank(transaction.getProviderReference(), transaction.getCaptureId(),
                transaction.getQrContent());
    }

    private LocalDateTime resolveTransactionTime(PaymentTransaction transaction) {
        if (transaction == null) {
            return null;
        }
        if (transaction.getUpdatedAt() != null) {
            return transaction.getUpdatedAt();
        }
        return transaction.getCreatedAt();
    }

    private String formatAmount(BigDecimal amount, String currency) {
        if (amount == null) {
            return null;
        }
        DecimalFormatSymbols symbols = new DecimalFormatSymbols(Locale.US);
        DecimalFormat format = new DecimalFormat("#,##0.00", symbols);
        format.setRoundingMode(RoundingMode.HALF_UP);
        String formatted = format.format(amount);
        if (currency == null || currency.isBlank()) {
            return formatted;
        }
        return formatted + " " + currency.toUpperCase(Locale.ROOT);
    }

    private String formatDateTime(LocalDateTime value) {
        if (value == null) {
            return null;
        }
        return DATE_TIME_FORMATTER.format(value);
    }

    private String firstNonBlank(String first, String second, String third) {
        if (first != null && !first.isBlank()) {
            return first;
        }
        if (second != null && !second.isBlank()) {
            return second;
        }
        if (third != null && !third.isBlank()) {
            return third;
        }
        return null;
    }

    private String joinNonBlank(String first, String second, String delimiter) {
        String firstValue = first != null && !first.isBlank() ? first.trim() : null;
        String secondValue = second != null && !second.isBlank() ? second.trim() : null;
        if (firstValue == null && secondValue == null) {
            return null;
        }
        if (firstValue == null) {
            return secondValue;
        }
        if (secondValue == null) {
            return firstValue;
        }
        return firstValue + delimiter + secondValue;
    }

    private String safeValue(String value) {
        if (value == null || value.isBlank()) {
            return "NULL";
        }
        return value;
    }

    @Value("${app.frontend-url:http://localhost:5713}")
    private String frontendUrl;

    @Value("${app.support-email:support@aims.com}")
    private String supportEmail;

    public void sendPasswordResetEmail(String email, String token) {
        String resetLink = String.format("%s/reset-password?token=%s", frontendUrl, token);
        Context context = new Context();
        context.setVariable("email", email);
        context.setVariable("resetLink", resetLink);
        context.setVariable("expirationTime", "15 minutes");
        String htmlBody = templateEngine.process("email/password-reset", context);
        sendHtmlEmail(email, "AIMS Password Reset Request", htmlBody);
    }

    public void sendAdminPasswordResetEmail(String email, String token) {
        sendPasswordResetEmail(email, token);
    }

    public void sendUserCreatedByAdminEmail(String email, String temporaryPassword) {
        String loginUrl = frontendUrl + "/login";
        Context context = new Context();
        context.setVariable("email", email);
        context.setVariable("temporaryPassword", temporaryPassword);
        context.setVariable("loginUrl", loginUrl);
        String htmlBody = templateEngine.process("email/user-created", context);
        sendHtmlEmail(email, "Welcome to AIMS - Account Created", htmlBody);
    }

    public void sendUserUpdatedByAdminEmail(String email) {
        Context context = new Context();
        context.setVariable("email", email);
        context.setVariable("supportEmail", supportEmail);
        String htmlBody = templateEngine.process("email/user-updated", context);
        sendHtmlEmail(email, "AIMS Account Update Notification", htmlBody);
    }

    public void sendUserDeletedByAdminEmail(String email) {
        Context context = new Context();
        context.setVariable("email", email);
        context.setVariable("contactEmail", supportEmail);
        String htmlBody = templateEngine.process("email/user-deleted", context);
        sendHtmlEmail(email, "AIMS Account Deletion", htmlBody);
    }

    public void sendUserLockedByAdminEmail(String email) {
        Context context = new Context();
        context.setVariable("email", email);
        context.setVariable("supportEmail", supportEmail);
        String htmlBody = templateEngine.process("email/user-locked", context);
        sendHtmlEmail(email, "AIMS Account Locked", htmlBody);
    }

    public void sendUserUnlockedByAdminEmail(String email) {
        String loginUrl = frontendUrl + "/login";
        Context context = new Context();
        context.setVariable("email", email);
        context.setVariable("loginUrl", loginUrl);
        String htmlBody = templateEngine.process("email/user-unlocked", context);
        sendHtmlEmail(email, "AIMS Account Unlocked", htmlBody);
    }

    public void sendSubscriptionThankYouEmail(String email) {
        Context context = new Context();
        context.setVariable("homeUrl", frontendUrl);
        String htmlBody = templateEngine.process("email/subscription-thank-you", context);
        sendHtmlEmail(email, "Thank you for subscribing to AIMS!", htmlBody);
    }
}
