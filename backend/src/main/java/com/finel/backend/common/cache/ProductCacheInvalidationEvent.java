package com.finel.backend.common.cache;

public record ProductCacheInvalidationEvent(Integer productId, Integer categoryId) {
}
