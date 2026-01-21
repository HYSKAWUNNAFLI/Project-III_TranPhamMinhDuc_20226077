package com.ecommerce.aims.payment.repository;

import com.ecommerce.aims.payment.models.PaymentTransaction;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class PaymentTransactionRepository {

    private final IPaymentTransactionRepository paymentTransactionRepository;

    public Optional<PaymentTransaction> findById(Long id) {
        return paymentTransactionRepository.findById(id);
    }

    public PaymentTransaction save(PaymentTransaction transaction) {
        return paymentTransactionRepository.save(transaction);
    }

    public void delete(PaymentTransaction transaction) {
        paymentTransactionRepository.delete(transaction);
    }

    public void deleteById(Long id) {
        paymentTransactionRepository.deleteById(id);
    }

    public List<PaymentTransaction> findAll() {
        return paymentTransactionRepository.findAll();
    }

    public Optional<PaymentTransaction> findTopByOrderIdOrderByCreatedAtDesc(Long orderId) {
        return paymentTransactionRepository.findTopByOrderIdOrderByCreatedAtDesc(orderId);
    }

    public Optional<PaymentTransaction> findTopByCaptureIdOrderByCreatedAtDesc(String captureId) {
        return paymentTransactionRepository.findTopByCaptureIdOrderByCreatedAtDesc(captureId);
    }

    public boolean existsById(Long id) {
        return paymentTransactionRepository.existsById(id);
    }

    public long count() {
        return paymentTransactionRepository.count();
    }
}
