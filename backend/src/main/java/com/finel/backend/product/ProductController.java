package com.finel.backend.product;

import com.finel.backend.common.web.ApiResponse;
import com.finel.backend.product.dto.ProductCreateRequest;
import com.finel.backend.product.dto.ProductResponse;
import com.finel.backend.product.dto.ProductUpdateRequest;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/products")
public class ProductController {
    private final ProductService service;

    public ProductController(ProductService service) {
        this.service = service;
    }

    @GetMapping
    public Map<String, Object> list(
            @RequestParam(defaultValue = "false") boolean includeHidden,
            @RequestParam(required = false) Integer categoryId,
            Authentication authentication) {
        requireAdminForHiddenProducts(includeHidden, authentication);
        return productsResponse(service.list(includeHidden, categoryId));
    }

    @GetMapping("/featured")
    public Map<String, Object> featured(@RequestParam(defaultValue = "4") int limit) {
        return productsResponse(service.featured(limit));
    }

    @GetMapping("/search")
    public Map<String, Object> search(@RequestParam(defaultValue = "") String q) {
        return productsResponse(service.search(q));
    }

    @GetMapping("/{id}")
    public Map<String, Object> get(@PathVariable Integer id) {
        return Map.of("success", true, "product", service.get(id));
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> create(@RequestBody ProductCreateRequest request) {
        ProductResponse product = service.create(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(mutationResponse("제품이 성공적으로 등록되었습니다.", product));
    }

    @PatchMapping("/{id}")
    public Map<String, Object> update(@PathVariable Integer id, @RequestBody ProductUpdateRequest request) {
        return mutationResponse("제품 정보가 수정되었습니다.", service.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse delete(@PathVariable Integer id) {
        service.delete(id);
        return ApiResponse.ok("제품이 삭제되었습니다.");
    }

    /**
     * includeHidden is a public-route query parameter, so authentication is
     * enforced here in addition to Security's path-based rules.
     */
    private static void requireAdminForHiddenProducts(boolean includeHidden, Authentication authentication) {
        if (includeHidden && isUnauthenticated(authentication)) {
            throw new AuthenticationCredentialsNotFoundException("인증이 필요합니다.");
        }
    }

    private static boolean isUnauthenticated(Authentication authentication) {
        return authentication == null
                || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken;
    }

    private static Map<String, Object> productsResponse(List<ProductResponse> products) {
        return Map.of("success", true, "products", products);
    }

    private static Map<String, Object> mutationResponse(String message, ProductResponse product) {
        return Map.of("success", true, "message", message, "product", product);
    }
}
