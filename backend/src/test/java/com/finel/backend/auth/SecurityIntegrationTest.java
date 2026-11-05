package com.finel.backend.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
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
    @Test
    void readEndpointEnforcesAuthenticationCsrfValidationAndMissingInquiry() throws Exception {
        String path = "/api/inquiries/999/read";
        mvc.perform(patch(path).with(realCsrf()).contentType(MediaType.APPLICATION_JSON).content("{\"isRead\":true}"))
                .andExpect(status().isUnauthorized());
        mvc.perform(patch(path).with(user("admin")).contentType(MediaType.APPLICATION_JSON).content("{\"isRead\":true}"))
                .andExpect(status().isForbidden()).andExpect(jsonPath("$.errorCode").value("CSRF_INVALID"));
        for (String body : List.of("{}", "{\"isRead\":null}", "{\"isRead\":false}", "{\"isRead\":\"true\"}")) {
            mvc.perform(patch(path).with(user("admin")).with(realCsrf()).contentType(MediaType.APPLICATION_JSON).content(body))
                    .andExpect(status().isBadRequest());
        }
        mvc.perform(patch(path).with(user("admin")).with(realCsrf()).contentType(MediaType.APPLICATION_JSON).content("{\"isRead\":true}"))
                .andExpect(status().isNotFound());
        var inquiry = com.finel.backend.inquiry.Inquiry.create("name", "phone", "", "body", null, "old name");
        ReflectionTestUtils.setField(inquiry, "id", 999);
        ReflectionTestUtils.setField(inquiry, "createdAt", java.time.LocalDateTime.now(java.time.ZoneOffset.UTC));
        when(inquiryRepository.findById(999)).thenReturn(Optional.of(inquiry));
        mvc.perform(patch(path).with(user("admin")).with(realCsrf()).contentType(MediaType.APPLICATION_JSON).content("{\"isRead\":true}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.inquiry.id").value(999))
                .andExpect(jsonPath("$.inquiry.isRead").value(true));
    }

    @Test
    void catalogRoutesProtectAllUploadStagesAndOnlyFileGetIsPublic() throws Exception {
        String id = "00000000-0000-0000-0000-000000000000";
        for (String path : List.of("/api/uploads/catalogs", "/api/uploads/catalogs/" + id + "/chunks/0",
                "/api/uploads/catalogs/" + id + "/complete")) {
            mvc.perform(post(path).with(realCsrf())).andExpect(status().isUnauthorized());
            mvc.perform(post(path).with(user("admin"))).andExpect(status().isForbidden());
        }
        mvc.perform(delete("/api/uploads/catalogs/" + id).with(realCsrf())).andExpect(status().isUnauthorized());
        mvc.perform(delete("/api/uploads/catalogs/" + id).with(user("admin"))).andExpect(status().isForbidden());
        mvc.perform(get("/api/catalogs/999")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/catalogs/999/file").cookie(new Cookie("auth_token", "invalid"))).andExpect(status().isNotFound());
    }

    @Autowired MockMvc mvc;
    @Autowired PasswordEncoder passwordEncoder;
    @MockBean AdminRepository adminRepository;
    @MockBean CategoryRepository categoryRepository;
    @MockBean InquiryRepository inquiryRepository;
    @MockBean ProductRepository productRepository;
    @MockBean com.finel.backend.catalog.CatalogRepository catalogRepository;
    @MockBean JavaMailSender mailSender;

    private org.springframework.test.web.servlet.request.RequestPostProcessor realCsrf() throws Exception {
        var response = mvc.perform(get("/api/auth/csrf")).andReturn().getResponse();
        Cookie cookie = response.getCookie("XSRF-TOKEN");
        String token = new com.fasterxml.jackson.databind.ObjectMapper().readTree(response.getContentAsString()).get("token").asText();
        return request -> {
            request.setCookies(cookie);
            request.addHeader("X-XSRF-TOKEN", token);
            return request;
        };
    }

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

        Cookie auth = mvc.perform(post("/api/auth/login").with(realCsrf())
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

        mvc.perform(patch("/api/inquiries/999/read").cookie(auth)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"isRead\":true}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorCode").value("CSRF_INVALID"));
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
