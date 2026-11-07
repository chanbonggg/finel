package com.finel.backend.catalog;

import com.finel.backend.common.web.ApiResponse;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.util.Map;
import java.util.UUID;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
public class CatalogController {
    private final CatalogStorage storage;

    public CatalogController(CatalogStorage storage) {
        this.storage = storage;
    }

    public record StartRequest(JsonNode sizeBytes) {}

    @PostMapping("/api/uploads/catalogs")
    public ResponseEntity<Map<String, Object>> start(@RequestBody StartRequest request, Authentication auth) throws IOException {
        JsonNode size = request.sizeBytes();
        if (size == null || !size.isIntegralNumber() || !size.canConvertToLong()) {
            throw new IllegalArgumentException("sizeBytes는 정수여야 합니다.");
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("success", true,
                "upload", storage.start(auth.getName(), size.longValue())));
    }

    @PostMapping(value = "/api/uploads/catalogs/{id}/chunks/{index}", consumes = MediaType.APPLICATION_OCTET_STREAM_VALUE)
    public Map<String, Object> chunk(@PathVariable UUID id, @PathVariable int index,
            HttpServletRequest request, Authentication auth) throws IOException {
        try (var input = request.getInputStream()) {
            return Map.of("success", true, "upload", storage.append(id, auth.getName(), index, input));
        }
    }

    @PostMapping("/api/uploads/catalogs/{id}/complete")
    public Map<String, Object> complete(@PathVariable UUID id, Authentication auth) throws IOException {
        return Map.of("success", true, "catalog", storage.complete(id, auth.getName()));
    }

    @DeleteMapping("/api/uploads/catalogs/{id}")
    public ApiResponse cancel(@PathVariable UUID id, Authentication auth) throws IOException {
        storage.cancel(id, auth.getName());
        return ApiResponse.ok("업로드가 취소되었습니다.");
    }

    @GetMapping("/api/catalogs/{id}")
    public Map<String, Object> metadata(@PathVariable Integer id) {
        return Map.of("success", true, "catalog", storage.metadata(id));
    }

    @GetMapping("/api/catalogs/{id}/file")
    public ResponseEntity<Resource> file(@PathVariable Integer id,
            @RequestHeader(name = HttpHeaders.RANGE, required = false) String range) throws IOException {
        Resource resource = storage.resource(id);
        long length = resource.contentLength();
        if (range != null) {
            try {
                var ranges = HttpRange.parseRanges(range);
                if (ranges.isEmpty()) throw new IllegalArgumentException("Range is empty");
                HttpRange.toResourceRegions(ranges, resource);
            } catch (IllegalArgumentException exception) {
                // Spring's automatic 416 can still write the original resource body.
                return ResponseEntity.status(HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE)
                        .header(HttpHeaders.CONTENT_RANGE, "bytes */" + length).build();
            }
        }
        return ResponseEntity.ok().contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"catalog-" + id + ".pdf\"")
                .header("X-Content-Type-Options", "nosniff")
                .header("Content-Security-Policy", "sandbox")
                .header("X-Accel-Buffering", "no")
                .body(resource);
    }
}
