package com.finel.backend.product.dto;

import com.fasterxml.jackson.databind.JsonNode;

public record ProductCreateRequest(JsonNode name, String categoryId, String spec, String description, String imageUrl,
        JsonNode modelName, JsonNode useCase, JsonNode specifications, JsonNode catalogFileId, JsonNode catalogPage) {}
