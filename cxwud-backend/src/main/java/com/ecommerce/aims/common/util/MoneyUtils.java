package com.ecommerce.aims.common.util;

import java.math.BigDecimal;
import java.math.RoundingMode;

public final class MoneyUtils {
    private static final BigDecimal VAT_RATE = new BigDecimal("0.10");

    private MoneyUtils() {
    }

    public static BigDecimal applyVat(BigDecimal amount) {
        if (amount == null) {
            return BigDecimal.ZERO;
        }
        return amount.multiply(BigDecimal.ONE.add(VAT_RATE)).setScale(2, RoundingMode.HALF_UP);
    }

    public static boolean isWithinPriceRule(BigDecimal originalValue, BigDecimal currentPrice) {
        if (originalValue == null || currentPrice == null || originalValue.signum() <= 0) {
            return false;
        }
        BigDecimal lowerBound = originalValue.multiply(new BigDecimal("0.30"));
        BigDecimal upperBound = originalValue.multiply(new BigDecimal("1.50"));
        return currentPrice.compareTo(lowerBound) >= 0 && currentPrice.compareTo(upperBound) <= 0;
    }
}
