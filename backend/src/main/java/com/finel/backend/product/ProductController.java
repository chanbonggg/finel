package com.finel.backend.product;

import com.finel.backend.common.web.ApiResponse;
import com.finel.backend.product.dto.ProductCreateRequest;
import com.finel.backend.product.dto.ProductResponse;
import com.finel.backend.product.dto.ProductUpdateRequest;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.authentication.AnonymousAuthenticationToken;

@RestController
@RequestMapping("/api/products")
public class ProductController {
    private final ProductService service;
    public ProductController(ProductService service) { this.service = service; }
    @GetMapping public Map<String,Object> list(@RequestParam(defaultValue="false") boolean includeHidden,
            @RequestParam(required=false) Integer categoryId, Authentication authentication) {
        if(includeHidden && (authentication==null || !authentication.isAuthenticated() || authentication instanceof AnonymousAuthenticationToken)) throw new AuthenticationCredentialsNotFoundException("인증이 필요합니다.");
        return Map.of("success", true, "products", service.list(includeHidden, categoryId));
    }
    @GetMapping("/featured") public Map<String,Object> featured(@RequestParam(defaultValue="4") int limit) { return Map.of("success", true, "products", service.featured(limit)); }
    @GetMapping("/search") public Map<String,Object> search(@RequestParam(defaultValue="") String q) { return Map.of("success", true, "products", service.search(q)); }
    @GetMapping("/{id}") public Map<String,Object> get(@PathVariable Integer id) { return Map.of("success", true, "product", service.get(id)); }
    @PostMapping public ResponseEntity<Map<String,Object>> create(@RequestBody ProductCreateRequest request) {
        ProductResponse product=service.create(request); return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("success",true,"message","제품이 성공적으로 등록되었습니다.","product",product));
    }
    @PatchMapping("/{id}") public Map<String,Object> update(@PathVariable Integer id,@RequestBody ProductUpdateRequest request) { return Map.of("success",true,"message","제품 정보가 수정되었습니다.","product",service.update(id,request)); }
    @DeleteMapping("/{id}") public ApiResponse delete(@PathVariable Integer id) { service.delete(id); return ApiResponse.ok("제품이 삭제되었습니다."); }
}
