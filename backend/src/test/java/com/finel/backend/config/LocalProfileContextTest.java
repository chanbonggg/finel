package com.finel.backend.config;

import static org.assertj.core.api.Assertions.assertThat;
import com.finel.backend.auth.AdminRepository;
import com.finel.backend.product.ProductRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@ActiveProfiles("local")
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
class LocalProfileContextTest {
    @Autowired AdminRepository admins;
    @Autowired ProductRepository products;
    @Test void startsWithoutDatasourceOrExternalJwtSecret() {
        assertThat(admins.findByUsername("missing")).isEmpty();
        assertThat(products.findByIsVisibleTrueOrderByCreatedAtDesc()).isEmpty();
    }
}
