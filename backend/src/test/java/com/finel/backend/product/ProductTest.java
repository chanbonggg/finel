package com.finel.backend.product;

import static org.assertj.core.api.Assertions.assertThat;

import com.finel.backend.category.Category;
import java.time.LocalDateTime;
import org.junit.jupiter.api.Test;

class ProductTest {

    @Test
    void createsProductWithPrismaCompatibleDefaults() {
        Category category = Category.create("산업용", 1);
        Product product = Product.create("제품 A", category, "사양", null, null);

        product.prePersist();

        assertThat(product.getName()).isEqualTo("제품 A");
        assertThat(product.getCategory()).isSameAs(category);
        assertThat(product.getDescription()).isEmpty();
        assertThat(product.getImageUrl()).isEmpty();
        assertThat(product.getIsVisible()).isTrue();
        assertThat(product.getCreatedAt()).isNotNull();
        assertThat(product.getUpdatedAt()).isNotNull();
    }

    @Test
    void updatesFieldsAndUpdatedAt() {
        Category initialCategory = Category.create("기존", 1);
        Category changedCategory = Category.create("변경", 1);
        Product product = Product.create("기존 제품", initialCategory, "기존 사양", "설명", "image");
        product.prePersist();
        LocalDateTime createdAt = product.getCreatedAt();

        product.update("변경 제품", changedCategory, "변경 사양", null, null, false);
        product.preUpdate();

        assertThat(product.getName()).isEqualTo("변경 제품");
        assertThat(product.getCategory()).isSameAs(changedCategory);
        assertThat(product.getDescription()).isEmpty();
        assertThat(product.getImageUrl()).isEmpty();
        assertThat(product.getIsVisible()).isFalse();
        assertThat(product.getCreatedAt()).isEqualTo(createdAt);
        assertThat(product.getUpdatedAt()).isNotNull();
    }
}
