package com.finel.backend.category;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryRepository extends JpaRepository<Category, Integer> {

    interface SitemapProjection { Integer getId(); }

    List<Category> findByCompanyIdOrderByNameAsc(Integer companyId);

    boolean existsByNameAndCompanyId(String name, Integer companyId);

    @org.springframework.data.jpa.repository.Query("select c.id as id from Category c order by c.id asc")
    List<SitemapProjection> findAllSitemapItems();
}
