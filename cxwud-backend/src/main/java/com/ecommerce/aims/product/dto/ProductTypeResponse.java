package com.ecommerce.aims.product.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductTypeResponse {
    private Long id;
    private String code;
    private List<TypeAttributeResponse> attributes;
}
