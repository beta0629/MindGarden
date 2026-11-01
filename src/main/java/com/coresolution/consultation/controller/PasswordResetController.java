package com.coresolution.consultation.controller;

import java.util.HashMap;
import java.util.Map;
import com.coresolution.consultation.dto.auth.PasswordResetSmsResponse;
import com.coresolution.consultation.service.PasswordResetService;
import com.coresolution.consultation.service.PasswordResetSmsService;
import com.coresolution.consultation.util.EmailLogMasking;
import com.coresolution.consultation.util.PhoneLogMasking;
import com.coresolution.core.util.HttpRequestClientIp;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 비밀번호 재설정 컨트롤러
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-17
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/auth/password-reset") // 표준화 2025-12-05: 레거시 경로 제거
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PasswordResetController {
    
    private final PasswordResetService passwordResetService;
    private final PasswordResetSmsService passwordResetSmsService;
    
    /**
     * 비밀번호 재설정 이메일 발송
     */
    @PostMapping("/send-email")
    public ResponseEntity<Map<String, Object>> sendResetEmail(
            @Valid @RequestBody SendResetEmailRequest request) {
        
        log.info("🔑 비밀번호 재설정 이메일 발송 API 호출: {}", EmailLogMasking.maskForLog(request.getEmail()));
        
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
     * 휴대폰 비밀번호 찾기 — OTP 발송.
     *
     * <p>번호 존재 여부는 노출하지 않는다. 성공 시 challengeToken 포함(스키마 동일).</p>
     */
    @PostMapping("/sms/send-otp")
    public ResponseEntity<Map<String, Object>> sendSmsOtp(
            @Valid @RequestBody SendSmsOtpRequest request,
            HttpServletRequest httpRequest) {
        log.info("🔑 비밀번호 찾기 SMS OTP 발송 API: phone={}",
            PhoneLogMasking.maskForLog(request.getPhone()));
        try {
            PasswordResetSmsResponse result = passwordResetSmsService.sendOtp(
                request.getPhone(), HttpRequestClientIp.resolve(httpRequest));
            return ResponseEntity.ok(toSmsMap(result));
        } catch (Exception e) {
            log.error("❌ 비밀번호 찾기 SMS OTP 발송 API 오류", e);
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * 휴대폰 비밀번호 찾기 — OTP 검증 후 resetProofToken 발급.
     */
    @PostMapping("/sms/verify-otp")
    public ResponseEntity<Map<String, Object>> verifySmsOtp(
            @Valid @RequestBody VerifySmsOtpRequest request,
            HttpServletRequest httpRequest) {
        log.info("🔑 비밀번호 찾기 SMS OTP 검증 API: phone={}",
            PhoneLogMasking.maskForLog(request.getPhone()));
        try {
            PasswordResetSmsResponse result = passwordResetSmsService.verifyOtp(
                request.getPhone(),
                request.getVerificationCode(),
                request.getChallengeToken(),
                HttpRequestClientIp.resolve(httpRequest));
            return ResponseEntity.ok(toSmsMap(result));
        } catch (Exception e) {
            log.error("❌ 비밀번호 찾기 SMS OTP 검증 API 오류", e);
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "인증 처리 중 오류가 발생했습니다. 다시 시도해주세요.");
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * 휴대폰 비밀번호 찾기 — 임시 비밀번호 SMS 발송.
     *
     * <p>평문 비밀번호는 응답에 포함하지 않는다. SNS/미존재도 동일 성공 메시지.</p>
     */
    @PostMapping("/sms/send-temp-password")
    public ResponseEntity<Map<String, Object>> sendTempPassword(
            @Valid @RequestBody SendTempPasswordRequest request,
            HttpServletRequest httpRequest) {
        log.info("🔑 비밀번호 찾기 임시 비밀번호 SMS 발송 API");
        try {
            PasswordResetSmsResponse result = passwordResetSmsService.sendTempPassword(
                request.getResetProofToken(), HttpRequestClientIp.resolve(httpRequest));
            return ResponseEntity.ok(toSmsMap(result));
        } catch (Exception e) {
            log.error("❌ 비밀번호 찾기 임시 비밀번호 SMS 발송 API 오류", e);
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
            return ResponseEntity.internalServerError().body(response);
        }
    }

    private static Map<String, Object> toSmsMap(PasswordResetSmsResponse result) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", result.isSuccess());
        response.put("message", result.getMessage());
        if (result.getCode() != null) {
            response.put("code", result.getCode());
        }
        if (result.getChallengeToken() != null) {
            response.put("challengeToken", result.getChallengeToken());
        }
        if (result.getResetProofToken() != null) {
            response.put("resetProofToken", result.getResetProofToken());
        }
        if (result.getMaskedPhone() != null) {
            response.put("maskedPhone", result.getMaskedPhone());
        }
        if (result.getExpiresInSeconds() != null) {
            response.put("expiresInSeconds", result.getExpiresInSeconds());
        }
        if (result.getResendCooldownSeconds() != null) {
            response.put("resendCooldownSeconds", result.getResendCooldownSeconds());
        }
        if (result.getRetryAfterSeconds() != null) {
            response.put("retryAfterSeconds", result.getRetryAfterSeconds());
        }
        return response;
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

    /**
     * SMS OTP 발송 요청
     */
    public static class SendSmsOtpRequest {
        @NotBlank(message = "휴대폰 번호는 필수입니다")
        private String phone;

        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }
    }

    /**
     * SMS OTP 검증 요청
     */
    public static class VerifySmsOtpRequest {
        @NotBlank(message = "휴대폰 번호는 필수입니다")
        private String phone;

        @NotBlank(message = "인증번호는 필수입니다")
        @Size(min = 4, max = 10, message = "인증번호 형식이 올바르지 않습니다")
        private String verificationCode;

        @NotBlank(message = "challengeToken은 필수입니다")
        private String challengeToken;

        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }

        public String getVerificationCode() { return verificationCode; }
        public void setVerificationCode(String verificationCode) {
            this.verificationCode = verificationCode;
        }

        public String getChallengeToken() { return challengeToken; }
        public void setChallengeToken(String challengeToken) {
            this.challengeToken = challengeToken;
        }
    }

    /**
     * 임시 비밀번호 SMS 발송 요청
     */
    public static class SendTempPasswordRequest {
        @NotBlank(message = "resetProofToken은 필수입니다")
        private String resetProofToken;

        public String getResetProofToken() { return resetProofToken; }
        public void setResetProofToken(String resetProofToken) {
            this.resetProofToken = resetProofToken;
        }
    }
}
