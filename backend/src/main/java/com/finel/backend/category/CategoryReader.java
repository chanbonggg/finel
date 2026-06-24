package com.finel.backend.category;

import java.util.NoSuchElementException;
import org.springframework.stereotype.Component;

@Component
public class CategoryReader {
    private final CategoryRepository repository;
    public CategoryReader(CategoryRepository repository) { this.repository = repository; }
    public Category get(Integer id) {
        return repository.findById(id).orElseThrow(() -> new NoSuchElementException("카테고리를 찾을 수 없습니다."));
    }
}
