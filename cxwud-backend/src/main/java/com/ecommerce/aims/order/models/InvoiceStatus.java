package com.ecommerce.aims.order.models;

/**
 * Status of an invoice in the system.
 * ACTIVE - Current valid invoice for the order
 * TERMINATED - Invoice has been cancelled or replaced by a newer invoice
 */
public enum InvoiceStatus {
    ACTIVE,
    TERMINATED
}
