package com.finel.backend.auth;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class AdminTest {

    @Test
    void createsAdminAndSetsCreatedAtBeforeInsert() {
        Admin admin = Admin.create("admin", "encoded-password");

        admin.prePersist();

        assertThat(admin.getUsername()).isEqualTo("admin");
        assertThat(admin.getPassword()).isEqualTo("encoded-password");
        assertThat(admin.getCreatedAt()).isNotNull();
    }
}
