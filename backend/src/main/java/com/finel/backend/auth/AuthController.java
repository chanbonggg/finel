package com.finel.backend.auth;

import com.finel.backend.auth.dto.CsrfResponse;
import com.finel.backend.auth.dto.LoginRequest;
import com.finel.backend.auth.dto.LoginResponse;
import com.finel.backend.auth.dto.VerifyResponse;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private static final String AUTH_COOKIE_NAME = "auth_token";
    private static final String COOKIE_PATH = "/";
    private static final String COOKIE_SAME_SITE = "Lax";
    private static final long ACCESS_TOKEN_MAX_AGE_SECONDS = 43_200;

    private final AuthService service;
    private final AuthProperties properties;

    public AuthController(AuthService service, AuthProperties properties) {
        this.service = service;
        this.properties = properties;
    }

    @PostMapping("/login")
    public LoginResponse login(@RequestBody LoginRequest request, HttpServletResponse response) {
        AuthService.Login login = service.login(request);
        response.addHeader(HttpHeaders.SET_COOKIE, authCookie(login.token(), ACCESS_TOKEN_MAX_AGE_SECONDS).toString());
        return new LoginResponse(
                true,
                "로그인 성공",
                new LoginResponse.User(login.admin().getId(), login.admin().getUsername()));
    }

    @GetMapping("/logout")
    public LoginResponse logout(HttpServletResponse response) {
        response.addHeader(HttpHeaders.SET_COOKIE, authCookie("", 0).toString());
        return new LoginResponse(true, "Logged out", null);
    }

    @GetMapping("/verify")
    public VerifyResponse verify(@AuthenticationPrincipal Jwt jwt) {
        return new VerifyResponse(true, new VerifyResponse.User(
                ((Number) jwt.getClaim("id")).intValue(),
                jwt.getClaimAsString("username"),
                jwt.getIssuedAt().getEpochSecond(),
                jwt.getExpiresAt().getEpochSecond()));
    }

    @GetMapping("/csrf")
    public CsrfResponse csrf(CsrfToken token) {
        return new CsrfResponse(true, token.getToken(), token.getHeaderName());
    }

    private ResponseCookie authCookie(String value, long maxAge) {
        ResponseCookie.ResponseCookieBuilder builder = ResponseCookie.from(AUTH_COOKIE_NAME, value)
                .httpOnly(true)
                .secure(properties.secureCookie())
                .sameSite(COOKIE_SAME_SITE)
                .path(COOKIE_PATH)
                .maxAge(maxAge);

        if (properties.cookieDomain() != null && !properties.cookieDomain().isBlank()) {
            builder.domain(properties.cookieDomain());
        }

        return builder.build();
    }
}
