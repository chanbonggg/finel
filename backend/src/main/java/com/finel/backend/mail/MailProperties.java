package com.finel.backend.mail;

import org.springframework.boot.context.properties.ConfigurationProperties;
@ConfigurationProperties(prefix="app.mail") public record MailProperties(String from,String to) {}
