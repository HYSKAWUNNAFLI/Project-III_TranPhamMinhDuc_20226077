package com.ecommerce.aims.payment.repository;

import com.ecommerce.aims.payment.models.PaymentTransaction;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface IPaymentTransactionRepository extends JpaRepository<PaymentTransaction, Long> {
    Optional<PaymentTransaction> findTopByOrderIdOrderByCreatedAtDesc(Long orderId);
    Optional<PaymentTransaction> findTopByCaptureIdOrderByCreatedAtDesc(String captureId);
}
