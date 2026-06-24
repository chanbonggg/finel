package com.finel.backend.product.dto;

public record ProductCreateRequest(String name, String categoryId, String spec, String description, String imageUrl) {}
