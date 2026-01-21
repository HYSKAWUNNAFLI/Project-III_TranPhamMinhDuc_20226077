package com.ecommerce.aims.product.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class BulkDeleteResponse {
    private int deletedCount;
    private int deactivatedCount;
    private List<Long> deletedIds;
    private List<Long> deactivatedIds;
    private List<String> errors;
}
