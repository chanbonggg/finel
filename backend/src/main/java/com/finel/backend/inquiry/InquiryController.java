package com.finel.backend.inquiry;

import com.finel.backend.common.web.ApiResponse;
import com.finel.backend.inquiry.dto.InquiryCreateRequest;
import com.finel.backend.inquiry.dto.InquiryCreateResponse;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/inquiries")
public class InquiryController {
    private static final String STAGE_VALIDATION = "VALIDATION";
    private static final String STAGE_DB_WRITE = "DB_WRITE";

    private final InquiryService service;

    public InquiryController(InquiryService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<InquiryCreateResponse> create(@RequestBody InquiryCreateRequest request) {
        InquiryCreateResponse response = service.create(request);
        return ResponseEntity.status(statusFor(response)).body(response);
    }

    @GetMapping
    public Map<String, Object> list() {
        return Map.of("success", true, "inquiries", service.list());
    }

    @DeleteMapping("/{id}")
    public ApiResponse delete(@PathVariable Integer id) {
        service.delete(id);
        return ApiResponse.ok("문의 내역이 삭제되었습니다.");
    }

    /**
     * The create response already carries the public stage contract; this method
     * keeps HTTP status translation in the controller boundary only.
     */
    private static HttpStatus statusFor(InquiryCreateResponse response) {
        if (response.success()) {
            return HttpStatus.CREATED;
        }

        return switch (response.stage()) {
            case STAGE_VALIDATION -> HttpStatus.BAD_REQUEST;
            case STAGE_DB_WRITE -> HttpStatus.INTERNAL_SERVER_ERROR;
            default -> HttpStatus.BAD_GATEWAY;
        };
    }
}
