package com.finel.backend.upload;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.cloudinary")
public record CloudinaryProperties(String cloudName, String apiKey, String apiSecret, String folder) {
    boolean configured() {
        return hasText(cloudName) && hasText(apiKey) && hasText(apiSecret);
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
