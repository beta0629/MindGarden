package com.coresolution.core.controller;

import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;
import com.coresolution.consultation.service.JwtService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * Ops Portal 인증 컨트롤러
 * Ops Portal 전용 로그인 API (JWT 기반)
 * 
 * 표준화 완료: BaseApiController 상속, ApiResponse 사용, GlobalExceptionHandler에 위임
 * 
 * @author CoreSolution
 * @version 2.0.0
 * @since 2025-01-XX
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/ops/auth")  // Ops Portal 전용 경로로 변경 (충돌 방지)
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class OpsAuthController extends BaseApiController {
    
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    
    @Value("${ops.admin.username:superadmin@mindgarden.com}")
    private String opsAdminUsername;
    
    @Value("${ops.admin.password:admin123}")
    private String opsAdminPassword;
    
    @Value("${ops.admin.role:HQ_ADMIN}")
    private String opsAdminRole;
    
    /**
     * Ops Portal 로그인 요청 DTO
     */
    @Data
    public static class LoginRequest {
        private String username;
        private String password;
    }
    
    /**
     * Ops Portal 로그인
     * POST /api/v1/ops/auth/login
     * 
     * @param request 로그인 요청 (username, password)
     * @return JWT 토큰 및 사용자 정보
     * @since 2025-11-23
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<Map<String, Object>>> login(@RequestBody LoginRequest request) {
        if (request == null) {
            log.error("Ops Portal 로그인 요청: request가 null입니다.");
            throw new IllegalArgumentException("요청 데이터가 없습니다.");
        }
        
        String username = request.getUsername();
        String password = request.getPassword();
        
        // 입력값 trim 처리
        if (username != null) {
            username = username.trim();
        }
        if (password != null) {
            password = password.trim();
        }
        
        log.debug("Ops Portal 로그인 요청: username={}, password={}", username, password != null ? "***" : null);
        
        if (username == null || username.isEmpty() || password == null || password.isEmpty()) {
            throw new IllegalArgumentException("아이디와 비밀번호를 모두 입력해주세요.");
        }
        
        log.info("Ops Portal 로그인 시도: username={}", username);
        
        // 관리자 계정 확인 (환경 변수 또는 기본값)
        boolean isAdminAccount = username.equals(opsAdminUsername);
        boolean passwordMatches = password.equals(opsAdminPassword);
        
        if (!isAdminAccount || !passwordMatches) {
            log.warn("Ops Portal 로그인 실패: username={}", username);
            throw new org.springframework.security.authentication.BadCredentialsException("아이디 또는 비밀번호가 올바르지 않습니다.");
        }
        
        // JWT 토큰 생성
        Map<String, Object> claims = new HashMap<>();
        claims.put("actorId", username);
        claims.put("actorRole", opsAdminRole);
        
        String token = jwtService.generateToken(claims, username);
        
        // 만료 시간 계산 (1시간)
        Instant expiresAt = Instant.now().plusSeconds(3600);
        
        log.info("Ops Portal 로그인 성공: username={}, role={}", username, opsAdminRole);
        
        // Ops Portal이 기대하는 형식으로 응답
        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("actorId", username);
        response.put("actorRole", opsAdminRole);
        response.put("expiresAt", expiresAt.toString());
        
        return success(response);
    }
}

