package com.ecommerce.aims.product.controllers;

import com.ecommerce.aims.common.dto.ApiResponse;
import com.ecommerce.aims.common.dto.PageResponse;
import com.ecommerce.aims.product.dto.ProductFilterRequest;
import com.ecommerce.aims.product.dto.ProductResponse;
import com.ecommerce.aims.product.services.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
@Validated
public class ProductController {

    private final ProductService productService;

    @GetMapping
    public ApiResponse<PageResponse<ProductResponse>> listProducts(@Valid ProductFilterRequest filter) {
        return ApiResponse.success(productService.listProducts(filter), "Products fetched");
    }

    @GetMapping("/{id}")
    public ApiResponse<ProductResponse> getProduct(@PathVariable Long id) {
        return ApiResponse.success(productService.getProduct(id), "Product detail");
    }
}
