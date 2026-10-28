package com.coresolution.consultation.controller;

import java.util.HashMap;
import java.util.Map;
import com.coresolution.consultation.dto.AuthResponse;
import com.coresolution.consultation.dto.PasswordChangeRequest;
import com.coresolution.consultation.dto.PasswordResetRequest;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.AuthService;
import com.coresolution.consultation.service.PasswordConfigService;
import com.coresolution.consultation.service.PasswordResetService;
import com.coresolution.consultation.service.PasswordValidationService;
import com.coresolution.consultation.service.UserService;
import com.coresolution.consultation.util.EmailLogMasking;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.security.PasswordService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import jakarta.servlet.http.HttpServletRequest;
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
@RequestMapping("/api/v1/auth/password") // 표준화 2025-12-05: 레거시 경로 제거
@RequiredArgsConstructor
public class PasswordManagementController {
    
    private final PasswordValidationService passwordValidationService;
    private final PasswordConfigService passwordConfigService;
    private final PasswordResetService passwordResetService;
    private final UserService userService;
    private final PasswordService passwordService;
    private final AuthService authService;
    
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
     *
     * <p>세션 User 해시만 쓰지 않고 DB 에서 재조회한 해시와 비교한다.
     * 로그인({@code AuthController})과 같이 current/new/confirm 을 trim 한다.</p>
     */
    @PostMapping("/change")
    public ResponseEntity<Map<String, Object>> changePassword(@RequestBody PasswordChangeRequest request,
            HttpSession session, HttpServletRequest httpRequest) {
        try {
            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null || currentUser.getId() == null) {
                return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "message", "로그인이 필요합니다."
                ));
            }

            String currentPassword = trimPassword(request != null ? request.getCurrentPassword() : null);
            String newPassword = trimPassword(request != null ? request.getNewPassword() : null);
            String confirmPassword = trimPassword(request != null ? request.getConfirmPassword() : null);
            
            log.info("🔑 비밀번호 변경 요청: userId={}", currentUser.getId());

            // DB 최신 User (세션에 남은 이전 해시로 matches 하지 않음)
            User dbUser = userService.findById(currentUser.getId()).orElse(null);
            if (dbUser == null) {
                return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "message", "로그인이 필요합니다."
                ));
            }
            
            // 새 비밀번호 검증
            Map<String, Object> validationResult = passwordValidationService.validatePassword(newPassword);
            if (!(Boolean) validationResult.get("isValid")) {
                @SuppressWarnings("unchecked")
                Map<String, String> errMap = (Map<String, String>) validationResult.get("errors");
                String detail = firstPasswordPolicyMessage(errMap);
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", detail != null ? detail : "비밀번호가 정책을 만족하지 않습니다.",
                    "errors", validationResult.get("errors")
                ));
            }
            
            // 비밀번호 확인 일치 검증
            if (!newPassword.equals(confirmPassword)) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "비밀번호 확인이 일치하지 않습니다."
                ));
            }

            // 임시 비밀번호 강제 변경(isPasswordChanged=false)이면 현재 비밀번호 검증 생략
            boolean mustChangePassword = Boolean.FALSE.equals(dbUser.getIsPasswordChanged());
            if (!mustChangePassword) {
                if (currentPassword.isEmpty()
                        || !passwordService.matches(currentPassword, dbUser.getPassword())) {
                    return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "현재 비밀번호가 올바르지 않습니다."
                    ));
                }
            }

            // 새 비밀번호가 현재(임시) 비밀번호와 같은지 확인
            if (passwordService.matches(newPassword, dbUser.getPassword())) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "새 비밀번호는 현재 비밀번호와 달라야 합니다."
                ));
            }

            // 강제 변경 시 oldPassword=null — UserService 가 현재 비밀번호 대조를 건너뛴다
            userService.changePassword(
                dbUser.getId(),
                mustChangePassword ? null : currentPassword,
                newPassword
            );
            
            log.info("✅ 비밀번호 변경 성공: userId={}", dbUser.getId());

            // 세션·토큰용 최신 User (새 해시 + isPasswordChanged=true)
            User refreshedUser = userService.findById(dbUser.getId()).orElse(null);
            if (refreshedUser == null) {
                refreshedUser = dbUser;
                refreshedUser.setIsPasswordChanged(Boolean.TRUE);
            }
            SessionUtils.setCurrentUser(session, refreshedUser);

            Map<String, Object> body = new HashMap<>();
            body.put("success", true);
            body.put("message", "비밀번호가 성공적으로 변경되었습니다.");
            body.put("requiresPasswordChange", false);
            try {
                AuthResponse issued = authService.issueTokensForUser(refreshedUser, httpRequest);
                if (issued != null && issued.getToken() != null) {
                    body.put("accessToken", issued.getToken());
                }
                if (issued != null && issued.getRefreshToken() != null) {
                    body.put("refreshToken", issued.getRefreshToken());
                }
            } catch (Exception tokenError) {
                log.warn("비밀번호 변경 후 토큰 재발급 실패: userId={}, error={}",
                    refreshedUser.getId(), tokenError.getMessage());
            }
            return ResponseEntity.ok(body);

        } catch (PasswordService.InvalidPasswordException e) {
            log.warn("비밀번호 변경 정책 거절: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
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
            log.info("📧 비밀번호 재설정 이메일 발송 요청: email={}", EmailLogMasking.maskForLog(email));
            
            // 이메일 설정 조회
            Map<String, Object> emailConfig = passwordConfigService.getEmailConfig();
            Map<String, Object> resetConfig = passwordConfigService.getPasswordResetConfig();
            
            // 비밀번호 재설정 이메일 발송
            boolean emailSent = passwordResetService.sendPasswordResetEmail(email);
            
            if (emailSent) {
                log.info("✅ 비밀번호 재설정 이메일 발송 성공: email={}", EmailLogMasking.maskForLog(email));
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "비밀번호 재설정 이메일이 발송되었습니다."
                ));
            } else {
                log.warn("⚠️ 비밀번호 재설정 이메일 발송 실패: email={}", EmailLogMasking.maskForLog(email));
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

            String newPassword = trimPassword(request.getNewPassword());
            String confirmPassword = trimPassword(request.getConfirmPassword());
            
            // 새 비밀번호 검증
            Map<String, Object> validationResult = passwordValidationService.validatePassword(newPassword);
            if (!(Boolean) validationResult.get("isValid")) {
                @SuppressWarnings("unchecked")
                Map<String, String> errMap = (Map<String, String>) validationResult.get("errors");
                String detail = firstPasswordPolicyMessage(errMap);
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", detail != null ? detail : "비밀번호가 정책을 만족하지 않습니다.",
                    "errors", validationResult.get("errors")
                ));
            }
            
            // 비밀번호 확인 일치 검증
            if (!newPassword.equals(confirmPassword)) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "비밀번호 확인이 일치하지 않습니다."
                ));
            }
            
            // 비밀번호 재설정 처리
            boolean resetSuccess = passwordResetService.resetPassword(request.getToken(), newPassword);
            
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
            
        } catch (PasswordService.InvalidPasswordException e) {
            log.warn("비밀번호 재설정 정책 거절: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        } catch (Exception e) {
            log.error("❌ 비밀번호 재설정 확인 실패: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "비밀번호 재설정 중 오류가 발생했습니다."
            ));
        }
    }

    /**
     * AuthController 로그인 trim 과 동일 — null 은 빈 문자열.
     *
     * @param value 원본 비밀번호
     * @return trim 된 값 (null → "")
     */
    private static String trimPassword(String value) {
        return value == null ? "" : value.trim();
    }

    private static String firstPasswordPolicyMessage(Map<String, String> errors) {
        if (errors == null || errors.isEmpty()) {
            return null;
        }
        return errors.values().iterator().next();
    }
}
