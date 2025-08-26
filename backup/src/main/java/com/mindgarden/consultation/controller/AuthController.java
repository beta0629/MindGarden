package com.mindgarden.consultation.controller;

import com.mindgarden.consultation.dto.AuthRequest;
import com.mindgarden.consultation.dto.AuthResponse;
import com.mindgarden.consultation.dto.RegisterRequest;
import com.mindgarden.consultation.entity.User;
import com.mindgarden.consultation.service.AuthService;
import com.mindgarden.consultation.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * 인증 관련 API 컨트롤러
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {
    
    @Autowired
    private AuthService authService;
    
    @Autowired
    private UserService userService;
    
    /**
     * 이메일 로그인
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody AuthRequest request) {
        try {
            AuthResponse response = authService.authenticate(request.getEmail(), request.getPassword());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(AuthResponse.builder()
                    .success(false)
                    .message("로그인 실패: " + e.getMessage())
                    .build());
        }
    }
    
    /**
     * 회원가입
     */
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request) {
        try {
            User user = new User();
            user.setEmail(request.getEmail());
            user.setPassword(request.getPassword());
            user.setName(request.getName());
            user.setPhone(request.getPhone());
            user.setRole(request.getRole());
            user.setGrade("BRONZE");
            user.setIsActive(true);
            
            User savedUser = userService.save(user);
            
            // 회원가입 후 자동 로그인
            AuthResponse response = authService.authenticate(request.getEmail(), request.getPassword());
            response.setMessage("회원가입이 완료되었습니다.");
            
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(AuthResponse.builder()
                    .success(false)
                    .message("회원가입 실패: " + e.getMessage())
                    .build());
        }
    }
    
    /**
     * 토큰 갱신
     */
    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refreshToken(@RequestParam String refreshToken) {
        try {
            AuthResponse response = authService.refreshToken(refreshToken);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(AuthResponse.builder()
                    .success(false)
                    .message("토큰 갱신 실패: " + e.getMessage())
                    .build());
        }
    }
    
    /**
     * 로그아웃
     */
    @PostMapping("/logout")
    public ResponseEntity<AuthResponse> logout(@RequestHeader("Authorization") String token) {
        try {
            authService.logout(token);
            return ResponseEntity.ok(AuthResponse.builder()
                .success(true)
                .message("로그아웃되었습니다.")
                .build());
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(AuthResponse.builder()
                    .success(false)
                    .message("로그아웃 실패: " + e.getMessage())
                    .build());
        }
    }
    
    /**
     * 비밀번호 재설정 요청
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<AuthResponse> forgotPassword(@RequestParam String email) {
        try {
            authService.forgotPassword(email);
            return ResponseEntity.ok(AuthResponse.builder()
                .success(true)
                .message("비밀번호 재설정 이메일이 발송되었습니다.")
                .build());
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(AuthResponse.builder()
                    .success(false)
                    .message("비밀번호 재설정 요청 실패: " + e.getMessage())
                    .build());
        }
    }
    
    /**
     * 비밀번호 재설정
     */
    @PostMapping("/reset-password")
    public ResponseEntity<AuthResponse> resetPassword(
            @RequestParam String token,
            @RequestParam String newPassword) {
        try {
            authService.resetPassword(token, newPassword);
            return ResponseEntity.ok(AuthResponse.builder()
                .success(true)
                .message("비밀번호가 성공적으로 변경되었습니다.")
                .build());
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(AuthResponse.builder()
                    .success(false)
                    .message("비밀번호 재설정 실패: " + e.getMessage())
                    .build());
        }
    }
}
