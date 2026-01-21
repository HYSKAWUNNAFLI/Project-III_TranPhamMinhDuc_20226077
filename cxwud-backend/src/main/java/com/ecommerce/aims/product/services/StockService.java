package com.ecommerce.aims.product.services;

import com.ecommerce.aims.order.models.OrderItem;
import com.ecommerce.aims.product.models.Product;
import com.ecommerce.aims.product.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StockService {

    private final ProductRepository productRepository;

    @Transactional
    public void restoreStock(List<OrderItem> items) {
        items.forEach(item -> {
            productRepository.findById(item.getProductId()).ifPresent(product -> {
                int currentStock = product.getStock() == null ? 0 : product.getStock();
                product.setStock(currentStock + item.getQuantity());
            });
        });
    }

    @Transactional
    public void restoreStockWithLocking(List<OrderItem> items) {
        List<Long> productIds = items.stream()
            .map(OrderItem::getProductId)
            .distinct()
            .sorted()
            .collect(Collectors.toList());

        List<Product> lockedProducts = productRepository.findAllByIdInForUpdate(productIds);
        Map<Long, Product> productMap = lockedProducts.stream()
            .collect(Collectors.toMap(Product::getId, p -> p));

        Map<Long, Integer> totalQuantityByProduct = new HashMap<>();
        for (var item : items) {
            Long productId = item.getProductId();
            totalQuantityByProduct.merge(productId, item.getQuantity(), Integer::sum);
        }

        for (var entry : totalQuantityByProduct.entrySet()) {
            Long productId = entry.getKey();
            Integer quantity = entry.getValue();
            Product product = productMap.get(productId);
            if (product != null) {
                int currentStock = product.getStock() == null ? 0 : product.getStock();
                product.setStock(currentStock + quantity);
            }
        }
    }
}
