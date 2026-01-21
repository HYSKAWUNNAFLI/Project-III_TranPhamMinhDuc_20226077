package com.ecommerce.aims.product.validation;

import com.ecommerce.aims.common.exception.BusinessException;
import com.ecommerce.aims.product.models.TypeAttribute;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Map;

@Component
public class AttributeValidator {

    private static final DateTimeFormatter[] DATE_FORMATTERS = {
            DateTimeFormatter.ISO_LOCAL_DATE,           // yyyy-MM-dd
            DateTimeFormatter.ofPattern("yyyy/MM/dd"),
            DateTimeFormatter.ofPattern("dd-MM-yyyy"),
            DateTimeFormatter.ofPattern("dd/MM/yyyy"),
            DateTimeFormatter.ofPattern("MM-dd-yyyy"),
            DateTimeFormatter.ofPattern("MM/dd/yyyy")
    };

    public void validateAttributes(Map<String, Object> attributes, List<TypeAttribute> requiredAttributes) {
        if (attributes == null || attributes.isEmpty()) {
            if (requiredAttributes != null && !requiredAttributes.isEmpty()) {
                throw new BusinessException("Missing required attributes: " + 
                    requiredAttributes.stream()
                        .map(TypeAttribute::getKey)
                        .reduce((a, b) -> a + ", " + b)
                        .orElse(""));
            }
            return;
        }

        for (TypeAttribute attr : requiredAttributes) {
            if (!attributes.containsKey(attr.getKey()) || attributes.get(attr.getKey()) == null) {
                throw new BusinessException("Required attribute '" + attr.getLabel() + "' (" + attr.getKey() + ") is missing");
            }

            validateAttributeType(attr.getKey(), attributes.get(attr.getKey()), attr.getDataType(), attr.getLabel());
        }
    }

    private void validateAttributeType(String key, Object value, String dataType, String label) {
        if (value == null) {
            return;
        }

        switch (dataType.toLowerCase()) {
            case "string":
                if (!(value instanceof String)) {
                    throw new BusinessException("Attribute '" + label + "' must be a string");
                }
                break;

            case "integer":
                if (!(value instanceof Integer) && !(value instanceof Long)) {
                    try {
                        Integer.parseInt(value.toString());
                    } catch (NumberFormatException e) {
                        throw new BusinessException("Attribute '" + label + "' must be an integer");
                    }
                }
                break;

            case "decimal":
                if (!(value instanceof Number)) {
                    try {
                        Double.parseDouble(value.toString());
                    } catch (NumberFormatException e) {
                        throw new BusinessException("Attribute '" + label + "' must be a decimal number");
                    }
                }
                break;

            case "date":
                validateDate(value.toString(), label);
                break;

            case "boolean":
                if (!(value instanceof Boolean)) {
                    String strValue = value.toString().toLowerCase();
                    if (!strValue.equals("true") && !strValue.equals("false")) {
                        throw new BusinessException("Attribute '" + label + "' must be a boolean (true/false)");
                    }
                }
                break;

            case "array":
                if (!(value instanceof List)) {
                    throw new BusinessException("Attribute '" + label + "' must be an array");
                }
                break;

            case "json":
                if (!(value instanceof Map) && !(value instanceof List)) {
                    throw new BusinessException("Attribute '" + label + "' must be a valid JSON object or array");
                }
                break;

            default:
                // Allow unknown types to pass through
                break;
        }
    }

    private void validateDate(String dateStr, String label) {
        if (dateStr == null || dateStr.trim().isEmpty()) {
            throw new BusinessException("Attribute '" + label + "' date value is empty");
        }

        for (DateTimeFormatter formatter : DATE_FORMATTERS) {
            try {
                LocalDate.parse(dateStr, formatter);
                return; // Successfully parsed
            } catch (DateTimeParseException e) {
                // Try next formatter
            }
        }

        throw new BusinessException("Attribute '" + label + "' has invalid date format. " +
                "Supported formats: yyyy-MM-dd, yyyy/MM/dd, dd-MM-yyyy, dd/MM/yyyy, MM-dd-yyyy, MM/dd/yyyy");
    }

    public LocalDate parseDate(String dateStr) {
        if (dateStr == null || dateStr.trim().isEmpty()) {
            return null;
        }

        for (DateTimeFormatter formatter : DATE_FORMATTERS) {
            try {
                return LocalDate.parse(dateStr, formatter);
            } catch (DateTimeParseException e) {
                // Try next formatter
            }
        }

        throw new BusinessException("Invalid date format: " + dateStr);
    }
}
