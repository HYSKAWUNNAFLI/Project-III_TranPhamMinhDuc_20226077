package com.ecommerce.aims.product.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class TypeAttributeRequest {
    @NotBlank(message = "Attribute key is required")
    @Size(max = 50, message = "Key must not exceed 50 characters")
    @Pattern(regexp = "^[a-z_]+$", message = "Key must contain only lowercase letters and underscores")
    private String key;

    @NotBlank(message = "Label is required")
    private String label;

    @NotBlank(message = "Data type is required")
    @Pattern(regexp = "^(string|integer|decimal|date|boolean|json|array)$", 
             message = "Data type must be one of: string, integer, decimal, date, boolean, json, array")
    private String dataType;

    @NotNull(message = "isRequired flag is required")
    private Boolean isRequired;
}
