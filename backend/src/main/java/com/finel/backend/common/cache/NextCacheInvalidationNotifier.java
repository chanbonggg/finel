package com.finel.backend.common.cache;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/** Notifies Next only after a successful database commit; notification failures never affect mutations. */
@Component
public class NextCacheInvalidationNotifier {
    private static final Logger log = LoggerFactory.getLogger(NextCacheInvalidationNotifier.class);
    private static final HttpClient HTTP_CLIENT = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(2)).build();
    private final String url;
    private final String secret;

    public NextCacheInvalidationNotifier(
            @Value("${app.cache-invalidation.url:}") String url,
            @Value("${app.cache-invalidation.secret:}") String secret) {
        this.url = url == null ? "" : url.trim();
        this.secret = secret == null ? "" : secret.trim();
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void productChanged(ProductCacheInvalidationEvent event) {
        notifyNext(event.productId(), event.categoryId());
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void categoryChanged(CategoryCacheInvalidationEvent event) {
        notifyNext(null, event.categoryId());
    }

    private void notifyNext(Integer productId, Integer categoryId) {
        if (url.isBlank() || secret.isBlank()) return;
        String body = "{\"productId\":" + nullableNumber(productId) + ",\"categoryId\":" + nullableNumber(categoryId) + "}";
        try {
            HttpRequest request = HttpRequest.newBuilder(URI.create(url))
                    .timeout(Duration.ofSeconds(3))
                    .header("Content-Type", "application/json")
                    .header("x-revalidate-secret", secret)
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();
            HttpResponse<Void> response = HTTP_CLIENT.send(request, HttpResponse.BodyHandlers.discarding());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                log.warn("Next cache invalidation returned status {}", response.statusCode());
            }
        } catch (Exception exception) {
            log.warn("Next cache invalidation failed after successful database commit", exception);
        }
    }

    private static String nullableNumber(Integer value) {
        return value == null ? "null" : value.toString();
    }
}
