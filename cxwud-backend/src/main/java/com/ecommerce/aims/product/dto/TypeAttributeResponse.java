package com.ecommerce.aims.product.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TypeAttributeResponse {
    private Long id;
    private String key;
    private String label;
    private String dataType;
    private boolean isRequired;
}
