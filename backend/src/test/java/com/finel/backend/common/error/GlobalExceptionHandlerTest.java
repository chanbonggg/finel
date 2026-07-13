package com.finel.backend.common.error;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(OutputCaptureExtension.class)
class GlobalExceptionHandlerTest {
    @Test
    void catchAllLogsUnhandledServerException(CapturedOutput output) {
        GlobalExceptionHandler handler = new GlobalExceptionHandler();

        var response = handler.internalServerError(new IllegalStateException("boom"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody()).isEqualTo(new ErrorResponse("Internal server error"));
        assertThat(output).contains("unhandled server exception")
                .contains(IllegalStateException.class.getName());
    }

    @Test
    void malformedJsonStaysBadRequest() {
        GlobalExceptionHandler handler = new GlobalExceptionHandler();

        var response = handler.unreadableBody(new HttpMessageNotReadableException("raw parser detail"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isEqualTo(new ErrorResponse("요청 본문이 올바르지 않습니다."));
    }

    @Test
    void catchAllLogDoesNotExposeExceptionMessage(CapturedOutput output) {
        GlobalExceptionHandler handler = new GlobalExceptionHandler();

        handler.internalServerError(new IllegalStateException("sensitive-external-body"));

        assertThat(output).contains("unhandled server exception")
                .contains(IllegalStateException.class.getName())
                .doesNotContain("sensitive-external-body");
    }

    @Test
    void catchAllPreservesSpringMvcClientErrorStatus(CapturedOutput output) {
        GlobalExceptionHandler handler = new GlobalExceptionHandler();

        var response = handler.internalServerError(new ResponseStatusException(HttpStatus.NOT_ACCEPTABLE, "sensitive-client-detail"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_ACCEPTABLE);
        assertThat(response.getBody()).isEqualTo(new ErrorResponse("요청을 처리할 수 없습니다."));
        assertThat(output).doesNotContain("sensitive-client-detail")
                .doesNotContain("unhandled server exception");
    }

    @Test
    void methodNotAllowedPreservesAllowHeader() {
        GlobalExceptionHandler handler = new GlobalExceptionHandler();

        var response = handler.methodNotAllowed(new HttpRequestMethodNotSupportedException("GET", java.util.List.of("POST")));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.METHOD_NOT_ALLOWED);
        assertThat(response.getHeaders().getAllow()).containsExactly(org.springframework.http.HttpMethod.POST);
    }
}
