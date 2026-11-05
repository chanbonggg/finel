package com.finel.backend.migration;

import static org.assertj.core.api.Assertions.assertThat;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@SpringBootTest
@Testcontainers(disabledWithoutDocker=true)
class FlywayBaselineIntegrationTest {
    @Container static final PostgreSQLContainer<?> POSTGRES=new PostgreSQLContainer<>("postgres:16-alpine");
    @DynamicPropertySource static void database(DynamicPropertyRegistry registry){
        registry.add("spring.datasource.url",POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username",POSTGRES::getUsername);
        registry.add("spring.datasource.password",POSTGRES::getPassword);
        registry.add("app.auth.jwt-secret",()->"test-only-secret-that-is-at-least-32-bytes");
        registry.add("spring.flyway.clean-disabled",()->"true");
    }
    @Autowired Flyway flyway;
    @Autowired com.finel.backend.product.ProductService products;
    @Autowired com.finel.backend.category.CategoryRepository categories;
    @Autowired com.finel.backend.catalog.CatalogRepository catalogs;
    @Autowired com.fasterxml.jackson.databind.ObjectMapper json;
    @Autowired jakarta.persistence.EntityManager entities;
    @Test void baselineMigratesAndJpaValidationStarts(){
        assertThat(flyway.info().pending()).isEmpty();
        assertThat(flyway.info().current().getVersion().getVersion()).isEqualTo("2");
        org.assertj.core.api.Assertions.assertThatThrownBy(flyway::clean).isInstanceOf(org.flywaydb.core.api.FlywayException.class);
    }

    @Test
    @org.springframework.transaction.annotation.Transactional
    void persistsOrderedSpecificationsAndSharesCatalogAcrossProducts() throws Exception {
        int categoryId = categories.saveAndFlush(com.finel.backend.category.Category.create("test category", 7)).getId();
        int catalogId = catalogs.saveAndFlush(com.finel.backend.catalog.CatalogFile.create("fixture.pdf", 10, 5)).getId();
        var createType = com.finel.backend.product.dto.ProductCreateRequest.class;
        var first = products.create(json.readValue("""
                {"name":"first", "categoryId":%d, "modelName":"model-m1", "useCase":"production line",
                "specifications":[{"name":"B","value":"2"},{"name":"A","value":"1"}],
                "catalogFileId":%d, "catalogPage":2}
                """.formatted(categoryId, catalogId), createType));
        var second = products.create(json.readValue("""
                {"name":"second", "categoryId":%d, "catalogFileId":%d, "catalogPage":5}
                """.formatted(categoryId, catalogId), createType));
        entities.flush();
        entities.clear();
        assertThat(products.get(first.id()).specifications()).extracting(row -> row.name()).containsExactly("B", "A");
        assertThat(products.search("MODEL-M1")).extracting(item -> item.id()).containsExactly(first.id());
        assertThat(products.search("production line")).extracting(item -> item.id()).containsExactly(first.id());
        products.update(first.id(), json.readValue("""
                {"name":"first", "catalogFileId":null, "catalogPage":null}
                """, com.finel.backend.product.dto.ProductUpdateRequest.class));
        entities.clear();
        assertThat(products.get(first.id()).catalogFileId()).isNull();
        assertThat(products.get(second.id()).catalogFileId()).isEqualTo(catalogId);
        assertThat(products.get(second.id()).catalogPage()).isEqualTo(5);
    }

    @Test void upgradesV1DataWithoutLosingExistingFieldsAndEnforcesCatalogConstraints() throws Exception {
        Flyway version1 = Flyway.configure().dataSource(POSTGRES.getJdbcUrl(), POSTGRES.getUsername(), POSTGRES.getPassword())
                .schemas("upgrade_fixture").defaultSchema("upgrade_fixture").target("1").load();
        version1.migrate();
        try (var connection = java.sql.DriverManager.getConnection(POSTGRES.getJdbcUrl(), POSTGRES.getUsername(), POSTGRES.getPassword());
                var statement = connection.createStatement()) {
            connection.setSchema("upgrade_fixture");
            statement.execute("INSERT INTO \"Category\" (id,name,\"companyId\") VALUES (1,'fixture',1)");
            statement.execute("INSERT INTO \"Product\" (id,name,\"categoryId\",spec,description,\"imageUrl\",\"updatedAt\") VALUES (1,'legacy',1,'original','description','',CURRENT_TIMESTAMP)");
            statement.execute("INSERT INTO \"Inquiry\" (id,name,email,content,product) VALUES (1,'fixture','','original body','legacy product')");
        }
        Flyway.configure().dataSource(POSTGRES.getJdbcUrl(), POSTGRES.getUsername(), POSTGRES.getPassword())
                .schemas("upgrade_fixture").defaultSchema("upgrade_fixture").load().migrate();
        try (var connection = java.sql.DriverManager.getConnection(POSTGRES.getJdbcUrl(), POSTGRES.getUsername(), POSTGRES.getPassword());
                var statement = connection.createStatement()) {
            connection.setSchema("upgrade_fixture");
            try (var result = statement.executeQuery("SELECT name,spec,\"modelName\",specifications::text,\"catalogFileId\" FROM \"Product\" WHERE id=1")) {
                assertThat(result.next()).isTrue();
                assertThat(result.getString(1)).isEqualTo("legacy");
                assertThat(result.getString(2)).isEqualTo("original");
                assertThat(result.getObject(3)).isNull();
                assertThat(result.getString(4)).isEqualTo("[]");
                assertThat(result.getObject(5)).isNull();
            }
            try (var result = statement.executeQuery("SELECT content,product,\"isRead\" FROM \"Inquiry\" WHERE id=1")) {
                assertThat(result.next()).isTrue();
                assertThat(result.getString(1)).isEqualTo("original body");
                assertThat(result.getString(2)).isEqualTo("legacy product");
                assertThat(result.getBoolean(3)).isFalse();
            }
            org.assertj.core.api.Assertions.assertThatThrownBy(() -> statement.executeUpdate("UPDATE \"Product\" SET \"catalogPage\"=1 WHERE id=1"))
                    .isInstanceOf(java.sql.SQLException.class);
            org.assertj.core.api.Assertions.assertThatThrownBy(() -> statement.executeUpdate("UPDATE \"Product\" SET specifications='{}'::jsonb WHERE id=1"))
                    .isInstanceOf(java.sql.SQLException.class);
            statement.execute("INSERT INTO \"CatalogFile\" (id,\"storageKey\",\"sizeBytes\",\"pageCount\") VALUES (1,'fixture.pdf',10,5)");
            statement.execute("UPDATE \"Product\" SET \"catalogFileId\"=1,\"catalogPage\"=2 WHERE id=1");
            org.assertj.core.api.Assertions.assertThatThrownBy(() -> statement.executeUpdate("DELETE FROM \"CatalogFile\" WHERE id=1"))
                    .isInstanceOf(java.sql.SQLException.class);
        }
    }
}
