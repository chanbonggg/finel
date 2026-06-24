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
        product.spec = spec;
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
        this.spec = spec;
        this.description = description == null ? "" : description;
        this.imageUrl = imageUrl == null ? "" : imageUrl;
        if (isVisible != null) {
            this.isVisible = isVisible;
        }
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
