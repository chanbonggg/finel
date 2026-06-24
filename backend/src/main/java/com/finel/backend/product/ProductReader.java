package com.finel.backend.product;

import org.springframework.stereotype.Component;

@Component
public class ProductReader {
    private final ProductRepository repository;
    public ProductReader(ProductRepository repository) { this.repository = repository; }
    public long countByCategoryId(Integer categoryId) { return repository.countByCategoryId(categoryId); }
}
