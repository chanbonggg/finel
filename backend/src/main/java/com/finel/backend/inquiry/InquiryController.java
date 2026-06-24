package com.finel.backend.inquiry;

import com.finel.backend.common.web.ApiResponse;
import com.finel.backend.inquiry.dto.*;
import java.util.Map;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/inquiries") public class InquiryController {
    private final InquiryService service; public InquiryController(InquiryService service){this.service=service;}
    @PostMapping public ResponseEntity<InquiryCreateResponse> create(@RequestBody InquiryCreateRequest request){InquiryCreateResponse response=service.create(request);HttpStatus status=response.success()?HttpStatus.CREATED:switch(response.stage()){case "VALIDATION"->HttpStatus.BAD_REQUEST;case "DB_WRITE"->HttpStatus.INTERNAL_SERVER_ERROR;default->HttpStatus.BAD_GATEWAY;};return ResponseEntity.status(status).body(response);}
    @GetMapping public Map<String,Object> list(){return Map.of("success",true,"inquiries",service.list());}
    @DeleteMapping("/{id}") public ApiResponse delete(@PathVariable Integer id){service.delete(id);return ApiResponse.ok("문의 내역이 삭제되었습니다.");}
}
