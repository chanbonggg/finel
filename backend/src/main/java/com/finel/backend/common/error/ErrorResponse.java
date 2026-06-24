package com.finel.backend.common.error;

public record ErrorResponse(boolean success, String errorCode, String stage, String message) {
    public ErrorResponse(String message) { this(false, null, null, message); }
}
