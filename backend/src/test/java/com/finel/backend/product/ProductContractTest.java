package com.finel.backend.product;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

import com.finel.backend.category.Category;
import com.finel.backend.category.CategoryReader;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.test.util.ReflectionTestUtils;

class ProductContractTest {
    @Test
    void publicListUsesVisibleOnlyRepositoryAndReturnsFlatCategoryFields() {
        ProductRepository repository = mock(ProductRepository.class);
        CategoryReader categories = mock(CategoryReader.class);
        Category category = Category.create("산업용", 1);
        ReflectionTestUtils.setField(category, "id", 10);
        Product product = Product.create("제품", category, "사양", "설명", "image");
        ReflectionTestUtils.setField(product, "id", 2);
        product.prePersist();
        when(repository.findByIsVisibleTrueOrderByCreatedAtDesc()).thenReturn(List.of(product));

        var result = new ProductService(repository, categories).list(false, null);

        assertThat(result).singleElement().satisfies(item -> {
            assertThat(item.categoryId()).isEqualTo(10);
            assertThat(item.category()).isEqualTo("산업용");
            assertThat(item.companyId()).isEqualTo(1);
            assertThat(item.isVisible()).isTrue();
        });
        verify(repository).findByIsVisibleTrueOrderByCreatedAtDesc();
        verify(repository, never()).findAllByOrderByCreatedAtDesc();
    }

    @Test
    void hiddenDetailIsNotPubliclyReadable() {
        ProductRepository repository = mock(ProductRepository.class);
        Product hidden = Product.create("숨김", Category.create("카테고리", 1), "사양", "", "");
        hidden.update("숨김", hidden.getCategory(), "사양", "", "", false);
        when(repository.findWithCategoryById(9)).thenReturn(Optional.of(hidden));

        assertThatThrownBy(() -> new ProductService(repository, mock(CategoryReader.class)).get(9))
                .isInstanceOf(java.util.NoSuchElementException.class);
    }

    @Test
    void includeHiddenRequiresAuthenticatedAdministratorAtControllerBoundary() {
        ProductController controller = new ProductController(mock(ProductService.class));

        assertThatThrownBy(() -> controller.list(true, null, null))
                .isInstanceOf(AuthenticationCredentialsNotFoundException.class);
    }

    @Test
    void includeHiddenAndCategoryCannotBeCombined() {
        ProductService service = new ProductService(mock(ProductRepository.class), mock(CategoryReader.class));
        assertThatThrownBy(() -> service.list(true, 1)).isInstanceOf(IllegalArgumentException.class);
    }
}
