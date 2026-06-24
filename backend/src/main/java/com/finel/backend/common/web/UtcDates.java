package com.finel.backend.common.web;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;

public final class UtcDates {
    private static final DateTimeFormatter FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
    private UtcDates() {}
    public static String format(LocalDateTime value) { return value.atOffset(ZoneOffset.UTC).format(FORMAT); }
}
