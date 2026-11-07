package com.finel.backend.product.dto;

public record ProductResponse(Integer id, String name, Integer categoryId, String category, Integer companyId,
        String spec, String description, String imageUrl, Boolean isVisible, String createdAt, String updatedAt,
        String modelName, String useCase, java.util.List<Specification> specifications,
        Integer catalogFileId, Integer catalogPage) {}
