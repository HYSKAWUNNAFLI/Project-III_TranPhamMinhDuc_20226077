package com.ecommerce.aims.cart.services;

import com.ecommerce.aims.cart.dto.AddToCartRequest;
import com.ecommerce.aims.cart.dto.CartResponse;
import com.ecommerce.aims.cart.dto.StockValidationItem;
import com.ecommerce.aims.cart.dto.StockValidationResponse;
import com.ecommerce.aims.cart.dto.UpdateCartItemRequest;
import com.ecommerce.aims.cart.models.Cart;
import com.ecommerce.aims.cart.models.CartItem;
import com.ecommerce.aims.cart.repository.CartRepository;
import com.ecommerce.aims.common.exception.BusinessException;

import com.ecommerce.aims.common.util.MoneyUtils;
import com.ecommerce.aims.product.dto.ProductResponse;
import com.ecommerce.aims.product.models.ProductStatus;
import com.ecommerce.aims.product.models.Product;
import com.ecommerce.aims.product.services.ProductService;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.lang.Nullable;

@Service
@RequiredArgsConstructor
public class CartService {

    private final CartRepository cartRepository;
    private final ProductService productService;

    public CartResponse getCart(String sessionKey) {
        Cart cart = resolveCart(sessionKey);
        return toResponse(cart);
    }

    @Transactional
    public CartResponse addToCart(String sessionKey, AddToCartRequest request) {
        Objects.requireNonNull(request, "request must not be null");
        Long productId = Objects.requireNonNull(request.getProductId(), "productId must not be null");
        Integer quantity = Objects.requireNonNull(request.getQuantity(), "quantity must not be null");
        Cart cart = resolveCart(sessionKey);

        ProductResponse product = productService.getProduct(productId);

        if (product.getStatus() == ProductStatus.DEACTIVATED) {
            throw new BusinessException("Product is not available");
        }
        Optional<CartItem> existing = cart.getItems().stream()
                .filter(item -> item.getProductId().equals(productId))
                .findFirst();
        CartItem item = existing.orElseGet(() -> {
            CartItem created = new CartItem();
            created.setCart(cart);
            created.setProductId(productId);
            cart.getItems().add(created);
            return created;
        });

        int newQuantity = existing.isPresent() ? item.getQuantity() + quantity : quantity;
        ensureStockAvailable(product.getStock(), newQuantity);
        item.setQuantity(newQuantity);
        BigDecimal price = Optional.ofNullable(product.getCurrentPrice()).orElse(request.getPrice());
        if (price == null) {
            throw new BusinessException("Price must be provided when product has no current price");
        }
        item.setPrice(price);
        item.setTotalPrice(price.multiply(BigDecimal.valueOf(item.getQuantity())));
        cartRepository.save(cart);
        return toResponse(cart);
    }

