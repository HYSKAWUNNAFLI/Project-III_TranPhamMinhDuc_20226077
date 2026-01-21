package com.ecommerce.aims.order.models;

import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Embeddable
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeliveryInfo {
    private String recipientName;
    private String phone;
    private String addressLine;
    private String city;
    private String province;
    private String postalCode;
}
