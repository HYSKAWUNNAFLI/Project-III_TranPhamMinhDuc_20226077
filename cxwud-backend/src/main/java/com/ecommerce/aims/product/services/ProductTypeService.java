package com.ecommerce.aims.product.services;

import com.ecommerce.aims.common.exception.BusinessException;
import com.ecommerce.aims.common.exception.NotFoundException;
import com.ecommerce.aims.product.dto.*;
import com.ecommerce.aims.product.models.ProductType;
import com.ecommerce.aims.product.models.TypeAttribute;
import com.ecommerce.aims.product.repository.IProductTypeRepository;
import com.ecommerce.aims.product.repository.ITypeAttributeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductTypeService {

    private final IProductTypeRepository productTypeRepository;
    private final ITypeAttributeRepository typeAttributeRepository;

    @Transactional(readOnly = true)
    public List<ProductTypeResponse> getAllProductTypes() {
        return productTypeRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ProductTypeResponse getProductTypeByCode(String code) {
        ProductType productType = productTypeRepository.findByCodeIgnoreCase(code)
                .orElseThrow(() -> new NotFoundException("Product type not found: " + code));
        return toResponse(productType);
    }

    @Transactional(readOnly = true)
    public ProductTypeResponse getProductTypeById(Long id) {
        ProductType productType = productTypeRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Product type not found with id: " + id));
        return toResponse(productType);
    }

    @Transactional
    public ProductTypeResponse createProductType(CreateProductTypeRequest request) {
        // Check if product type already exists
        if (productTypeRepository.findByCodeIgnoreCase(request.getCode()).isPresent()) {
            throw new BusinessException("Product type with code '" + request.getCode() + "' already exists");
        }

        ProductType productType = new ProductType();
        productType.setCode(request.getCode().toUpperCase());

        // Create attributes
        for (TypeAttributeRequest attrRequest : request.getAttributes()) {
            TypeAttribute attribute = new TypeAttribute();
            attribute.setProductType(productType);
            attribute.setKey(attrRequest.getKey());
            attribute.setLabel(attrRequest.getLabel());
            attribute.setDataType(attrRequest.getDataType());
            attribute.setRequired(attrRequest.getIsRequired());
            productType.getAttributes().add(attribute);
        }

        ProductType saved = productTypeRepository.save(productType);
        return toResponse(saved);
    }

    @Transactional
    public ProductTypeResponse updateProductType(String code, ProductTypeRequest request) {
        ProductType productType = productTypeRepository.findByCodeIgnoreCase(code)
                .orElseThrow(() -> new NotFoundException("Product type not found: " + code));

        // Check if new code conflicts with existing product type
        if (!productType.getCode().equalsIgnoreCase(request.getCode())) {
            if (productTypeRepository.findByCodeIgnoreCase(request.getCode()).isPresent()) {
                throw new BusinessException("Product type with code '" + request.getCode() + "' already exists");
            }
            productType.setCode(request.getCode().toUpperCase());
        }

        ProductType saved = productTypeRepository.save(productType);
        return toResponse(saved);
    }

    @Transactional
    public void deleteProductType(String code) {
        ProductType productType = productTypeRepository.findByCodeIgnoreCase(code)
                .orElseThrow(() -> new NotFoundException("Product type not found: " + code));

        // Check if any products are using this type
        // This would require a query to the Product repository
        // For now, we'll allow deletion (cascade will handle it)

        productTypeRepository.delete(productType);
    }

    @Transactional
    public TypeAttributeResponse addAttribute(String typeCode, TypeAttributeRequest request) {
        ProductType productType = productTypeRepository.findByCodeIgnoreCase(typeCode)
                .orElseThrow(() -> new NotFoundException("Product type not found: " + typeCode));

        // Check if attribute key already exists for this type
        boolean exists = productType.getAttributes().stream()
                .anyMatch(attr -> attr.getKey().equals(request.getKey()));

        if (exists) {
            throw new BusinessException("Attribute with key '" + request.getKey() + "' already exists for this product type");
        }

        TypeAttribute attribute = new TypeAttribute();
        attribute.setProductType(productType);
        attribute.setKey(request.getKey());
        attribute.setLabel(request.getLabel());
        attribute.setDataType(request.getDataType());
        attribute.setRequired(request.getIsRequired());

        TypeAttribute saved = typeAttributeRepository.save(attribute);
        return toAttributeResponse(saved);
    }

    @Transactional
    public TypeAttributeResponse updateAttribute(String typeCode, String attributeKey, TypeAttributeRequest request) {
        ProductType productType = productTypeRepository.findByCodeIgnoreCase(typeCode)
                .orElseThrow(() -> new NotFoundException("Product type not found: " + typeCode));

        TypeAttribute attribute = productType.getAttributes().stream()
                .filter(attr -> attr.getKey().equals(attributeKey))
                .findFirst()
                .orElseThrow(() -> new NotFoundException("Attribute not found: " + attributeKey));

        // If key is being changed, check for conflicts
        if (!attribute.getKey().equals(request.getKey())) {
            boolean exists = productType.getAttributes().stream()
                    .anyMatch(attr -> attr.getKey().equals(request.getKey()));
            if (exists) {
                throw new BusinessException("Attribute with key '" + request.getKey() + "' already exists for this product type");
            }
            attribute.setKey(request.getKey());
        }

        attribute.setLabel(request.getLabel());
        attribute.setDataType(request.getDataType());
        attribute.setRequired(request.getIsRequired());

        TypeAttribute saved = typeAttributeRepository.save(attribute);
        return toAttributeResponse(saved);
    }

    @Transactional
    public void deleteAttribute(String typeCode, String attributeKey) {
        ProductType productType = productTypeRepository.findByCodeIgnoreCase(typeCode)
                .orElseThrow(() -> new NotFoundException("Product type not found: " + typeCode));

        TypeAttribute attribute = productType.getAttributes().stream()
                .filter(attr -> attr.getKey().equals(attributeKey))
                .findFirst()
                .orElseThrow(() -> new NotFoundException("Attribute not found: " + attributeKey));

        typeAttributeRepository.delete(attribute);
    }

    private ProductTypeResponse toResponse(ProductType productType) {
        List<TypeAttributeResponse> attributes = productType.getAttributes().stream()
                .map(this::toAttributeResponse)
                .collect(Collectors.toList());

        return ProductTypeResponse.builder()
                .id(productType.getId())
                .code(productType.getCode())
                .attributes(attributes)
                .build();
    }

    private TypeAttributeResponse toAttributeResponse(TypeAttribute attribute) {
        return TypeAttributeResponse.builder()
                .id(attribute.getId())
                .key(attribute.getKey())
                .label(attribute.getLabel())
                .dataType(attribute.getDataType())
                .isRequired(attribute.isRequired())
                .build();
    }
}
