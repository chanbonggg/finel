package com.finel.backend.product;

import com.finel.backend.category.Category;
import com.finel.backend.category.CategoryReader;
import com.finel.backend.common.cache.ProductCacheInvalidationEvent;
import com.finel.backend.common.web.UtcDates;
import com.finel.backend.product.dto.ProductCreateRequest;
import com.finel.backend.product.dto.ProductResponse;
import com.finel.backend.product.dto.ProductUpdateRequest;
import java.util.List;
import java.util.NoSuchElementException;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.beans.factory.annotation.Autowired;

@Service
@Transactional(readOnly = true)
public class ProductService {
    private final ProductRepository repository;
    private final CategoryReader categoryReader;
    private final ApplicationEventPublisher events;
    /** Kept for focused unit tests that do not boot a Spring application context. */
    public ProductService(ProductRepository repository, CategoryReader categoryReader) {
        this(repository, categoryReader, event -> { });
    }
    @Autowired
    public ProductService(ProductRepository repository, CategoryReader categoryReader, ApplicationEventPublisher events) {
        this.repository = repository; this.categoryReader = categoryReader; this.events = events;
    }
    public List<ProductResponse> list(boolean includeHidden, Integer categoryId) {
        if (includeHidden && categoryId != null) throw new IllegalArgumentException("includeHidden과 categoryId를 함께 사용할 수 없습니다.");
        if (categoryId != null) {
            categoryReader.get(categoryId);
            return map(repository.findByCategoryIdAndIsVisibleTrueOrderByCreatedAtDesc(categoryId));
        }
        return map(includeHidden ? repository.findAllByOrderByCreatedAtDesc() : repository.findByIsVisibleTrueOrderByCreatedAtDesc());
    }
    public List<ProductResponse> featured(int limit) {
        int normalized = Math.min(Math.max(limit, 1), 12);
        return map(repository.findFeaturedVisibleProducts(PageRequest.of(0, normalized)));
    }
    public ProductResponse get(Integer id) {
        Product p = repository.findWithCategoryById(id).filter(Product::getIsVisible)
                .orElseThrow(() -> new NoSuchElementException("제품을 찾을 수 없습니다."));
        return response(p);
    }
    public List<ProductResponse> search(String query) {
        String q = query == null ? "" : query.trim();
        return q.isEmpty() ? List.of() : map(repository.searchVisibleProducts(q, PageRequest.of(0, 10)));
    }
    @Transactional
    public ProductResponse create(ProductCreateRequest request) {
        validate(request.name(), request.spec());
        Category category = categoryReader.get(parseId(request.categoryId()));
        Product product = repository.save(Product.create(request.name().trim(), category, request.spec().trim(), request.description(), request.imageUrl()));
        events.publishEvent(new ProductCacheInvalidationEvent(product.getId(), category.getId()));
        return response(product);
    }
    @Transactional
    public ProductResponse update(Integer id, ProductUpdateRequest request) {
        validate(request.name(), request.spec());
        Product product = repository.findWithCategoryById(id).orElseThrow(() -> new NoSuchElementException("제품을 찾을 수 없습니다."));
        Category category = request.categoryId() == null ? product.getCategory() : categoryReader.get(parseId(request.categoryId()));
        product.update(request.name().trim(), category, request.spec().trim(), request.description(), request.imageUrl(), request.isVisible());
        repository.flush();
        events.publishEvent(new ProductCacheInvalidationEvent(product.getId(), category.getId()));
        return response(product);
    }
    @Transactional public void delete(Integer id) {
        Product product = repository.findById(id).orElseThrow(() -> new NoSuchElementException("제품을 찾을 수 없습니다."));
        Integer categoryId = product.getCategory().getId();
        repository.delete(product);
        events.publishEvent(new ProductCacheInvalidationEvent(id, categoryId));
    }
    private static void validate(String name, String spec) {
        if (name == null || name.isBlank() || spec == null || spec.isBlank()) throw new IllegalArgumentException("제품명, 카테고리, 사양은 필수입니다.");
    }
    private static Integer parseId(String id) {
        if (id == null || id.isBlank()) throw new IllegalArgumentException("카테고리는 필수입니다.");
        try { return Integer.valueOf(id); } catch (NumberFormatException e) { throw new IllegalArgumentException("카테고리 ID가 올바르지 않습니다."); }
    }
    private static List<ProductResponse> map(List<Product> products) { return products.stream().map(ProductService::response).toList(); }
    private static ProductResponse response(Product p) {
        Category c = p.getCategory();
        return new ProductResponse(p.getId(), p.getName(), c.getId(), c.getName(), c.getCompanyId(), p.getSpec(),
                p.getDescription(), p.getImageUrl(), p.getIsVisible(), UtcDates.format(p.getCreatedAt()), UtcDates.format(p.getUpdatedAt()));
    }
}
