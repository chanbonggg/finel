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
    private static final Duration CONNECT_TIMEOUT = Duration.ofSeconds(2);
    private static final Duration REQUEST_TIMEOUT = Duration.ofSeconds(3);
    private static final String CONTENT_TYPE_JSON = "application/json";
    private static final String REVALIDATE_SECRET_HEADER = "x-revalidate-secret";

    private static final Logger log = LoggerFactory.getLogger(NextCacheInvalidationNotifier.class);
    private static final HttpClient HTTP_CLIENT = HttpClient.newBuilder()
            .connectTimeout(CONNECT_TIMEOUT)
            .build();

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

    /**
     * Runs only after commit and swallows notification failures, preserving the
     * already-successful database mutation even when Next is unavailable.
     */
    private void notifyNext(Integer productId, Integer categoryId) {
        if (url.isBlank() || secret.isBlank()) {
            return;
        }

        // Keep URL, secret, and request body out of logs. Next consumes this exact body shape.
        String body = "{\"productId\":"
                + nullableNumber(productId)
                + ",\"categoryId\":"
                + nullableNumber(categoryId)
                + "}";
        try {
            HttpResponse<Void> response = HTTP_CLIENT.send(createRequest(body), HttpResponse.BodyHandlers.discarding());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                log.warn("Next cache invalidation returned status {}", response.statusCode());
            }
        } catch (Exception exception) {
            log.warn("Next cache invalidation failed after successful database commit", exception);
        }
    }

    private HttpRequest createRequest(String body) {
        return HttpRequest.newBuilder(URI.create(url))
                .timeout(REQUEST_TIMEOUT)
                .header("Content-Type", CONTENT_TYPE_JSON)
                .header(REVALIDATE_SECRET_HEADER, secret)
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();
    }

    private static String nullableNumber(Integer value) {
        return value == null ? "null" : value.toString();
    }
}
