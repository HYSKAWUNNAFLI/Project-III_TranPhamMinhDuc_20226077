package com.ecommerce.aims.product.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ProductTypeRequest {
    @NotBlank(message = "Product type code is required")
    @Size(max = 50, message = "Code must not exceed 50 characters")
    @Pattern(regexp = "^[A-Z_]+$", message = "Code must contain only uppercase letters and underscores")
    private String code;
}
