package com.finel.backend.auth;

import com.finel.backend.auth.dto.LoginRequest;
import java.time.Instant;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
    private static final long ACCESS_TOKEN_TTL_SECONDS = 43_200;
    private static final String BAD_CREDENTIALS_MESSAGE = "아이디 또는 비밀번호가 올바르지 않습니다.";

    private final AdminRepository admins;
    private final PasswordEncoder passwords;
    private final JwtEncoder encoder;

    public AuthService(AdminRepository admins, PasswordEncoder passwords, JwtEncoder encoder) {
        this.admins = admins;
        this.passwords = passwords;
        this.encoder = encoder;
    }

    public Login login(LoginRequest request) {
        if (request.username() == null
                || request.username().isBlank()
                || request.password() == null
                || request.password().isBlank()) {
            throw new IllegalArgumentException("아이디와 비밀번호를 입력해주세요.");
        }

        Admin admin = admins.findByUsername(request.username())
                .orElseThrow(() -> new BadCredentialsException(BAD_CREDENTIALS_MESSAGE));

        if (!passwords.matches(request.password(), admin.getPassword())) {
            throw new BadCredentialsException(BAD_CREDENTIALS_MESSAGE);
        }

        return new Login(admin, createToken(admin));
    }

    private String createToken(Admin admin) {
        Instant now = Instant.now();
        Instant expires = now.plusSeconds(ACCESS_TOKEN_TTL_SECONDS);
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuedAt(now)
                .expiresAt(expires)
                .subject(admin.getUsername())
                .claim("id", admin.getId())
                .claim("username", admin.getUsername())
                .build();
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        return encoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
    }

    public record Login(Admin admin, String token) {}
}
