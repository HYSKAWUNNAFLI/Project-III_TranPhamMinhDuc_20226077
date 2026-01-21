package com.ecommerce.aims.common.util;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

public final class DateTimeUtils {
    private static final DateTimeFormatter ISO_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    private DateTimeUtils() {
    }

    public static String formatIso(LocalDateTime time) {
        return time == null ? null : time.format(ISO_FORMATTER);
    }

    public static LocalDateTime nowUtc() {
        return LocalDateTime.now(ZoneId.of("UTC"));
    }
}
