package com.finel.backend.common.web;

public record ApiResponse(boolean success, String message) {
    public static ApiResponse ok(String message) { return new ApiResponse(true, message); }
}
