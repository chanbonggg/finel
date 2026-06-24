package com.finel.backend.publicmeta;

import com.finel.backend.publicmeta.dto.SitemapDataResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
@RestController public class PublicMetaController {
    private final PublicMetaService service; public PublicMetaController(PublicMetaService service){this.service=service;}
    @GetMapping("/api/sitemap-data") public SitemapDataResponse get(){return service.get();}
}
