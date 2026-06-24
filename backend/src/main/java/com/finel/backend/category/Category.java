package com.finel.backend.category;

import com.finel.backend.product.Product;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.util.ArrayList;
import java.util.List;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(
        name = "\"Category\"",
        uniqueConstraints = @UniqueConstraint(
                name = "Category_name_companyId_key",
                columnNames = {"name", "\"companyId\""}))
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "\"companyId\"", nullable = false)
    private Integer companyId;

    @OneToMany(mappedBy = "category")
    private List<Product> products = new ArrayList<>();

    public static Category create(String name, Integer companyId) {
        Category category = new Category();
        category.name = name;
        category.companyId = companyId;
        return category;
    }
}
