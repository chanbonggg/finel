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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class ProductService {
    private static final int MIN_FEATURED_LIMIT = 1;
    private static final int MAX_FEATURED_LIMIT = 12;
    private static final int SEARCH_LIMIT = 10;

    private final ProductRepository repository;
    private final CategoryReader categoryReader;
    private final ApplicationEventPublisher events;

    /** Kept for focused unit tests that do not boot a Spring application context. */
    public ProductService(ProductRepository repository, CategoryReader categoryReader) {
        this(repository, categoryReader, event -> { });
    }

    @Autowired
    public ProductService(ProductRepository repository, CategoryReader categoryReader, ApplicationEventPublisher events) {
        this.repository = repository;
        this.categoryReader = categoryReader;
        this.events = events;
    }

    public List<ProductResponse> list(boolean includeHidden, Integer categoryId) {
        if (includeHidden && categoryId != null) {
            throw new IllegalArgumentException("includeHidden과 categoryId를 함께 사용할 수 없습니다.");
        }

        if (categoryId != null) {
            categoryReader.get(categoryId);
            return map(repository.findByCategoryIdAndIsVisibleTrueOrderByCreatedAtDesc(categoryId));
        }

        if (includeHidden) {
            return map(repository.findAllByOrderByCreatedAtDesc());
        }

        return map(repository.findByIsVisibleTrueOrderByCreatedAtDesc());
    }

    public List<ProductResponse> featured(int limit) {
        int normalized = Math.min(Math.max(limit, MIN_FEATURED_LIMIT), MAX_FEATURED_LIMIT);
        return map(repository.findFeaturedVisibleProducts(PageRequest.of(0, normalized)));
    }

    public ProductResponse get(Integer id) {
        Product product = repository.findWithCategoryById(id)
                .filter(Product::getIsVisible)
                .orElseThrow(() -> new NoSuchElementException("제품을 찾을 수 없습니다."));
        return response(product);
    }

    public List<ProductResponse> search(String query) {
        String normalizedQuery = query == null ? "" : query.trim();
        if (normalizedQuery.isEmpty()) {
            return List.of();
        }
        return map(repository.searchVisibleProducts(normalizedQuery, PageRequest.of(0, SEARCH_LIMIT)));
    }

    @Transactional
    public ProductResponse create(ProductCreateRequest request) {
        validateRequiredFields(request.name(), request.spec());
        Category category = categoryReader.get(parseId(request.categoryId()));
        Product product = repository.save(Product.create(
                request.name().trim(),
                category,
                request.spec().trim(),
                request.description(),
                request.imageUrl()));
        publishProductChanged(product.getId(), category.getId());
        return response(product);
    }

    @Transactional
    public ProductResponse update(Integer id, ProductUpdateRequest request) {
        validateRequiredFields(request.name(), request.spec());
        Product product = repository.findWithCategoryById(id)
                .orElseThrow(() -> new NoSuchElementException("제품을 찾을 수 없습니다."));
        Category category = categoryForUpdate(product, request);
        product.update(
                request.name().trim(),
                category,
                request.spec().trim(),
                request.description(),
                request.imageUrl(),
                request.isVisible());
        repository.flush();
        publishProductChanged(product.getId(), category.getId());
        return response(product);
    }

    @Transactional
    public void delete(Integer id) {
        Product product = repository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("제품을 찾을 수 없습니다."));
        Integer categoryId = product.getCategory().getId();
        repository.delete(product);
        publishProductChanged(id, categoryId);
    }

    private Category categoryForUpdate(Product product, ProductUpdateRequest request) {
        if (request.categoryId() == null) {
            return product.getCategory();
        }
        return categoryReader.get(parseId(request.categoryId()));
    }

    private void publishProductChanged(Integer productId, Integer categoryId) {
        events.publishEvent(new ProductCacheInvalidationEvent(productId, categoryId));
    }

    private static void validateRequiredFields(String name, String spec) {
        if (name == null || name.isBlank() || spec == null || spec.isBlank()) {
            throw new IllegalArgumentException("제품명, 카테고리, 사양은 필수입니다.");
        }
    }

    private static Integer parseId(String id) {
        if (id == null || id.isBlank()) {
            throw new IllegalArgumentException("카테고리는 필수입니다.");
        }

        try {
            return Integer.valueOf(id);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("카테고리 ID가 올바르지 않습니다.");
        }
    }

    private static List<ProductResponse> map(List<Product> products) {
        return products.stream().map(ProductService::response).toList();
    }

    private static ProductResponse response(Product product) {
        Category category = product.getCategory();
        return new ProductResponse(
                product.getId(),
                product.getName(),
                category.getId(),
                category.getName(),
                category.getCompanyId(),
                product.getSpec(),
                product.getDescription(),
                product.getImageUrl(),
                product.getIsVisible(),
                UtcDates.format(product.getCreatedAt()),
                UtcDates.format(product.getUpdatedAt()));
    }
}
