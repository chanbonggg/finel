package com.finel.backend.upload;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/uploads")
public class UploadController {
    private final CloudinaryUploadService service;

    public UploadController(CloudinaryUploadService service) {
        this.service = service;
    }

    @PostMapping("/images")
    public ImageUploadResponse uploadImage(@RequestParam("file") MultipartFile file) {
        return service.upload(file);
    }
}
