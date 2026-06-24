package com.finel.backend.config;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.ServletException;
import java.io.IOException;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

class PublicRateLimitFilterTest {
    @Test
    void inquiryFourthRequestIsRateLimitedPerClient() throws ServletException, IOException {
        PublicRateLimitFilter filter = new PublicRateLimitFilter(new ObjectMapper());

        for (int i = 0; i < 3; i++) {
            MockHttpServletResponse allowed = invoke(filter, "/api/inquiries", "203.0.113.10");
            assertThat(allowed.getStatus()).isEqualTo(200);
        }
        MockHttpServletResponse blocked = invoke(filter, "/api/inquiries", "203.0.113.10");

        assertThat(blocked.getStatus()).isEqualTo(429);
        assertThat(blocked.getContentAsString()).contains("RATE_LIMITED");
    }

    @Test
    void loginSixthRequestIsRateLimited() throws ServletException, IOException {
        PublicRateLimitFilter filter = new PublicRateLimitFilter(new ObjectMapper());
        for (int i = 0; i < 5; i++) invoke(filter, "/api/auth/login", "203.0.113.11");
        assertThat(invoke(filter, "/api/auth/login", "203.0.113.11").getStatus()).isEqualTo(429);
    }

    @Test
    void untrustedForwardedHeaderCannotBypassInquiryLimit() throws ServletException, IOException {
        PublicRateLimitFilter filter = new PublicRateLimitFilter(new ObjectMapper());
        MockHttpServletResponse last = null;
        for (int i = 0; i < 4; i++) {
            MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/inquiries");
            request.setRemoteAddr("203.0.113.12");
            request.addHeader("X-Forwarded-For", "198.51.100." + i);
            last = new MockHttpServletResponse();
            filter.doFilter(request, last, new MockFilterChain());
        }
        assertThat(last.getStatus()).isEqualTo(429);
    }

    private static MockHttpServletResponse invoke(PublicRateLimitFilter filter, String uri, String ip)
            throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", uri);
        request.setRemoteAddr(ip);
        MockHttpServletResponse response = new MockHttpServletResponse();
        filter.doFilter(request, response, new MockFilterChain());
        return response;
    }
}
