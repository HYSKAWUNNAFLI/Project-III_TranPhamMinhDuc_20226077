package com.ecommerce.aims.order.repository;

import com.ecommerce.aims.order.models.Invoice;
import com.ecommerce.aims.order.models.InvoiceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {
    Optional<Invoice> findByOrderIdAndStatus(Long orderId, InvoiceStatus status);

    List<Invoice> findAllByOrderId(Long orderId);
}
