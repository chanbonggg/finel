package com.finel.backend.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.finel.backend.category.CategoryRepository;
import com.finel.backend.inquiry.InquiryRepository;
import com.finel.backend.product.ProductRepository;
import jakarta.servlet.http.Cookie;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.http.MediaType;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;

@ActiveProfiles("test")
@SpringBootTest
@AutoConfigureMockMvc
@ExtendWith(OutputCaptureExtension.class)
class SecurityIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired PasswordEncoder passwordEncoder;
    @MockBean AdminRepository adminRepository;
    @MockBean CategoryRepository categoryRepository;
    @MockBean InquiryRepository inquiryRepository;
    @MockBean ProductRepository productRepository;
    @MockBean JavaMailSender mailSender;

    @Test
    void csrfEndpointIssuesReadableCookieAndToken() throws Exception {
        mvc.perform(get("/api/auth/csrf"))
                .andExpect(status().isOk())
                .andExpect(cookie().exists("XSRF-TOKEN"))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.token").isNotEmpty());
    }

    @Test
    void stateChangingAdminRequestWithoutCsrfIsForbiddenBeforeMutation(CapturedOutput output) throws Exception {
        mvc.perform(post("/api/products").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorCode").value("CSRF_INVALID"));

        assertThat(output).contains("security access denied")
                .contains("csrfFailure=true")
                .doesNotContain("XSRF-TOKEN")
                .doesNotContain("X-XSRF-TOKEN");
    }

    @Test
    void protectedReadsWithoutJwtReturn401() throws Exception {
        mvc.perform(get("/api/inquiries"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false));
        mvc.perform(get("/api/products").param("includeHidden", "true"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void loginSetsHttpOnlyJwtCookieAndCookieVerifies() throws Exception {
        Admin admin = Admin.create("admin", passwordEncoder.encode("correct-password"));
        ReflectionTestUtils.setField(admin, "id", 1);
        when(adminRepository.findByUsername("admin")).thenReturn(Optional.of(admin));

        Cookie auth = mvc.perform(post("/api/auth/login").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"admin\",\"password\":\"correct-password\"}"))
                .andExpect(status().isOk())
                .andExpect(cookie().httpOnly("auth_token", true))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("로그인 성공"))
                .andReturn().getResponse().getCookie("auth_token");

        mvc.perform(get("/api/auth/verify").cookie(auth))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.id").value(1))
                .andExpect(jsonPath("$.user.username").value("admin"))
                .andExpect(jsonPath("$.user.iat").isNumber())
                .andExpect(jsonPath("$.user.exp").isNumber());
    }

    @Test
    void logoutUsesLegacyContractMessage() throws Exception {
        mvc.perform(get("/api/auth/logout"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Logged out"))
                .andExpect(cookie().maxAge("auth_token", 0));
    }

    @Test
    void publicVisibleListIgnoresInvalidAuthCookie() throws Exception {
        when(productRepository.findByIsVisibleTrueOrderByCreatedAtDesc()).thenReturn(List.of());
        mvc.perform(get("/api/products").cookie(new Cookie("auth_token", "invalid-jwt")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.products").isArray());
    }

    @Test
    void authenticationFailureLogDoesNotExposeJwt(CapturedOutput output) throws Exception {
        String jwt = "header.payload.signature-secret";

        mvc.perform(get("/api/inquiries").cookie(new Cookie("auth_token", jwt)))
                .andExpect(status().isUnauthorized());

        assertThat(output).contains("security authentication failed")
                .doesNotContain(jwt)
                .doesNotContain("signature-secret");
    }
}
