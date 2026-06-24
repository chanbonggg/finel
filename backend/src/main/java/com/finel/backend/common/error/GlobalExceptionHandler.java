package com.finel.backend.common.error;

import java.util.NoSuchElementException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.security.core.AuthenticationException;

@RestControllerAdvice
public class GlobalExceptionHandler {
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
}
