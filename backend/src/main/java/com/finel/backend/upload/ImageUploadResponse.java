package com.finel.backend.upload;

public record ImageUploadResponse(boolean success, String secureUrl, String publicId) {}
