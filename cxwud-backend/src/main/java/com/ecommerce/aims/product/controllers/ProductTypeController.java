package com.ecommerce.aims.product.controllers;

import com.ecommerce.aims.common.dto.ApiResponse;
import com.ecommerce.aims.product.dto.*;
import com.ecommerce.aims.product.services.ProductTypeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/product-types")
@RequiredArgsConstructor
public class ProductTypeController {

    private final ProductTypeService productTypeService;

    @GetMapping
    public ApiResponse<List<ProductTypeResponse>> getAllProductTypes() {
        return ApiResponse.success(productTypeService.getAllProductTypes(), "Product types retrieved successfully");
    }

    @GetMapping("/{code}")
    public ApiResponse<ProductTypeResponse> getProductTypeByCode(@PathVariable String code) {
        return ApiResponse.success(productTypeService.getProductTypeByCode(code), "Product type retrieved successfully");
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ProductTypeResponse> createProductType(@Valid @RequestBody CreateProductTypeRequest request) {
        return ApiResponse.success(productTypeService.createProductType(request), "Product type created successfully");
    }

    @PutMapping("/{code}")
    public ApiResponse<ProductTypeResponse> updateProductType(
            @PathVariable String code,
            @Valid @RequestBody ProductTypeRequest request) {
        return ApiResponse.success(productTypeService.updateProductType(code, request), "Product type updated successfully");
    }

    @DeleteMapping("/{code}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public ApiResponse<Void> deleteProductType(@PathVariable String code) {
        productTypeService.deleteProductType(code);
        return ApiResponse.success(null, "Product type deleted successfully");
    }

    @PostMapping("/{code}/attributes")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<TypeAttributeResponse> addAttribute(
            @PathVariable String code,
            @Valid @RequestBody TypeAttributeRequest request) {
        return ApiResponse.success(productTypeService.addAttribute(code, request), "Attribute added successfully");
    }

    @PutMapping("/{code}/attributes/{attributeKey}")
    public ApiResponse<TypeAttributeResponse> updateAttribute(
            @PathVariable String code,
            @PathVariable String attributeKey,
            @Valid @RequestBody TypeAttributeRequest request) {
        return ApiResponse.success(
                productTypeService.updateAttribute(code, attributeKey, request),
                "Attribute updated successfully");
    }

    @DeleteMapping("/{code}/attributes/{attributeKey}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public ApiResponse<Void> deleteAttribute(
            @PathVariable String code,
            @PathVariable String attributeKey) {
        productTypeService.deleteAttribute(code, attributeKey);
        return ApiResponse.success(null, "Attribute deleted successfully");
    }
}
