package com.finel.backend.auth;

import com.finel.backend.auth.dto.LoginRequest;
import java.time.Instant;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.stereotype.Service;
@Service public class AuthService {
    private final AdminRepository admins; private final PasswordEncoder passwords; private final JwtEncoder encoder;
    public AuthService(AdminRepository admins,PasswordEncoder passwords,JwtEncoder encoder){this.admins=admins;this.passwords=passwords;this.encoder=encoder;}
    public Login login(LoginRequest request){
        if(request.username()==null||request.username().isBlank()||request.password()==null||request.password().isBlank()) throw new IllegalArgumentException("아이디와 비밀번호를 입력해주세요.");
        Admin admin=admins.findByUsername(request.username()).orElseThrow(()->new BadCredentialsException("아이디 또는 비밀번호가 올바르지 않습니다."));
        if(!passwords.matches(request.password(),admin.getPassword())) throw new BadCredentialsException("아이디 또는 비밀번호가 올바르지 않습니다.");
        Instant now=Instant.now(), expires=now.plusSeconds(43200);
        JwtClaimsSet claims=JwtClaimsSet.builder().issuedAt(now).expiresAt(expires).subject(admin.getUsername()).claim("id",admin.getId()).claim("username",admin.getUsername()).build();
        JwsHeader header=JwsHeader.with(MacAlgorithm.HS256).build();
        return new Login(admin,encoder.encode(JwtEncoderParameters.from(header,claims)).getTokenValue());
    }
    public record Login(Admin admin,String token){}
}
