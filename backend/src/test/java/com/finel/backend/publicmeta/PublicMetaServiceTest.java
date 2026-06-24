package com.finel.backend.publicmeta;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.finel.backend.category.CategoryRepository;
import com.finel.backend.product.ProductRepository;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.Test;

class PublicMetaServiceTest {
    @Test
    void returnsMinimalStableSitemapContract() {
        ProductRepository products = mock(ProductRepository.class);
        CategoryRepository categories = mock(CategoryRepository.class);
        ProductRepository.SitemapProjection product = mock(ProductRepository.SitemapProjection.class);
        CategoryRepository.SitemapProjection category = mock(CategoryRepository.SitemapProjection.class);
        when(product.getId()).thenReturn(7);
        when(product.getUpdatedAt()).thenReturn(LocalDateTime.of(2026, 5, 27, 10, 0));
        when(category.getId()).thenReturn(3);
        when(products.findVisibleSitemapItems()).thenReturn(List.of(product));
        when(categories.findAllSitemapItems()).thenReturn(List.of(category));

        var response = new PublicMetaService(products, categories).get();

        assertThat(response.success()).isTrue();
        assertThat(response.products()).singleElement().satisfies(item -> {
            assertThat(item.id()).isEqualTo(7);
            assertThat(item.updatedAt()).isEqualTo("2026-05-27T10:00:00.000Z");
        });
        assertThat(response.categories()).singleElement().satisfies(item -> assertThat(item.id()).isEqualTo(3));
    }
}