    @Transactional
    public CartResponse updateItem(String sessionKey, UpdateCartItemRequest request) {
        Objects.requireNonNull(request, "request must not be null");
        Long productId = Objects.requireNonNull(request.getProductId(), "productId must not be null");
        Cart cart = resolveCart(sessionKey);
        ProductResponse product = productService.getProduct(productId);

        cart.getItems().stream()
                .filter(item -> item.getProductId().equals(productId))
                .findFirst()
                .ifPresent(item -> {
                    if (request.getQuantity() != null) {
                        ensureStockAvailable(product.getStock(), request.getQuantity());
                        item.setQuantity(request.getQuantity());
                    }
                    BigDecimal price = Optional.ofNullable(request.getPrice()).orElse(product.getCurrentPrice());
                    if (price != null) {
                        item.setPrice(price);
                    }
                    if (item.getPrice() != null && item.getQuantity() != null) {
                        item.setTotalPrice(item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
                    }
                });
        cartRepository.save(cart);
        return toResponse(cart);
    }

    @Transactional
    public CartResponse removeItem(String sessionKey, Long productId) {
        Long id = Objects.requireNonNull(productId, "productId must not be null");
        Cart cart = resolveCart(sessionKey);
        cart.getItems().removeIf(item -> item.getProductId().equals(id));
        cartRepository.save(cart);
        return toResponse(cart);
    }

    @Transactional
    public void clearCart(String sessionKey) {
        Objects.requireNonNull(sessionKey, "sessionKey must not be null");
        cartRepository.findBySessionKey(sessionKey).ifPresent(cart -> {
            cart.getItems().clear();
            cart.setIsCheckedOut(false); // Reset checkout flag when cart is cleared
            cartRepository.save(cart);
        });
    }

    @Transactional
    public void markAsCheckedOut(String sessionKey) {
        Objects.requireNonNull(sessionKey, "sessionKey must not be null");
        Cart cart = cartRepository.findBySessionKey(sessionKey)
                .orElseThrow(() -> new BusinessException("Cart not found for session: " + sessionKey));

        cart.setIsCheckedOut(true);
        cartRepository.save(cart);
    }

    @Transactional
    public void resetCheckout(String sessionKey) {
        Objects.requireNonNull(sessionKey, "sessionKey must not be null");
        cartRepository.findBySessionKey(sessionKey).ifPresent(cart -> {
            cart.setIsCheckedOut(false);
            cartRepository.save(cart);
        });
    }

    private void ensureStockAvailable(Integer stock, int requestedQuantity) {
        Integer available = Optional.ofNullable(stock).orElse(0);
        if (requestedQuantity > available) {
            int shortage = requestedQuantity - available;
            throw new BusinessException("Insufficient stock. Shortage: " + shortage);
        }
    }

    private Cart resolveCart(@Nullable String sessionKey) {
        String key = sessionKey != null ? sessionKey : UUID.randomUUID().toString();
        return cartRepository.findBySessionKey(key)
                .orElseGet(() -> cartRepository.save(Cart.builder().sessionKey(key).build()));
    }

    private CartResponse toResponse(Cart cart) {
        Cart nonNullCart = Objects.requireNonNull(cart, "cart must not be null");

        List<Long> productIds = nonNullCart.getItems().stream()
                .map(CartItem::getProductId)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        Map<Long, ProductResponse> productMap = productService.getProducts(productIds).stream()
                .collect(Collectors.toMap(ProductResponse::getId, Function.identity()));

        List<CartResponse.CartLine> cartLines = nonNullCart.getItems().stream()
                .map(item -> {
                    ProductResponse product = productMap.get(item.getProductId());
                    String productName = product != null ? product.getTitle() : "Unknown Product";
                    // Assuming imageUrl is stored in attributes map
                    String imageUrl = null;
                    if (product != null && product.getAttributes() != null) {
                        imageUrl = (String) product.getAttributes().get("imageUrl");
                    }

                    return CartResponse.CartLine.builder()
                            .productId(item.getProductId())
                            .productName(productName)
                            .imageUrl(imageUrl)
                            .quantity(item.getQuantity())
                            .price(item.getPrice())
                            .totalPrice(item.getTotalPrice())
                            .build();
                })
                .collect(Collectors.toList());

        BigDecimal total = nonNullCart.getItems().stream()
                .map(item -> Optional.ofNullable(item.getTotalPrice()).orElse(BigDecimal.ZERO))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalWithVat = MoneyUtils.applyVat(total);
        return CartResponse.builder()
                .cartId(nonNullCart.getId())
                .sessionKey(nonNullCart.getSessionKey())
                .items(cartLines)
                .totalBeforeVat(total)
                .totalWithVat(totalWithVat)
                .build();
    }

    /**
     * Validate stock for all items in the cart
     */
    public StockValidationResponse validateStock(String sessionKey) {
        Cart cart = resolveCart(sessionKey);
        List<StockValidationItem> stockItems = new ArrayList<>();
        boolean allValid = true;

        for (CartItem item : cart.getItems()) {
            ProductResponse product = productService.getProduct(item.getProductId());
            int available = product.getStock() != null ? product.getStock() : 0;
            boolean isEnough = available >= item.getQuantity();

            if (!isEnough) {
                allValid = false;
            }

            stockItems.add(StockValidationItem.builder()
                    .productId(item.getProductId())
                    .quantityRequested(item.getQuantity())
                    .quantityAvailable(available)
                    .isEnough(isEnough)
                    .build());
        }

        return StockValidationResponse.builder()
                .valid(allValid)
                .stockItems(stockItems)
                .build();
    }
}
