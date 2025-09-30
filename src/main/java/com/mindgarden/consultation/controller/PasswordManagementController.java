package com.mindgarden.consultation.controller;

import java.util.Map;
import com.mindgarden.consultation.dto.PasswordChangeRequest;
import com.mindgarden.consultation.dto.PasswordResetRequest;
import com.mindgarden.consultation.entity.User;
import com.mindgarden.consultation.service.PasswordConfigService;
import com.mindgarden.consultation.service.PasswordResetService;
import com.mindgarden.consultation.service.PasswordValidationService;
import com.mindgarden.consultation.service.UserService;
import com.mindgarden.consultation.utils.SessionUtils;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 비밀번호 관리 컨트롤러
 * 공통코드 기반 비밀번호 정책 적용
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-17
 */
@Slf4j
@RestController
@RequestMapping("/api/password")
@RequiredArgsConstructor
public class PasswordManagementController {
    
    private final PasswordValidationService passwordValidationService;
    private final PasswordConfigService passwordConfigService;
    private final PasswordResetService passwordResetService;
    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    
    /**
     * 비밀번호 정책 요구사항 조회
     */
    @GetMapping("/requirements")
    public ResponseEntity<Map<String, Object>> getPasswordRequirements() {
        try {
            log.info("🔍 비밀번호 정책 요구사항 조회");
            
            Map<String, Object> requirements = passwordValidationService.getPasswordRequirements();
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", requirements
            ));
            
        } catch (Exception e) {
            log.error("❌ 비밀번호 정책 요구사항 조회 실패: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "비밀번호 정책 요구사항 조회 중 오류가 발생했습니다."
            ));
        }
    }
    
    /**
     * 비밀번호 검증
     */
    @PostMapping("/validate")
    public ResponseEntity<Map<String, Object>> validatePassword(@RequestBody Map<String, String> request) {
        try {
            String password = request.get("password");
            log.info("🔍 비밀번호 검증 요청");
            
            Map<String, Object> validationResult = passwordValidationService.validatePassword(password);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", validationResult
            ));
            
        } catch (Exception e) {
            log.error("❌ 비밀번호 검증 실패: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "비밀번호 검증 중 오류가 발생했습니다."
            ));
        }
    }
    
    /**
     * 비밀번호 강도 측정
     */
    @PostMapping("/strength")
    public ResponseEntity<Map<String, Object>> measurePasswordStrength(@RequestBody Map<String, String> request) {
        try {
            String password = request.get("password");
            log.info("🔍 비밀번호 강도 측정 요청");
            
            Map<String, Object> strengthResult = passwordValidationService.measurePasswordStrength(password);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", strengthResult
            ));
            
        } catch (Exception e) {
            log.error("❌ 비밀번호 강도 측정 실패: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "비밀번호 강도 측정 중 오류가 발생했습니다."
            ));
        }
    }
    
    /**
     * 비밀번호 변경
     */
    @PostMapping("/change")
    public ResponseEntity<Map<String, Object>> changePassword(@RequestBody PasswordChangeRequest request, HttpSession session) {
        try {
            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null) {
                return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "message", "로그인이 필요합니다."
                ));
            }
            
            log.info("🔑 비밀번호 변경 요청: userId={}", currentUser.getId());
            
            // 새 비밀번호 검증
            Map<String, Object> validationResult = passwordValidationService.validatePassword(request.getNewPassword());
            if (!(Boolean) validationResult.get("isValid")) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "비밀번호가 정책을 만족하지 않습니다.",
                    "errors", validationResult.get("errors")
                ));
            }
            
            // 비밀번호 확인 일치 검증
            if (!request.getNewPassword().equals(request.getConfirmPassword())) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "비밀번호 확인이 일치하지 않습니다."
                ));
            }
            
            // 현재 비밀번호 확인
            if (!passwordEncoder.matches(request.getCurrentPassword(), currentUser.getPassword())) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "현재 비밀번호가 올바르지 않습니다."
                ));
            }
            
            // 새 비밀번호가 현재 비밀번호와 같은지 확인
            if (passwordEncoder.matches(request.getNewPassword(), currentUser.getPassword())) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "새 비밀번호는 현재 비밀번호와 달라야 합니다."
                ));
            }
            
            // 비밀번호 변경 (UserService 호출)
            userService.changePassword(
                currentUser.getId(), 
                request.getCurrentPassword(), 
                request.getNewPassword()
            );
            
            log.info("✅ 비밀번호 변경 성공: userId={}", currentUser.getId());
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "비밀번호가 성공적으로 변경되었습니다."
            ));
            
        } catch (Exception e) {
            log.error("❌ 비밀번호 변경 실패: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "비밀번호 변경 중 오류가 발생했습니다."
            ));
        }
    }
    
    /**
     * 비밀번호 재설정 이메일 발송
     */
    @PostMapping("/reset/request")
    public ResponseEntity<Map<String, Object>> requestPasswordReset(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            log.info("📧 비밀번호 재설정 이메일 발송 요청: email={}", email);
            
            // 이메일 설정 조회
            Map<String, Object> emailConfig = passwordConfigService.getEmailConfig();
            Map<String, Object> resetConfig = passwordConfigService.getPasswordResetConfig();
            
            // 비밀번호 재설정 이메일 발송
            boolean emailSent = passwordResetService.sendPasswordResetEmail(email);
            
            if (emailSent) {
                log.info("✅ 비밀번호 재설정 이메일 발송 성공: email={}", email);
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "비밀번호 재설정 이메일이 발송되었습니다."
                ));
            } else {
                log.warn("⚠️ 비밀번호 재설정 이메일 발송 실패: email={}", email);
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "비밀번호 재설정 이메일 발송에 실패했습니다."
                ));
            }
            
        } catch (Exception e) {
            log.error("❌ 비밀번호 재설정 이메일 발송 실패: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "비밀번호 재설정 이메일 발송 중 오류가 발생했습니다."
            ));
        }
    }
    
    /**
     * 비밀번호 재설정
     */
    @PostMapping("/reset/confirm")
    public ResponseEntity<Map<String, Object>> confirmPasswordReset(@RequestBody PasswordResetRequest request) {
        try {
            log.info("🔑 비밀번호 재설정 확인 요청: token={}", request.getToken());
            
            // 새 비밀번호 검증
            Map<String, Object> validationResult = passwordValidationService.validatePassword(request.getNewPassword());
            if (!(Boolean) validationResult.get("isValid")) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "비밀번호가 정책을 만족하지 않습니다.",
                    "errors", validationResult.get("errors")
                ));
            }
            
            // 비밀번호 확인 일치 검증
            if (!request.getNewPassword().equals(request.getConfirmPassword())) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "비밀번호 확인이 일치하지 않습니다."
                ));
            }
            
            // 비밀번호 재설정 처리
            boolean resetSuccess = passwordResetService.resetPassword(request.getToken(), request.getNewPassword());
            
            if (resetSuccess) {
                log.info("✅ 비밀번호 재설정 성공: token={}", request.getToken());
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "비밀번호가 성공적으로 재설정되었습니다."
                ));
            } else {
                log.warn("⚠️ 비밀번호 재설정 실패: token={}", request.getToken());
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "비밀번호 재설정에 실패했습니다. 토큰이 유효하지 않거나 만료되었습니다."
                ));
            }
            
        } catch (Exception e) {
            log.error("❌ 비밀번호 재설정 확인 실패: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "비밀번호 재설정 중 오류가 발생했습니다."
            ));
        }
    }
}
