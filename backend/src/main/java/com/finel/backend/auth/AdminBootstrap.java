package com.finel.backend.auth;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@EnableConfigurationProperties(AdminBootstrapProperties.class)
public class AdminBootstrap implements ApplicationRunner {
    private static final Logger log=LoggerFactory.getLogger(AdminBootstrap.class);
    private final AdminRepository admins; private final PasswordEncoder encoder; private final AdminBootstrapProperties properties;
    public AdminBootstrap(AdminRepository admins,PasswordEncoder encoder,AdminBootstrapProperties properties){this.admins=admins;this.encoder=encoder;this.properties=properties;}
    @Override @Transactional public void run(ApplicationArguments args){
        if(!properties.enabled()) return;
        if(properties.username()==null||properties.username().isBlank()||properties.password()==null||properties.password().isBlank()) throw new IllegalStateException("ADMIN_USERNAME and ADMIN_PASSWORD are required when bootstrap is enabled");
        String username=properties.username().trim();
        if(admins.existsByUsername(username)){log.info("admin bootstrap skipped: existing admin account");return;}
        admins.save(Admin.create(username,encoder.encode(properties.password())));
        log.info("admin bootstrap created admin account");
    }
}
