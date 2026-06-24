package com.finel.backend.product.dto;

public record ProductUpdateRequest(String name, String categoryId, String spec, String description, String imageUrl, Boolean isVisible) {}
