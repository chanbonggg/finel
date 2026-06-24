package com.finel.backend.auth;
import org.springframework.boot.context.properties.ConfigurationProperties;
@ConfigurationProperties(prefix="app.admin-bootstrap") public record AdminBootstrapProperties(boolean enabled,String username,String password) {}
