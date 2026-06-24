package com.finel.backend.category;

import com.finel.backend.category.dto.CategoryCreateRequest;
import com.finel.backend.category.dto.CategoryResponse;
import com.finel.backend.common.web.ApiResponse;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {
    private final CategoryService service;
    public CategoryController(CategoryService service){this.service=service;}
    @GetMapping public Map<String,Object> list(@RequestParam Integer companyId){return Map.of("success",true,"categories",service.list(companyId));}
    @GetMapping("/{id}") public Map<String,Object> get(@PathVariable Integer id){return Map.of("success",true,"category",service.get(id));}
    @PostMapping public ResponseEntity<Map<String,Object>> create(@RequestBody CategoryCreateRequest request){CategoryResponse category=service.create(request);return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("success",true,"message","카테고리가 추가되었습니다.","category",category));}
    @DeleteMapping public ApiResponse delete(@RequestParam Integer id){service.delete(id);return ApiResponse.ok("카테고리가 삭제되었습니다.");}
}
