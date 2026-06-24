package com.finel.backend.auth;
import org.springframework.boot.context.properties.ConfigurationProperties;
@ConfigurationProperties(prefix="app.auth") public record AuthProperties(String jwtSecret,boolean secureCookie,String cookieDomain) {}
