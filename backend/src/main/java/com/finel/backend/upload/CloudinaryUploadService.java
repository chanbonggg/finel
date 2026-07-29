package com.finel.backend.upload;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.multipart.MultipartFile;

@Service
@EnableConfigurationProperties(CloudinaryProperties.class)
public class CloudinaryUploadService {
    private static final Logger log = LoggerFactory.getLogger(CloudinaryUploadService.class);
    private static final String CLOUDINARY_UPLOAD_URI = "https://api.cloudinary.com/v1_1/{cloudName}/image/upload";
    private static final String FIELD_API_KEY = "api_key";
    private static final String FIELD_FILE = "file";
    private static final String FIELD_FOLDER = "folder";
    private static final String FIELD_PUBLIC_ID = "public_id";
    private static final String FIELD_SECURE_URL = "secure_url";
    private static final String FIELD_SIGNATURE = "signature";
    private static final String FIELD_TIMESTAMP = "timestamp";
    private static final String DEFAULT_FILENAME = "upload";
    private static final long MAX_IMAGE_BYTES = 5 * 1024 * 1024;
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            MediaType.IMAGE_JPEG_VALUE,
            MediaType.IMAGE_PNG_VALUE,
            "image/webp",
            MediaType.IMAGE_GIF_VALUE
    );

    private final CloudinaryProperties properties;
    private final RestClient restClient;

    @Autowired
    public CloudinaryUploadService(CloudinaryProperties properties) {
        this(properties, RestClient.create());
    }

    CloudinaryUploadService(CloudinaryProperties properties, RestClient restClient) {
        this.properties = properties;
        this.restClient = restClient;
    }

    public ImageUploadResponse upload(MultipartFile file) {
        validate(file);
        ensureConfigured();

        // Keep signed upload steps explicit so validation, logging, and response contracts stay reviewable.
        Map<String, String> signedParams = signedUploadParams();
        LinkedMultiValueMap<String, Object> body = uploadBody(file, signedParams);
        Map<String, Object> response = uploadToCloudinary(body);
        return imageUploadResponse(response);
    }

    private void ensureConfigured() {
        if (!properties.configured()) {
            log.warn("cloudinary upload configuration missing: cloudNameConfigured={} apiKeyConfigured={} apiSecretConfigured={}",
                    hasText(properties.cloudName()), hasText(properties.apiKey()), hasText(properties.apiSecret()));
            throw new IllegalArgumentException("Cloudinary upload is not configured.");
        }
    }

    private Map<String, String> signedUploadParams() {
        long timestamp = Instant.now().getEpochSecond();
        Map<String, String> signedParams = new TreeMap<>();
        signedParams.put(FIELD_TIMESTAMP, String.valueOf(timestamp));
        if (hasText(properties.folder())) {
            signedParams.put(FIELD_FOLDER, properties.folder());
        }
        return signedParams;
    }

    private LinkedMultiValueMap<String, Object> uploadBody(MultipartFile file, Map<String, String> signedParams) {
        LinkedMultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add(FIELD_FILE, resource(file));
        body.add(FIELD_API_KEY, properties.apiKey());
        body.add(FIELD_SIGNATURE, sign(signedParams));
        signedParams.forEach(body::add);
        return body;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> uploadToCloudinary(LinkedMultiValueMap<String, Object> body) {
        Map<String, Object> response;
        try {
            response = restClient.post()
                    .uri(CLOUDINARY_UPLOAD_URI, properties.cloudName())
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(body)
                    .retrieve()
                    .body(Map.class);
        } catch (RestClientResponseException e) {
            log.error("cloudinary upload request failed: status={} type={}", e.getStatusCode(), e.getClass().getName());
            throw e;
        } catch (RestClientException e) {
            log.error("cloudinary upload request failed: type={}", e.getClass().getName());
            throw e;
        }
        return response;
    }

    private ImageUploadResponse imageUploadResponse(Map<String, Object> response) {
        String secureUrl = response == null ? null : (String) response.get(FIELD_SECURE_URL);
        String publicId = response == null ? null : (String) response.get(FIELD_PUBLIC_ID);
        if (secureUrl == null || secureUrl.isBlank()) {
            log.error("cloudinary upload response missing secure_url");
            throw new IllegalStateException("Image upload failed.");
        }
        return new ImageUploadResponse(true, secureUrl, publicId);
    }

    private void validate(MultipartFile file) {
        if (file == null || file.isEmpty()) throw new IllegalArgumentException("Image file is required.");
        if (file.getSize() > MAX_IMAGE_BYTES) throw new IllegalArgumentException("Image file must be 5MB or smaller.");
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase(Locale.ROOT))) {
            throw new IllegalArgumentException("Only JPEG, PNG, WebP, or GIF images can be uploaded.");
        }
    }

    private ByteArrayResource resource(MultipartFile file) {
        try {
            byte[] bytes = file.getBytes();
            return new ByteArrayResource(bytes) {
                @Override
                public String getFilename() {
                    return file.getOriginalFilename() == null ? DEFAULT_FILENAME : file.getOriginalFilename();
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

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
