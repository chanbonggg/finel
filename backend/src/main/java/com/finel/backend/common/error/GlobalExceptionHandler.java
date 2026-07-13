package com.finel.backend.common.error;

import java.util.NoSuchElementException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.http.HttpStatus;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;
import org.springframework.security.core.AuthenticationException;

@RestControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler({IllegalArgumentException.class, MissingServletRequestParameterException.class,
            MethodArgumentTypeMismatchException.class})
    ResponseEntity<ErrorResponse> badRequest(Exception exception) {
        String message = exception instanceof IllegalArgumentException ? exception.getMessage() : "요청 값이 올바르지 않습니다.";
        return ResponseEntity.badRequest().body(new ErrorResponse(message));
    }
    @ExceptionHandler(NoSuchElementException.class)
    ResponseEntity<ErrorResponse> notFound(NoSuchElementException exception) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ErrorResponse(exception.getMessage()));
    }
    @ExceptionHandler(DuplicateResourceException.class)
    ResponseEntity<ErrorResponse> conflict(DuplicateResourceException exception) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(new ErrorResponse(exception.getMessage()));
    }
    @ExceptionHandler(AuthenticationException.class)
    ResponseEntity<ErrorResponse> unauthorized(AuthenticationException exception) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ErrorResponse("아이디 또는 비밀번호가 올바르지 않습니다."));
    }
    @ExceptionHandler(HttpMessageNotReadableException.class)
    ResponseEntity<ErrorResponse> unreadableBody(HttpMessageNotReadableException exception) {
        return ResponseEntity.badRequest().body(new ErrorResponse("요청 본문이 올바르지 않습니다."));
    }
    @ExceptionHandler(MissingServletRequestPartException.class)
    ResponseEntity<ErrorResponse> missingPart(MissingServletRequestPartException exception) {
        return ResponseEntity.badRequest().body(new ErrorResponse("필수 요청 항목이 누락되었습니다."));
    }
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    ResponseEntity<ErrorResponse> methodNotAllowed(HttpRequestMethodNotSupportedException exception) {
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED).headers(exception.getHeaders()).body(new ErrorResponse("지원하지 않는 요청 메서드입니다."));
    }
    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    ResponseEntity<ErrorResponse> unsupportedMediaType(HttpMediaTypeNotSupportedException exception) {
        return ResponseEntity.status(HttpStatus.UNSUPPORTED_MEDIA_TYPE).headers(exception.getHeaders()).body(new ErrorResponse("지원하지 않는 콘텐츠 타입입니다."));
    }
    @ExceptionHandler(Exception.class)
    ResponseEntity<ErrorResponse> internalServerError(Exception exception) {
        if (exception instanceof org.springframework.web.ErrorResponse response && response.getStatusCode().is4xxClientError()) {
            return ResponseEntity.status(response.getStatusCode()).body(new ErrorResponse("요청을 처리할 수 없습니다."));
        }
        log.error("unhandled server exception: type={} causeType={}", exception.getClass().getName(), causeType(exception));
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ErrorResponse("Internal server error"));
    }
    private static String causeType(Throwable exception) { return exception.getCause() == null ? "none" : exception.getCause().getClass().getName(); }
}
