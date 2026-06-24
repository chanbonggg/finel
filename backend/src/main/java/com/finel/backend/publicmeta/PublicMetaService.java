package com.finel.backend.publicmeta;

import com.finel.backend.category.CategoryRepository;
import com.finel.backend.common.web.UtcDates;
import com.finel.backend.product.ProductRepository;
import com.finel.backend.publicmeta.dto.SitemapDataResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly=true)
public class PublicMetaService {
    private final ProductRepository products; private final CategoryRepository categories;
    public PublicMetaService(ProductRepository products,CategoryRepository categories){this.products=products;this.categories=categories;}
    public SitemapDataResponse get(){return new SitemapDataResponse(true,
        products.findVisibleSitemapItems().stream().map(p->new SitemapDataResponse.ProductItem(p.getId(),UtcDates.format(p.getUpdatedAt()))).toList(),
        categories.findAllSitemapItems().stream().map(c->new SitemapDataResponse.CategoryItem(c.getId())).toList());}
}
