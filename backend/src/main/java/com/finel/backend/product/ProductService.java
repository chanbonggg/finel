package com.finel.backend.product;

import com.finel.backend.category.Category;
import com.finel.backend.category.CategoryReader;
import com.finel.backend.catalog.CatalogReader;
import com.fasterxml.jackson.databind.JsonNode;
import com.finel.backend.product.dto.Specification;
import java.util.ArrayList;
import java.util.HashSet;
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
    private final CatalogReader catalogs;

    /** Kept for focused unit tests that do not boot a Spring application context. */
    public ProductService(ProductRepository repository, CategoryReader categoryReader) {
        this(repository, categoryReader, event -> { }, null);
    }

    @Autowired
    public ProductService(ProductRepository repository, CategoryReader categoryReader, ApplicationEventPublisher events, CatalogReader catalogs) {
        this.repository = repository;
        this.categoryReader = categoryReader;
        this.events = events;
        this.catalogs = catalogs;
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
        String name = requiredName(request.name());
        Category category = categoryReader.get(parseId(request.categoryId()));
        Product product = Product.create(
                name,
                category,
                request.spec() == null ? "" : databaseText(request.spec(), "spec").strip(),
                databaseText(request.description(), "description"),
                databaseText(request.imageUrl(), "imageUrl"));
        applyDetails(product, request.modelName(), request.useCase(), request.specifications(), request.catalogFileId(), request.catalogPage());
        product = repository.save(product);
        publishProductChanged(product.getId(), category.getId());
        return response(product);
    }

    @Transactional
    public ProductResponse update(Integer id, ProductUpdateRequest request) {
        String name = requiredName(request.name());
        Product product = repository.findWithCategoryById(id)
                .orElseThrow(() -> new NoSuchElementException("제품을 찾을 수 없습니다."));
        Category category = categoryForUpdate(product, request);
        product.update(
                name,
                category,
                request.spec() == null ? product.getSpec() : databaseText(request.spec(), "spec").strip(),
                databaseText(request.description(), "description"),
                databaseText(request.imageUrl(), "imageUrl"),
                request.isVisible());
        applyDetails(product, request.modelName(), request.useCase(), request.specifications(), request.catalogFileId(), request.catalogPage());
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

    private static String requiredName(JsonNode name) {
        if (name == null || !name.isTextual() || name.textValue().isBlank()) {
            throw new IllegalArgumentException("제품명은 비어 있지 않은 문자열이어야 합니다.");
        }
        return databaseText(name.textValue(), "name").strip();
    }

    private static String databaseText(String value, String field) {
        if (value != null && value.indexOf('\0') >= 0) {
            throw new IllegalArgumentException(field + "에 NUL 문자를 사용할 수 없습니다.");
        }
        return value;
    }

    private static void limit(String value, int max, String field) {
        if (value != null && value.length() > max) throw new IllegalArgumentException(field + "의 최대 길이는 " + max + "자입니다.");
    }

    private void applyDetails(Product product, JsonNode model, JsonNode useCase, JsonNode rows, JsonNode file, JsonNode page) {
        String modelName = text(model, product.getModelName(), 200, "modelName");
        String usage = text(useCase, product.getUseCase(), 10000, "useCase");
        List<Specification> specifications = rows == null ? product.getSpecifications() : specifications(rows);
        Integer fileId = integer(file, product.getCatalogFileId());
        Integer startPage = integer(page, product.getCatalogPage());
        if ((fileId == null) != (startPage == null)) throw new IllegalArgumentException("카탈로그 ID와 시작 페이지를 함께 지정하거나 해제하세요.");
        if (fileId != null && (file != null || page != null)) {
            var catalog = catalogs.get(fileId);
            if (startPage > catalog.getPageCount()) throw new IllegalArgumentException("카탈로그 페이지 범위를 벗어났습니다.");
        }
        product.updateDetails(modelName, usage, specifications, fileId, startPage);
    }

    private static String text(JsonNode value, String previous, int max, String field) {
        if (value == null) return previous;
        if (value.isNull()) return null;
        if (!value.isTextual()) throw new IllegalArgumentException(field + "는 문자열이어야 합니다.");
        limit(value.textValue(), max, field);
        String trimmed = databaseText(value.textValue(), field).strip();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private static Integer integer(JsonNode value, Integer previous) {
        if (value == null) return previous;
        if (value.isNull()) return null;
        if (!value.isIntegralNumber() || !value.canConvertToInt() || value.intValue() < 1) {
            throw new IllegalArgumentException("카탈로그 ID와 페이지는 양의 정수여야 합니다.");
        }
        return value.intValue();
    }

    private static List<Specification> specifications(JsonNode rows) {
        if (!rows.isArray() || rows.size() > 50) throw new IllegalArgumentException("상세 규격은 최대 50개의 배열이어야 합니다.");
        List<Specification> result = new ArrayList<>();
        var names = new HashSet<String>();
        for (JsonNode row : rows) {
            if (!row.isObject() || row.size() != 2 || !row.has("name") || !row.has("value")) {
                throw new IllegalArgumentException("상세 규격에는 name과 value만 필요합니다.");
            }
            String name = text(row.get("name"), null, 100, "specifications.name");
            String value = text(row.get("value"), null, 500, "specifications.value");
            if (name == null || value == null || !names.add(name)) {
                throw new IllegalArgumentException("상세 규격의 항목명과 값은 필수이며 항목명은 중복될 수 없습니다.");
            }
            result.add(new Specification(name, value));
        }
        return result;
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
                UtcDates.format(product.getUpdatedAt()),
                product.getModelName(), product.getUseCase(), product.getSpecifications(),
                product.getCatalogFileId(), product.getCatalogPage());
    }
}
