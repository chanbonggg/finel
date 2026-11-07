package com.finel.backend.catalog;

import java.util.NoSuchElementException;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Transactional(readOnly = true)
public class CatalogReader {
    private final CatalogRepository repository;

    public CatalogReader(CatalogRepository repository) {
        this.repository = repository;
    }

    public CatalogFile get(Integer id) {
        return repository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("카탈로그를 찾을 수 없습니다."));
    }
}
