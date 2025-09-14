package com.mindgarden.consultation.controller;

import java.util.HashMap;
import java.util.Map;
import com.mindgarden.consultation.service.SmsAuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * SMS 인증 컨트롤러
 * 비용 절약을 위해 설정 기반으로 동작 제어
 */
@Slf4j
@RestController
@RequestMapping("/api/sms-auth")
@RequiredArgsConstructor
public class SmsAuthController {
    
    private final SmsAuthService smsAuthService;
    
    /**
     * SMS 인증번호 발송
     * @param phoneNumber 전화번호
     * @return 발송 결과
     */
    @PostMapping("/send-code")
    public ResponseEntity<?> sendVerificationCode(@RequestParam String phoneNumber) {
        try {
            log.info("📱 SMS 인증번호 발송 요청 - 전화번호: {}", phoneNumber);
            
            // 전화번호 형식 검증
            if (phoneNumber == null || phoneNumber.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "전화번호를 입력해주세요."
                ));
            }
            
            // SMS 인증번호 발송
            String verificationCode = smsAuthService.sendVerificationCode(phoneNumber);
            
            if (verificationCode == null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "SMS 인증이 비활성화되어 있습니다. 관리자에게 문의하세요."
                ));
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "인증번호가 발송되었습니다.");
            
            // 테스트 모드에서는 인증번호도 함께 반환 (개발 편의성)
            if (smsAuthService.isTestMode()) {
                response.put("verificationCode", verificationCode);
                response.put("testMode", true);
                log.info("🧪 테스트 모드: 인증번호 반환 - {}", verificationCode);
            }
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ SMS 인증번호 발송 오류: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "인증번호 발송 중 오류가 발생했습니다."
            ));
        }
    }
    
    /**
     * SMS 인증번호 검증
     * @param phoneNumber 전화번호
     * @param verificationCode 인증번호
     * @return 검증 결과
     */
    @PostMapping("/verify-code")
    public ResponseEntity<?> verifyCode(
            @RequestParam String phoneNumber,
            @RequestParam String verificationCode,
            @RequestParam String sentCode) {
        
        try {
            log.info("🔍 SMS 인증번호 검증 요청 - 전화번호: {}, 입력: {}", phoneNumber, verificationCode);
            
            // 입력값 검증
            if (phoneNumber == null || phoneNumber.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "전화번호를 입력해주세요."
                ));
            }
            
            if (verificationCode == null || verificationCode.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "인증번호를 입력해주세요."
                ));
            }
            
            if (sentCode == null || sentCode.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "발송된 인증번호 정보가 없습니다. 다시 발송해주세요."
                ));
            }
            
            // 인증번호 검증
            boolean isValid = smsAuthService.verifyCode(phoneNumber, verificationCode, sentCode);
            
            if (isValid) {
                log.info("✅ SMS 인증 성공 - 전화번호: {}", phoneNumber);
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "인증이 완료되었습니다.",
                    "verified", true
                ));
            } else {
                log.warn("❌ SMS 인증 실패 - 전화번호: {}", phoneNumber);
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "인증번호가 일치하지 않습니다.",
                    "verified", false
                ));
            }
            
        } catch (Exception e) {
            log.error("❌ SMS 인증번호 검증 오류: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "인증번호 검증 중 오류가 발생했습니다."
            ));
        }
    }
    
    /**
     * SMS 인증 설정 상태 확인
     * @return SMS 인증 사용 가능 여부
     */
    @GetMapping("/status")
    public ResponseEntity<?> getSmsAuthStatus() {
        try {
            boolean enabled = smsAuthService.isSmsAuthEnabled();
            boolean testMode = smsAuthService.isTestMode();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("enabled", enabled);
            response.put("testMode", testMode);
            response.put("message", enabled ? 
                (testMode ? "SMS 인증이 활성화되어 있습니다. (테스트 모드)" : "SMS 인증이 활성화되어 있습니다. (실제 모드)") :
                "SMS 인증이 비활성화되어 있습니다. (비용 절약 모드)");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ SMS 인증 상태 확인 오류: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "SMS 인증 상태 확인 중 오류가 발생했습니다."
            ));
        }
    }
}
