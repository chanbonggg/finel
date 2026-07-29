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
    private static final long EXPIRED_COOKIE_MAX_AGE_SECONDS = 0;
    private static final String LOGIN_SUCCESS_MESSAGE = "로그인 성공";
    private static final String LOGOUT_SUCCESS_MESSAGE = "Logged out";

    private final AuthService service;
    private final AuthProperties properties;

    public AuthController(AuthService service, AuthProperties properties) {
        this.service = service;
        this.properties = properties;
    }

    @PostMapping("/login")
    public LoginResponse login(@RequestBody LoginRequest request, HttpServletResponse response) {
        AuthService.Login login = service.login(request);
        addAuthCookie(response, login.token(), ACCESS_TOKEN_MAX_AGE_SECONDS);
        return new LoginResponse(true, LOGIN_SUCCESS_MESSAGE, loginUser(login.admin()));
    }

    @GetMapping("/logout")
    public LoginResponse logout(HttpServletResponse response) {
        addAuthCookie(response, "", EXPIRED_COOKIE_MAX_AGE_SECONDS);
        return new LoginResponse(true, LOGOUT_SUCCESS_MESSAGE, null);
    }

    @GetMapping("/verify")
    public VerifyResponse verify(@AuthenticationPrincipal Jwt jwt) {
        return new VerifyResponse(true, verifyUser(jwt));
    }

    @GetMapping("/csrf")
    public CsrfResponse csrf(CsrfToken token) {
        return new CsrfResponse(true, token.getToken(), token.getHeaderName());
    }

    /**
     * Keep Set-Cookie construction at the HTTP boundary so AuthService never
     * handles response mutation or logs the raw JWT value.
     */
    private void addAuthCookie(HttpServletResponse response, String value, long maxAge) {
        response.addHeader(HttpHeaders.SET_COOKIE, authCookie(value, maxAge).toString());
    }

    private ResponseCookie authCookie(String value, long maxAge) {
        ResponseCookie.ResponseCookieBuilder builder = ResponseCookie.from(AUTH_COOKIE_NAME, value)
                .httpOnly(true)
                .secure(properties.secureCookie())
                .sameSite(COOKIE_SAME_SITE)
                .path(COOKIE_PATH)
                .maxAge(maxAge);

        if (hasCookieDomain()) {
            builder.domain(properties.cookieDomain());
        }

        return builder.build();
    }

    private boolean hasCookieDomain() {
        return properties.cookieDomain() != null && !properties.cookieDomain().isBlank();
    }

    private static LoginResponse.User loginUser(Admin admin) {
        return new LoginResponse.User(admin.getId(), admin.getUsername());
    }

    private static VerifyResponse.User verifyUser(Jwt jwt) {
        return new VerifyResponse.User(
                ((Number) jwt.getClaim("id")).intValue(),
                jwt.getClaimAsString("username"),
                jwt.getIssuedAt().getEpochSecond(),
                jwt.getExpiresAt().getEpochSecond());
    }
}
