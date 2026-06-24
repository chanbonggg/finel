package com.finel.backend.publicmeta.dto;

import java.util.List;
public record SitemapDataResponse(boolean success, List<ProductItem> products, List<CategoryItem> categories) {
    public record ProductItem(Integer id, String updatedAt) {}
    public record CategoryItem(Integer id) {}
}
