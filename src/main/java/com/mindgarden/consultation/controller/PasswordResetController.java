package com.mindgarden.consultation.controller;

import com.mindgarden.consultation.service.PasswordResetService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.HashMap;
import java.util.Map;

/**
 * 비밀번호 재설정 컨트롤러
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-17
 */
@Slf4j
@RestController
@RequestMapping("/api/password-reset")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:3000", "https://mindgarden.co.kr"})
public class PasswordResetController {
    
    private final PasswordResetService passwordResetService;
    
    /**
     * 비밀번호 재설정 이메일 발송
     */
    @PostMapping("/send-email")
    public ResponseEntity<Map<String, Object>> sendResetEmail(
            @Valid @RequestBody SendResetEmailRequest request) {
        
        log.info("🔑 비밀번호 재설정 이메일 발송 API 호출: {}", request.getEmail());
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            boolean success = passwordResetService.sendPasswordResetEmail(request.getEmail());
            
            // 보안상 항상 성공으로 응답 (이메일 존재 여부를 알려주지 않음)
            response.put("success", true);
            response.put("message", "입력하신 이메일 주소로 비밀번호 재설정 링크를 발송했습니다. 이메일을 확인해주세요.");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ 비밀번호 재설정 이메일 발송 API 오류", e);
            
            response.put("success", false);
            response.put("message", "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
            
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * 비밀번호 재설정 토큰 검증
     */
    @GetMapping("/validate-token")
    public ResponseEntity<Map<String, Object>> validateToken(
            @RequestParam("token") String token) {
        
        log.info("🔑 비밀번호 재설정 토큰 검증 API 호출");
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            boolean isValid = passwordResetService.validateResetToken(token);
            
            response.put("success", true);
            response.put("valid", isValid);
            response.put("message", isValid ? 
                "유효한 토큰입니다." : 
                "토큰이 만료되었거나 유효하지 않습니다.");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ 토큰 검증 API 오류", e);
            
            response.put("success", false);
            response.put("valid", false);
            response.put("message", "토큰 검증 중 오류가 발생했습니다.");
            
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * 비밀번호 재설정
     */
    @PostMapping("/reset")
    public ResponseEntity<Map<String, Object>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {
        
        log.info("🔑 비밀번호 재설정 API 호출");
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            boolean success = passwordResetService.resetPassword(
                request.getToken(), 
                request.getNewPassword()
            );
            
            if (success) {
                response.put("success", true);
                response.put("message", "비밀번호가 성공적으로 변경되었습니다. 새 비밀번호로 로그인해주세요.");
            } else {
                response.put("success", false);
                response.put("message", "비밀번호 재설정에 실패했습니다. 토큰이 만료되었거나 유효하지 않습니다.");
            }
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ 비밀번호 재설정 API 오류", e);
            
            response.put("success", false);
            response.put("message", "비밀번호 재설정 중 오류가 발생했습니다. 다시 시도해주세요.");
            
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * 비밀번호 재설정 이메일 발송 요청 DTO
     */
    public static class SendResetEmailRequest {
        @NotBlank(message = "이메일은 필수입니다")
        @Email(message = "올바른 이메일 형식을 입력해주세요")
        private String email;
        
        // Getters and Setters
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
    }
    
    /**
     * 비밀번호 재설정 요청 DTO
     */
    public static class ResetPasswordRequest {
        @NotBlank(message = "토큰은 필수입니다")
        private String token;
        
        @NotBlank(message = "새 비밀번호는 필수입니다")
        @Size(min = 8, max = 100, message = "비밀번호는 8자 이상 100자 이하여야 합니다")
        private String newPassword;
        
        @NotBlank(message = "비밀번호 확인은 필수입니다")
        private String confirmPassword;
        
        // Getters and Setters
        public String getToken() { return token; }
        public void setToken(String token) { this.token = token; }
        
        public String getNewPassword() { return newPassword; }
        public void setNewPassword(String newPassword) { this.newPassword = newPassword; }
        
        public String getConfirmPassword() { return confirmPassword; }
        public void setConfirmPassword(String confirmPassword) { this.confirmPassword = confirmPassword; }
    }
}
