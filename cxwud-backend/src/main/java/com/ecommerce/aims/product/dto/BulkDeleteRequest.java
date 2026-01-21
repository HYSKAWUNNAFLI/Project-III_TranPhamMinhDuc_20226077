package com.ecommerce.aims.product.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class BulkDeleteRequest {
    @NotEmpty(message = "Product IDs cannot be empty")
    @Size(max = 10, message = "Cannot delete more than 10 products at once") // add comment to test cd
    private List<Long> productIds;
}
