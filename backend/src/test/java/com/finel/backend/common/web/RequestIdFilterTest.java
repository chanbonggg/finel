package com.finel.backend.common.web;

import static org.assertj.core.api.Assertions.assertThat;

import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.Test;
import org.slf4j.MDC;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

class RequestIdFilterTest {
    @Test
    void usesIncomingRequestIdInMdcAndResponseHeader() throws Exception {
        RequestIdFilter filter = new RequestIdFilter();
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/products");
        request.addHeader(RequestIdFilter.HEADER_NAME, "req-123");
        MockHttpServletResponse response = new MockHttpServletResponse();

        FilterChain chain = (req, res) -> assertThat(MDC.get(RequestIdFilter.MDC_KEY)).isEqualTo("req-123");

        filter.doFilter(request, response, chain);

        assertThat(response.getHeader(RequestIdFilter.HEADER_NAME)).isEqualTo("req-123");
        assertThat(MDC.get(RequestIdFilter.MDC_KEY)).isNull();
    }

    @Test
    void rejectsUnsafeRequestIdHeader() throws Exception {
        RequestIdFilter filter = new RequestIdFilter();
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/products");
        request.addHeader(RequestIdFilter.HEADER_NAME, "bad\nvalue");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, (req, res) -> assertThat(MDC.get(RequestIdFilter.MDC_KEY)).isNotBlank());

        assertThat(response.getHeader(RequestIdFilter.HEADER_NAME)).isNotEqualTo("bad\nvalue");
        assertThat(response.getHeader(RequestIdFilter.HEADER_NAME)).isNotBlank();
        assertThat(MDC.get(RequestIdFilter.MDC_KEY)).isNull();
    }
}
