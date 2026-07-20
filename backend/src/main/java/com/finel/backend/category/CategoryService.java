package com.finel.backend.category;

import com.finel.backend.category.dto.CategoryCreateRequest;
import com.finel.backend.category.dto.CategoryResponse;
import com.finel.backend.common.error.DuplicateResourceException;
import com.finel.backend.common.cache.CategoryCacheInvalidationEvent;
import com.finel.backend.product.ProductReader;
import java.util.List;
import java.util.NoSuchElementException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.context.ApplicationEventPublisher;

@Service
@Transactional(readOnly = true)
public class CategoryService {
    private final CategoryRepository repository;
    private final ProductReader productReader;
    private final ApplicationEventPublisher events;
    public CategoryService(CategoryRepository repository, ProductReader productReader, ApplicationEventPublisher events) { this.repository=repository; this.productReader=productReader; this.events=events; }
    public List<CategoryResponse> list(Integer companyId) {
        if (companyId == null) throw new IllegalArgumentException("companyId는 필수입니다.");
        return repository.findByCompanyIdOrderByNameAsc(companyId).stream().map(CategoryService::response).toList();
    }
    public CategoryResponse get(Integer id) { return response(find(id)); }
    @Transactional public CategoryResponse create(CategoryCreateRequest request) {
        if (request.name()==null || request.name().isBlank() || request.companyId()==null) throw new IllegalArgumentException("카테고리명과 회사는 필수입니다.");
        String name=request.name().trim();
        if(repository.existsByNameAndCompanyId(name,request.companyId())) throw new DuplicateResourceException("이미 존재하는 카테고리입니다.");
        Category category = repository.save(Category.create(name,request.companyId()));
        events.publishEvent(new CategoryCacheInvalidationEvent(category.getId()));
        return response(category);
    }
    @Transactional public void delete(Integer id) {
        Category category=find(id);
        if(productReader.countByCategoryId(id)>0) throw new IllegalArgumentException("해당 카테고리에 속한 제품이 있어 삭제할 수 없습니다.");
        repository.delete(category);
        events.publishEvent(new CategoryCacheInvalidationEvent(id));
    }
    private Category find(Integer id) { return repository.findById(id).orElseThrow(()->new NoSuchElementException("카테고리를 찾을 수 없습니다.")); }
    private static CategoryResponse response(Category c) { return new CategoryResponse(c.getId(),c.getName(),c.getCompanyId()); }
}
