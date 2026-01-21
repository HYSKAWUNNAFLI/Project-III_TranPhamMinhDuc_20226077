package com.ecommerce.aims.cart.controllers;

import com.ecommerce.aims.cart.dto.AddToCartRequest;
import com.ecommerce.aims.cart.dto.CartResponse;
import com.ecommerce.aims.cart.dto.StockValidationResponse;
import com.ecommerce.aims.cart.dto.UpdateCartItemRequest;
import com.ecommerce.aims.cart.services.CartService;
import com.ecommerce.aims.common.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    @GetMapping
    public ApiResponse<CartResponse> getCart(@RequestParam(required = false) String sessionKey) {
        return ApiResponse.success(cartService.getCart(sessionKey), "Cart details");
    }

    @PostMapping("/items")
    public ApiResponse<CartResponse> addItem(@RequestParam(required = false) String sessionKey,
            @Valid @RequestBody AddToCartRequest request) {
        return ApiResponse.success(cartService.addToCart(sessionKey, request), "Item added");
    }

    @PatchMapping("/items")
    public ApiResponse<CartResponse> updateItem(@RequestParam(required = false) String sessionKey,
            @Valid @RequestBody UpdateCartItemRequest request) {
        return ApiResponse.success(cartService.updateItem(sessionKey, request), "Item updated");
    }

    @DeleteMapping("/items/{productId}")
    public ApiResponse<CartResponse> removeItem(@RequestParam(required = false) String sessionKey,
            @PathVariable Long productId) {
        return ApiResponse.success(cartService.removeItem(sessionKey, productId), "Item removed");
    }

    @PostMapping("/validate-stock")
    public ApiResponse<StockValidationResponse> validateStock(@RequestParam(required = false) String sessionKey) {
        return ApiResponse.success(cartService.validateStock(sessionKey), "Stock validated");
    }
}
