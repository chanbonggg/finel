package com.finel.backend.catalog;

import com.finel.backend.common.web.UtcDates;

public record CatalogResponse(Integer id, long sizeBytes, int pageCount, String createdAt) {
    static CatalogResponse from(CatalogFile file) {
        return new CatalogResponse(file.getId(), file.getSizeBytes(), file.getPageCount(),
                UtcDates.format(file.getCreatedAt()));
    }
}
