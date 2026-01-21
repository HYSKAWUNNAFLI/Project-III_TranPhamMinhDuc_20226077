package com.ecommerce.aims.order.models;

import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "invoices")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Invoice {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "order_id")
    @lombok.ToString.Exclude
    @lombok.EqualsAndHashCode.Exclude
    private Order order;

    @Enumerated(EnumType.STRING)
    private InvoiceStatus status;

    @Embedded
    private DeliveryInfo deliveryInfo;

    private BigDecimal totalBeforeVat;
    private BigDecimal vatAmount;
    private BigDecimal shippingFee;
    private BigDecimal totalWithVat;
}
