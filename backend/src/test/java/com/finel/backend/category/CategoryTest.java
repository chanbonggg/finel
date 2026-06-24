package com.finel.backend.category;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class CategoryTest {

    @Test
    void createsCategoryWithCompanyId() {
        Category category = Category.create("산업용", 1);

        assertThat(category.getName()).isEqualTo("산업용");
        assertThat(category.getCompanyId()).isEqualTo(1);
        assertThat(category.getProducts()).isEmpty();
    }
}
