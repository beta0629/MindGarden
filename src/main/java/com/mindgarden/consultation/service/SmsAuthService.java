package com.mindgarden.consultation.service;

import java.util.Random;
import com.mindgarden.consultation.config.SmsProperties;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * SMS 인증 서비스
 * 비용 절약을 위해 설정 기반으로 동작 제어
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SmsAuthService {
    
    private final SmsProperties smsProperties;
    
    /**
     * SMS 인증번호 발송
     * @param phoneNumber 전화번호
     * @return 발송된 인증번호 (테스트 모드에서는 고정값)
     */
    public String sendVerificationCode(String phoneNumber) {
        log.info("📱 SMS 인증번호 발송 요청 - 전화번호: {}, SMS 활성화: {}, 테스트 모드: {}", 
                phoneNumber, smsProperties.isEnabled(), smsProperties.isTestMode());
        
        if (!smsProperties.isAvailable()) {
            log.warn("⚠️ SMS 인증이 비활성화되어 있습니다. 설정을 확인해주세요.");
            return null;
        }
        
        String verificationCode;
        
        if (smsProperties.isTestMode()) {
            // 테스트 모드: 고정 인증번호 사용 (비용 절약)
            verificationCode = smsProperties.getMockVerificationCode();
            log.info("🧪 테스트 모드: 고정 인증번호 사용 - {}", verificationCode);
        } else {
            // 실제 모드: 랜덤 인증번호 생성 및 실제 SMS 발송
            verificationCode = generateVerificationCode();
            boolean sent = sendActualSms(phoneNumber, verificationCode);
            
            if (!sent) {
                log.error("❌ SMS 발송 실패");
                return null;
            }
            
            log.info("✅ SMS 발송 성공 - 인증번호: {}", verificationCode);
        }
        
        return verificationCode;
    }
    
    /**
     * 인증번호 검증
     * @param phoneNumber 전화번호
     * @param inputCode 입력된 인증번호
     * @param sentCode 발송된 인증번호
     * @return 검증 성공 여부
     */
    public boolean verifyCode(String phoneNumber, String inputCode, String sentCode) {
        log.info("🔍 SMS 인증번호 검증 - 전화번호: {}, 입력: {}, 발송: {}", 
                phoneNumber, inputCode, sentCode);
        
        if (inputCode == null || sentCode == null) {
            log.warn("⚠️ 인증번호가 null입니다.");
            return false;
        }
        
        boolean isValid = inputCode.equals(sentCode);
        log.info("{} SMS 인증번호 검증 결과: {}", isValid ? "✅" : "❌", isValid);
        
        return isValid;
    }
    
    /**
     * SMS 인증 설정 상태 확인
     * @return SMS 인증 사용 가능 여부
     */
    public boolean isSmsAuthEnabled() {
        return smsProperties.isAvailable();
    }
    
    /**
     * 테스트 모드 여부 확인
     * @return 테스트 모드 여부
     */
    public boolean isTestMode() {
        return smsProperties.isTestMode();
    }
    
    /**
     * 인증번호 생성 (6자리 랜덤 숫자)
     */
    private String generateVerificationCode() {
        Random random = new Random();
        int code = 100000 + random.nextInt(900000); // 100000 ~ 999999
        return String.valueOf(code);
    }
    
    /**
     * 실제 SMS 발송 (NHN 등 SMS API 연동)
     * TODO: 실제 SMS API 연동 구현 필요
     */
    private boolean sendActualSms(String phoneNumber, String verificationCode) {
        log.info("📤 실제 SMS 발송 시뮬레이션 - 전화번호: {}, 인증번호: {}", phoneNumber, verificationCode);
        
        // TODO: 실제 SMS API 연동
        // NHN Cloud SMS, Twilio, Aligo 등 API 호출
        // 현재는 시뮬레이션으로 성공 처리
        
        try {
            // SMS 발송 로직 구현
            // 1. API 키 검증
            // 2. 전화번호 형식 검증
            // 3. SMS 발송 API 호출
            // 4. 응답 처리
            
            log.info("✅ SMS 발송 성공 (시뮬레이션)");
            return true;
            
        } catch (Exception e) {
            log.error("❌ SMS 발송 실패: {}", e.getMessage());
            return false;
        }
    }
}
