package com.finel.backend.config;

import com.finel.backend.auth.AuthProperties;
import com.finel.backend.common.error.ErrorResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nimbusds.jose.jwk.source.ImmutableSecret;
import java.nio.charset.StandardCharsets;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.security.oauth2.server.resource.web.BearerTokenResolver;
import org.springframework.security.oauth2.server.resource.web.authentication.BearerTokenAuthenticationFilter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.security.web.csrf.InvalidCsrfTokenException;
import org.springframework.security.web.csrf.MissingCsrfTokenException;

@Configuration
@EnableConfigurationProperties(AuthProperties.class)
public class SecurityConfig {
    private static final Logger log = LoggerFactory.getLogger(SecurityConfig.class);

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http,ObjectMapper mapper, PublicRateLimitFilter rateLimitFilter) throws Exception {
        CookieCsrfTokenRepository csrf=CookieCsrfTokenRepository.withHttpOnlyFalse();
        CsrfTokenRequestAttributeHandler csrfHandler=new CsrfTokenRequestAttributeHandler();
        return http
                .cors(Customizer.withDefaults())
                .csrf(c -> c.csrfTokenRepository(csrf).csrfTokenRequestHandler(csrfHandler)
                    .ignoringRequestMatchers("/api/inquiries"))
                .exceptionHandling(errors -> errors
                    .accessDeniedHandler((req,res,e)->{
                        boolean csrfFailure = e instanceof MissingCsrfTokenException || e instanceof InvalidCsrfTokenException;
                        log.warn("security access denied: method={} path={} csrfFailure={} type={}",
                                req.getMethod(), req.getRequestURI(), csrfFailure, e.getClass().getName());
                        res.setStatus(403); res.setContentType("application/json");
                        ErrorResponse body = csrfFailure
                                ? new ErrorResponse(false,"CSRF_INVALID",null,"요청 보안 토큰이 유효하지 않습니다.")
                                : new ErrorResponse("접근 권한이 없습니다.");
                        mapper.writeValue(res.getOutputStream(),body);
                    }))
                .authorizeHttpRequests(auth -> auth
                    .requestMatchers("/api/auth/csrf","/api/auth/login","/api/auth/logout","/api/sitemap-data").permitAll()
                    .requestMatchers(org.springframework.http.HttpMethod.POST,"/api/inquiries").permitAll()
                    .requestMatchers(org.springframework.http.HttpMethod.GET,"/api/products/**","/api/categories/**").permitAll()
                    .anyRequest().authenticated())
                .oauth2ResourceServer(o->o.bearerTokenResolver(cookieResolver()).jwt(Customizer.withDefaults())
                    .authenticationEntryPoint((req,res,e)->{logAuthenticationFailure(req.getMethod(), req.getRequestURI(), e);res.setStatus(401);res.setContentType("application/json");mapper.writeValue(res.getOutputStream(),new ErrorResponse("인증이 필요합니다."));}))
                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .addFilterBefore(rateLimitFilter, BearerTokenAuthenticationFilter.class)
                .build();
    }

    @Bean PasswordEncoder passwordEncoder(){return new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder();}
    @Bean BearerTokenResolver cookieResolver(){return request->{
        String method=request.getMethod(), path=request.getRequestURI();
        boolean publicRequest = ("GET".equals(method) && (path.startsWith("/api/products") && !"true".equalsIgnoreCase(request.getParameter("includeHidden"))
                || path.startsWith("/api/categories") || path.equals("/api/sitemap-data")
                || path.equals("/api/auth/csrf") || path.equals("/api/auth/logout")))
                || ("POST".equals(method) && (path.equals("/api/inquiries") || path.equals("/api/auth/login")));
        if(publicRequest || request.getCookies()==null) return null;
        return java.util.Arrays.stream(request.getCookies()).filter(c->c.getName().equals("auth_token"))
                .map(jakarta.servlet.http.Cookie::getValue).findFirst().orElse(null);
    };}
    @Bean SecretKey jwtKey(AuthProperties properties){byte[] bytes=properties.jwtSecret()==null?new byte[0]:properties.jwtSecret().getBytes(StandardCharsets.UTF_8);if(bytes.length<32)throw new IllegalStateException("JWT_SECRET must be at least 32 bytes");return new SecretKeySpec(bytes,"HmacSHA256");}
    @Bean JwtDecoder jwtDecoder(SecretKey key){return NimbusJwtDecoder.withSecretKey(key).macAlgorithm(org.springframework.security.oauth2.jose.jws.MacAlgorithm.HS256).build();}
    @Bean JwtEncoder jwtEncoder(SecretKey key){return new NimbusJwtEncoder(new ImmutableSecret<>(key));}

    private static void logAuthenticationFailure(String method, String path, AuthenticationException exception) {
        log.warn("security authentication failed: method={} path={} type={}",
                method, path, exception.getClass().getName());
    }
}
