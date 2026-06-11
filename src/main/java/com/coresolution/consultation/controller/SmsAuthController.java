package com.coresolution.consultation.controller;

import java.util.HashMap;
import java.util.Map;
import com.coresolution.consultation.service.SmsAuthService;
import com.coresolution.consultation.util.PhoneLogMasking;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * SMS 인증 컨트롤러 (레거시).
 *
 * <p>표준화 v2 (B4, 2026-06-12) 이전 클라이언트 호환을 위한 진입점.
 * 신규 코드와 프론트엔드는 SSOT 경로 {@code /api/v1/auth/sms/send}
 * (={@link com.coresolution.consultation.controller.AuthController#sendSmsCode}) 및
 * {@code /api/v1/auth/sms/verify} 를 사용해야 한다.
 *
 * <p><b>경고</b>: 본 컨트롤러의 응답·로그에서 OTP 평문 노출은 모두 제거되었으나,
 * 향후 라우팅 차단 PR 에서 본 클래스 자체를 제거 예정이다 (PR #227 SSOT 정리).
 *
 * @deprecated PR #224 의 {@code /api/v1/auth/sms/send} SSOT 로 일원화 권장.
 *     본 경로(`send-code`/`verify-code`) 는 추후 라우팅 차단 예정.
 */
@Deprecated(since = "2026-06-12", forRemoval = false)
@Slf4j
@RestController
@RequestMapping("/api/v1/auth/sms") // 표준화 2025-12-05: 레거시 경로 제거
@RequiredArgsConstructor
public class SmsAuthController extends BaseApiController {
    
    private final SmsAuthService smsAuthService;
    
    /**
     * SMS 인증번호 발송
     * @param phoneNumber 전화번호
     * @return 발송 결과
     */
    @PostMapping("/send-code")
    public ResponseEntity<ApiResponse<Map<String, Object>>> sendVerificationCode(@RequestParam String phoneNumber) {
        log.info("📱 SMS 인증번호 발송 요청 - 전화번호: {}", PhoneLogMasking.maskForLog(phoneNumber));

        if (phoneNumber == null || phoneNumber.trim().isEmpty()) {
            throw new IllegalArgumentException("전화번호를 입력해주세요.");
        }

        String verificationCode = smsAuthService.sendVerificationCode(phoneNumber);

        if (verificationCode == null) {
            throw new IllegalStateException("SMS 인증이 비활성화되어 있습니다. 관리자에게 문의하세요.");
        }

        Map<String, Object> response = new HashMap<>();
        response.put("message", "인증번호가 발송되었습니다.");

        // 테스트 모드 boolean flag 만 반환 (B4 hotfix: 평문 OTP 응답·로그 금지)
        if (smsAuthService.isTestMode()) {
            response.put("testMode", true);
        }

        return success("인증번호가 발송되었습니다.", response);
    }
    
    /**
     * SMS 인증번호 검증
     * @param phoneNumber 전화번호
     * @param verificationCode 인증번호
     * @return 검증 결과
     */
    @PostMapping("/verify-code")
    public ResponseEntity<ApiResponse<Map<String, Object>>> verifyCode(
            @RequestParam String phoneNumber,
            @RequestParam String verificationCode,
            @RequestParam String sentCode) {

        log.info("🔍 SMS 인증번호 검증 요청 - 전화번호: {}", PhoneLogMasking.maskForLog(phoneNumber));

        if (phoneNumber == null || phoneNumber.trim().isEmpty()) {
            throw new IllegalArgumentException("전화번호를 입력해주세요.");
        }

        if (verificationCode == null || verificationCode.trim().isEmpty()) {
            throw new IllegalArgumentException("인증번호를 입력해주세요.");
        }

        if (sentCode == null || sentCode.trim().isEmpty()) {
            throw new IllegalArgumentException("발송된 인증번호 정보가 없습니다. 다시 발송해주세요.");
        }

        boolean isValid = smsAuthService.verifyCode(phoneNumber, verificationCode, sentCode);

        Map<String, Object> data = new HashMap<>();
        data.put("verified", isValid);

        if (isValid) {
            log.info("✅ SMS 인증 성공 - 전화번호: {}", PhoneLogMasking.maskForLog(phoneNumber));
            return success("인증이 완료되었습니다.", data);
        } else {
            log.warn("❌ SMS 인증 실패 - 전화번호: {}", PhoneLogMasking.maskForLog(phoneNumber));
            throw new IllegalArgumentException("인증번호가 일치하지 않습니다.");
        }
    }
    
    /**
     * SMS 인증 설정 상태 확인
     * @return SMS 인증 사용 가능 여부
     */
    @GetMapping("/status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSmsAuthStatus() {
        boolean enabled = smsAuthService.isSmsAuthEnabled();
        boolean testMode = smsAuthService.isTestMode();
        
        Map<String, Object> data = new HashMap<>();
        data.put("enabled", enabled);
        data.put("testMode", testMode);
        
        String message = enabled ? 
            (testMode ? "SMS 인증이 활성화되어 있습니다. (테스트 모드)" : "SMS 인증이 활성화되어 있습니다. (실제 모드)") :
            "SMS 인증이 비활성화되어 있습니다. (비용 절약 모드)";
        
        return success(message, data);
    }
}
