package com.finel.backend.upload;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.Set;
import java.util.Map;
import java.util.TreeMap;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.multipart.MultipartFile;

@Service
@EnableConfigurationProperties(CloudinaryProperties.class)
public class CloudinaryUploadService {
    private static final long MAX_IMAGE_BYTES = 5 * 1024 * 1024;
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            MediaType.IMAGE_JPEG_VALUE,
            MediaType.IMAGE_PNG_VALUE,
            "image/webp",
            MediaType.IMAGE_GIF_VALUE
    );

    private final CloudinaryProperties properties;
    private final RestClient restClient = RestClient.create();

    public CloudinaryUploadService(CloudinaryProperties properties) {
        this.properties = properties;
    }

    public ImageUploadResponse upload(MultipartFile file) {
        validate(file);
        if (!properties.configured()) {
            throw new IllegalArgumentException("Cloudinary upload is not configured.");
        }

        long timestamp = Instant.now().getEpochSecond();
        Map<String, String> signedParams = new TreeMap<>();
        signedParams.put("timestamp", String.valueOf(timestamp));
        if (properties.folder() != null && !properties.folder().isBlank()) {
            signedParams.put("folder", properties.folder());
        }

        LinkedMultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", resource(file));
        body.add("api_key", properties.apiKey());
        body.add("signature", sign(signedParams));
        signedParams.forEach(body::add);

        @SuppressWarnings("unchecked")
        Map<String, Object> response = restClient.post()
                .uri("https://api.cloudinary.com/v1_1/{cloudName}/image/upload", properties.cloudName())
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(body)
                .retrieve()
                .body(Map.class);

        String secureUrl = response == null ? null : (String) response.get("secure_url");
        String publicId = response == null ? null : (String) response.get("public_id");
        if (secureUrl == null || secureUrl.isBlank()) {
            throw new IllegalStateException("Image upload failed.");
        }
        return new ImageUploadResponse(true, secureUrl, publicId);
    }

    private void validate(MultipartFile file) {
        if (file == null || file.isEmpty()) throw new IllegalArgumentException("Image file is required.");
        if (file.getSize() > MAX_IMAGE_BYTES) throw new IllegalArgumentException("Image file must be 5MB or smaller.");
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new IllegalArgumentException("Only JPEG, PNG, WebP, or GIF images can be uploaded.");
        }
    }

    private ByteArrayResource resource(MultipartFile file) {
        try {
            byte[] bytes = file.getBytes();
            return new ByteArrayResource(bytes) {
                @Override public String getFilename() {
                    return file.getOriginalFilename() == null ? "upload" : file.getOriginalFilename();
                }
            };
        } catch (IOException e) {
            throw new IllegalArgumentException("Image file could not be read.");
        }
    }

    private String sign(Map<String, String> params) {
        StringBuilder payload = new StringBuilder();
        params.forEach((key, value) -> {
            if (!payload.isEmpty()) payload.append('&');
            payload.append(key).append('=').append(value);
        });
        payload.append(properties.apiSecret());
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-1");
            byte[] hash = digest.digest(payload.toString().getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder(hash.length * 2);
            for (byte b : hash) hex.append(String.format("%02x", b));
            return hex.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-1 is unavailable.", e);
        }
    }
}
