package com.mindgarden.ops.service.auth;

import com.mindgarden.ops.controller.dto.LoginRequest;
import com.mindgarden.ops.controller.dto.LoginResponse;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

    private final JwtTokenService jwtTokenService;
    private final String opsUsername;
    private final String opsPassword;
    private final String defaultRole;
    private final PasswordEncoder passwordEncoder;
    private final long expirySeconds;
    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    public AuthService(
        JwtTokenService jwtTokenService,
        PasswordEncoder passwordEncoder,
        @Value("${security.ops.username:ops-admin}") String opsUsername,
        @Value("${security.ops.password:change-me}") String opsPassword,
        @Value("${security.ops.default-role:HQ_ADMIN}") String defaultRole,
        @Value("${security.jwt.expires-in-seconds:3600}") long expirySeconds
    ) {
        this.jwtTokenService = jwtTokenService;
        this.passwordEncoder = passwordEncoder;
        this.opsUsername = opsUsername;
        this.opsPassword = opsPassword;
        this.defaultRole = defaultRole;
        this.expirySeconds = expirySeconds;
    }

    public LoginResponse login(LoginRequest request) {
        boolean usernameMatches = request.username().equals(opsUsername);
        boolean passwordMatches = passwordMatches(request.password());

        if (!usernameMatches) {
            log.warn("로그인 실패 - 존재하지 않는 계정 요청: {}", request.username());
        } else if (!passwordMatches) {
            log.warn("로그인 실패 - 비밀번호 불일치: {}", request.username());
        }

        if (!usernameMatches || !passwordMatches) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "아이디 또는 비밀번호가 올바르지 않습니다.");
        }

        Instant now = Instant.now();
        Instant expiresAt = now.plus(expirySeconds, ChronoUnit.SECONDS);

        String token = jwtTokenService.generateToken(
            request.username(),
            Map.of(
                "actorId", request.username(),
                "actorRole", defaultRole
            )
        );

        return new LoginResponse(
            token,
            request.username(),
            defaultRole,
            expiresAt
        );
    }

    private boolean passwordMatches(String rawPassword) {
        if (opsPassword.startsWith("{bcrypt}")) {
            String encoded = opsPassword.substring("{bcrypt}".length());
            return passwordEncoder.matches(rawPassword, encoded);
        }
        return opsPassword.equals(rawPassword);
    }
}

