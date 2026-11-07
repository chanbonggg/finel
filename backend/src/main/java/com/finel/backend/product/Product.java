package com.finel.backend.product;

import com.finel.backend.category.Category;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.Clock;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.util.List;
import com.finel.backend.product.dto.Specification;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Getter
@Entity
@Table(name = "\"Product\"")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @Column(name = "name", nullable = false)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "\"categoryId\"", nullable = false)
    private Category category;

    @Column(name = "spec", nullable = false)
    private String spec;

    @Column(name = "\"modelName\"", columnDefinition = "TEXT")
    private String modelName;

    @Column(name = "\"useCase\"", columnDefinition = "TEXT")
    private String useCase;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "specifications", nullable = false, columnDefinition = "jsonb")
    private List<Specification> specifications = List.of();

    @Column(name = "\"catalogFileId\"")
    private Integer catalogFileId;

    @Column(name = "\"catalogPage\"")
    private Integer catalogPage;

    @Column(name = "description", nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "\"imageUrl\"", nullable = false)
    private String imageUrl;

    @Column(name = "\"isVisible\"", nullable = false)
    private Boolean isVisible = true;

    @Column(name = "\"createdAt\"", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "\"updatedAt\"", nullable = false)
    private LocalDateTime updatedAt;

    public static Product create(
            String name,
            Category category,
            String spec,
            String description,
            String imageUrl) {
        Product product = new Product();
        product.name = name;
        product.category = category;
        product.spec = spec == null ? "" : spec;
        product.description = description == null ? "" : description;
        product.imageUrl = imageUrl == null ? "" : imageUrl;
        product.isVisible = true;
        return product;
    }

    public void update(
            String name,
            Category category,
            String spec,
            String description,
            String imageUrl,
            Boolean isVisible) {
        this.name = name;
        this.category = category;
        this.spec = spec == null ? "" : spec;
        this.description = description == null ? "" : description;
        this.imageUrl = imageUrl == null ? "" : imageUrl;
        if (isVisible != null) {
            this.isVisible = isVisible;
        }
    }

    public void updateDetails(String modelName, String useCase, List<Specification> specifications,
            Integer catalogFileId, Integer catalogPage) {
        this.modelName = modelName;
        this.useCase = useCase;
        this.specifications = List.copyOf(specifications);
        this.catalogFileId = catalogFileId;
        this.catalogPage = catalogPage;
    }

    @PrePersist
    void prePersist() {
        LocalDateTime now = LocalDateTime.ofInstant(Clock.systemUTC().instant(), ZoneOffset.UTC);
        if (createdAt == null) {
            createdAt = now;
        }
        if (updatedAt == null) {
            updatedAt = now;
        }
        if (isVisible == null) {
            isVisible = true;
        }
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = LocalDateTime.ofInstant(Clock.systemUTC().instant(), ZoneOffset.UTC);
    }
}
