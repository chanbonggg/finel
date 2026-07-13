package com.finel.backend.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.finel.backend.common.error.ErrorResponse;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Clock;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class PublicRateLimitFilter extends OncePerRequestFilter {
    private static final Logger log = LoggerFactory.getLogger(PublicRateLimitFilter.class);
    private final ConcurrentHashMap<String, Window> windows = new ConcurrentHashMap<>();
    private static final int MAX_ENTRIES = 10_000;
    private static final long MAX_WINDOW_MILLIS = 600_000;
    private final AtomicLong requestCount = new AtomicLong();
    private final ObjectMapper mapper;
    private final Clock clock = Clock.systemUTC();
    public PublicRateLimitFilter(ObjectMapper mapper) { this.mapper = mapper; }

    @Override protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        Rule rule = rule(request);
        String remoteAddr = clientIp(request);
        if (rule != null && !allow(remoteAddr + ':' + request.getRequestURI(), rule)) {
            log.warn("public rate limit exceeded: method={} path={} remoteAddrHash={}",
                    request.getMethod(), request.getRequestURI(), hashRemoteAddr(remoteAddr));
            response.setStatus(429); response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            mapper.writeValue(response.getOutputStream(), new ErrorResponse(false, "RATE_LIMITED", null, "요청이 너무 많습니다. 잠시 후 다시 시도해주세요."));
            return;
        }
        chain.doFilter(request, response);
    }
    private boolean allow(String key, Rule rule) {
        long now = clock.millis();
        if ((requestCount.incrementAndGet() & 255) == 0 || (!windows.containsKey(key) && windows.size() >= MAX_ENTRIES)) {
            windows.entrySet().removeIf(entry -> now - entry.getValue().startedAt >= MAX_WINDOW_MILLIS);
        }
        if (!windows.containsKey(key) && windows.size() >= MAX_ENTRIES) return false;
        Window current = windows.compute(key, (ignored, old) -> old == null || now - old.startedAt >= rule.windowMillis
                ? new Window(now, 1) : new Window(old.startedAt, old.count + 1));
        return current.count <= rule.limit;
    }
    private static Rule rule(HttpServletRequest request) {
        if (!"POST".equals(request.getMethod())) return null;
        return switch (request.getRequestURI()) {
            case "/api/auth/login" -> new Rule(5, 60_000);
            case "/api/inquiries" -> new Rule(3, 600_000);
            default -> null;
        };
    }
    private static String clientIp(HttpServletRequest request) {
        return request.getRemoteAddr();
    }
    private static String hashRemoteAddr(String remoteAddr) {
        try {
            byte[] hash = MessageDigest.getInstance("SHA-256").digest(remoteAddr.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder(12);
            for (int i = 0; i < 6; i++) hex.append(String.format("%02x", hash[i]));
            return hex.toString();
        } catch (NoSuchAlgorithmException e) {
            return "unavailable";
        }
    }
    private record Rule(int limit, long windowMillis) {}
    private record Window(long startedAt, int count) {}
}
