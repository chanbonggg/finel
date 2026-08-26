package com.finel.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class FinelBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(FinelBackendApplication.class, args);
    }
}
