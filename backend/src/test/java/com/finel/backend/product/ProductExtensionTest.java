package com.finel.backend.product;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.finel.backend.catalog.*;
import com.finel.backend.category.*;
import com.finel.backend.product.dto.*;
import java.util.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

class ProductExtensionTest {
    final ObjectMapper json = new ObjectMapper();
    final ProductRepository repository = mock(ProductRepository.class);
    final CategoryReader categories = mock(CategoryReader.class);
    final CatalogReader catalogs = mock(CatalogReader.class);
    final ProductService service = new ProductService(repository, categories, event -> {}, catalogs);
    Product product;

    @BeforeEach void setup() {
        Category category = Category.create("category", 7);
        ReflectionTestUtils.setField(category, "id", 2);
        product = Product.create("old", category, "old spec", "", "");
        product.prePersist();
        product.updateDetails("old model", "old usage", List.of(new Specification("Pressure", "10")), 4, 2);
        ReflectionTestUtils.setField(product, "id", 1);
        when(repository.findWithCategoryById(1)).thenReturn(Optional.of(product));
        when(categories.get(2)).thenReturn(category);
        when(repository.save(any())).thenAnswer(call -> {
            Product saved = call.getArgument(0);
            saved.prePersist();
            return saved;
        });
    }

    @Test void legacyUpdatePreservesEveryNewFieldAndHiddenState() throws Exception {
        product.update("old", product.getCategory(), "old spec", "", "", false);
        var request = json.readValue("""
                {"name":"changed","categoryId":2,"spec":""}
                """, ProductUpdateRequest.class);
        var result = service.update(1, request);
        assertThat(result.modelName()).isEqualTo("old model");
        assertThat(result.useCase()).isEqualTo("old usage");
        assertThat(result.specifications()).containsExactly(new Specification("Pressure", "10"));
        assertThat(result.catalogFileId()).isEqualTo(4);
        assertThat(result.catalogPage()).isEqualTo(2);
        assertThat(result.spec()).isEmpty();
        assertThat(result.isVisible()).isFalse();
        assertThat(result.companyId()).isEqualTo(7);
        verifyNoInteractions(catalogs);
    }

    @Test void explicitNullAndEmptyArrayClearOptionsButMissingSpecIsPreserved() throws Exception {
        var request = json.readValue("""
                {"name":"changed","modelName":null,"useCase":"  ","specifications":[],"catalogFileId":null,"catalogPage":null}
                """, ProductUpdateRequest.class);
        assertThat(request.modelName()).isNotNull();
        var result = service.update(1, request);
        assertThat(result.modelName()).isNull();
        assertThat(result.useCase()).isNull();
        assertThat(result.specifications()).isEmpty();
        assertThat(result.catalogFileId()).isNull();
        assertThat(result.catalogPage()).isNull();
        assertThat(result.spec()).isEqualTo("old spec");
    }

    @Test void creationOnlyNeedsNameAndCategoryAndPreservesSpecificationOrder() throws Exception {
        var result = service.create(json.readValue("""
                {"name":"new","categoryId":"2","modelName":" M1 ","specifications":[{"name":"B","value":"2"},{"name":"A","value":"1"}]}
                """, ProductCreateRequest.class));
        assertThat(result.spec()).isEmpty();
        assertThat(result.modelName()).isEqualTo("M1");
        assertThat(result.specifications()).extracting(Specification::name).containsExactly("B", "A");
        assertThat(result.catalogFileId()).isNull();
    }

    @Test void rejectsMalformedRowsTypesDuplicatesAndOverlongValues() throws Exception {
        for (String rows : List.of("null", "{}", "[{\"name\":\"x\",\"value\":\"\"}]",
                "[{\"name\":\"x\",\"value\":\"1\"},{\"name\":\" x \",\"value\":\"2\"}]",
                "[{\"name\":\"x\",\"value\":\"1\",\"extra\":true}]")) {
            var request = json.readValue("{\"name\":\"n\",\"specifications\":" + rows + "}", ProductUpdateRequest.class);
            assertThatThrownBy(() -> service.update(1, request)).isInstanceOf(IllegalArgumentException.class);
        }
        var request = json.readValue("{\"name\":\"n\",\"modelName\":true}", ProductUpdateRequest.class);
        assertThatThrownBy(() -> service.update(1, request)).isInstanceOf(IllegalArgumentException.class);
        var longRequest = json.readValue("{\"name\":\"n\",\"useCase\":\"" + "a".repeat(10001) + "\"}", ProductUpdateRequest.class);
        assertThatThrownBy(() -> service.update(1, longRequest)).isInstanceOf(IllegalArgumentException.class);
    }

    @Test void rejectsNumericNamesAndNulBeforeWritingTextOrJsonb() throws Exception {
        for (String input : List.of("{\"name\":42}", "{\"name\":\"n\",\"modelName\":\"m\\u0000\"}",
                "{\"name\":\"n\",\"specifications\":[{\"name\":\"a\",\"value\":\"b\\u0000\"}]}")) {
            var request = json.readValue(input, ProductUpdateRequest.class);
            assertThatThrownBy(() -> service.update(1, request)).isInstanceOf(IllegalArgumentException.class);
        }
        verify(repository, never()).flush();
    }

    @Test void validatesCatalogPageAndDoesNotChangeSharedCatalog() throws Exception {
        CatalogFile file = CatalogFile.create(UUID.randomUUID() + ".pdf", 100, 10);
        when(catalogs.get(4)).thenReturn(file);
        var request = json.readValue("{\"name\":\"n\",\"catalogPage\":10}", ProductUpdateRequest.class);
        assertThat(service.update(1, request).catalogPage()).isEqualTo(10);
        assertThat(file.getPageCount()).isEqualTo(10);
        var outside = json.readValue("{\"name\":\"n\",\"catalogPage\":11}", ProductUpdateRequest.class);
        assertThatThrownBy(() -> service.update(1, outside)).isInstanceOf(IllegalArgumentException.class);
        var half = json.readValue("{\"name\":\"n\",\"catalogFileId\":null}", ProductUpdateRequest.class);
        assertThatThrownBy(() -> service.update(1, half)).isInstanceOf(IllegalArgumentException.class);
        when(catalogs.get(999)).thenThrow(new NoSuchElementException());
        var missing = json.readValue("{\"name\":\"n\",\"catalogFileId\":999}", ProductUpdateRequest.class);
        assertThatThrownBy(() -> service.update(1, missing)).isInstanceOf(NoSuchElementException.class);
    }
}
