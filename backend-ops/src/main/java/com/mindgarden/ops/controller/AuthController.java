package com.mindgarden.ops.controller;

import com.mindgarden.ops.controller.dto.LoginRequest;
import com.mindgarden.ops.controller.dto.LoginResponse;
import com.mindgarden.ops.service.auth.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

@RestController
@RequestMapping("/api/v1/ops/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(
            @RequestBody @Valid LoginRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {
        
        LoginResponse response = authService.login(request);
        
        // 요청이 HTTPS인지 확인
        boolean isHttps = "https".equalsIgnoreCase(httpRequest.getScheme()) ||
                         "https".equalsIgnoreCase(httpRequest.getHeader("X-Forwarded-Proto"));
        
        // Set-Cookie 헤더 생성
        ResponseCookie tokenCookie = ResponseCookie.from("ops_token", response.token())
                .path("/")
                .maxAge(Duration.ofHours(1))
                .httpOnly(false)  // JavaScript에서 접근 가능하도록
                .secure(isHttps)  // HTTPS에서만 전송
                .sameSite("Lax")
                .build();
        
        ResponseCookie actorIdCookie = ResponseCookie.from("ops_actor_id", 
                        URLEncoder.encode(response.actorId(), StandardCharsets.UTF_8))
                .path("/")
                .maxAge(Duration.ofHours(1))
                .httpOnly(false)
                .secure(isHttps)
                .sameSite("Lax")
                .build();
        
        ResponseCookie actorRoleCookie = ResponseCookie.from("ops_actor_role", response.actorRole())
                .path("/")
                .maxAge(Duration.ofHours(1))
                .httpOnly(false)
                .secure(isHttps)
                .sameSite("Lax")
                .build();
        
        // HttpServletResponse에 직접 Set-Cookie 헤더 추가 (여러 개 가능)
        httpResponse.addHeader("Set-Cookie", tokenCookie.toString());
        httpResponse.addHeader("Set-Cookie", actorIdCookie.toString());
        httpResponse.addHeader("Set-Cookie", actorRoleCookie.toString());
        
        return ResponseEntity.ok(response);
    }
}

