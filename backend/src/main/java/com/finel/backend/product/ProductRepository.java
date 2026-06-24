package com.finel.backend.product;

import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProductRepository extends JpaRepository<Product, Integer> {

    interface SitemapProjection { Integer getId(); java.time.LocalDateTime getUpdatedAt(); }

    @EntityGraph(attributePaths = "category")
    List<Product> findAllByOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = "category")
    List<Product> findByIsVisibleTrueOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = "category")
    List<Product> findByCategoryIdAndIsVisibleTrueOrderByCreatedAtDesc(Integer categoryId);

    @EntityGraph(attributePaths = "category")
    @Query("""
            select p
            from Product p
            where p.isVisible = true
            order by p.createdAt desc
            """)
    List<Product> findFeaturedVisibleProducts(Pageable pageable);

    @EntityGraph(attributePaths = "category")
    @Query("""
            select p
            from Product p
            where p.id = :id
            """)
    Optional<Product> findWithCategoryById(@Param("id") Integer id);

    @EntityGraph(attributePaths = "category")
    @Query("""
            select p
            from Product p
            where p.isVisible = true
              and lower(p.name) like lower(concat('%', :query, '%'))
            order by p.createdAt desc
            """)
    List<Product> searchVisibleProducts(@Param("query") String query, Pageable pageable);

    @Query("""
            select count(p)
            from Product p
            where p.category.id = :categoryId
            """)
    long countByCategoryId(@Param("categoryId") Integer categoryId);

    @Query("select p.id as id, p.updatedAt as updatedAt from Product p where p.isVisible = true order by p.id asc")
    List<SitemapProjection> findVisibleSitemapItems();
}
