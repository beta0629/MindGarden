package com.coresolution.consultation.service;

import java.util.List;
import java.util.Random;
import com.coresolution.consultation.config.SmsProperties;
import com.coresolution.consultation.dto.TenantSmsEffectiveCredentials;
import com.coresolution.consultation.service.sms.SmsProvider;
import com.coresolution.consultation.util.LoginIdentifierUtils;
import com.coresolution.core.context.TenantContextHolder;
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
    private final TenantSmsSettingsService tenantSmsSettingsService;
    private final List<SmsProvider> smsProviders;
    
    /**
     * SMS 인증번호 발송
     * @param phoneNumber 전화번호
     * @return 발송된 인증번호 (테스트 모드에서는 고정값)
     */
    public String sendVerificationCode(String phoneNumber) {
        String normalizedPhone = LoginIdentifierUtils.normalizeAndValidateKoreanMobileForSms(phoneNumber);
        log.info("📱 SMS 인증번호 발송 요청 - 전화번호: {}, SMS 활성화: {}, 테스트 모드: {}", 
                normalizedPhone, isEffectiveSmsEnabled(), smsProperties.isTestMode());
        
        if (!isEffectiveSmsEnabled()) {
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
            boolean sent = sendActualSms(normalizedPhone, verificationCode);
            
            if (!sent) {
                log.error("❌ SMS 발송 실패");
                return null;
            }
            
            log.info("✅ SMS 발송 성공(인증번호는 로그에 남기지 않음)");
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
        String normalizedPhone = LoginIdentifierUtils.normalizeAndValidateKoreanMobileForSms(phoneNumber);
        log.info("🔍 SMS 인증번호 검증 - 전화번호: {}, 입력: {}, 발송: {}", 
                normalizedPhone, inputCode, sentCode);
        
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
        return isEffectiveSmsEnabled();
    }

    /**
     * 전역 {@code sms.auth.enabled} 및 테넌트 SMS on/off를 모두 만족할 때만 true.
     *
     * @return 발송 게이트
     */
    private boolean isEffectiveSmsEnabled() {
        return smsProperties.isEnabled()
            && tenantSmsSettingsService.isSmsEnabledForTenant(TenantContextHolder.getTenantId());
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
     * 설정된 프로바이더를 사용하여 실제 SMS 발송
     */
    private boolean sendActualSms(String phoneNumber, String verificationCode) {
        log.info("📤 실제 SMS 발송 시작 - 전화번호: {}", phoneNumber);
        
        if (!smsProperties.isProductionMode()) {
            log.warn("⚠️ SMS 프로덕션 모드가 아닙니다. 설정을 확인해주세요.");
            return false;
        }
        
        TenantSmsEffectiveCredentials creds = tenantSmsSettingsService.getEffectiveCredentials(
            TenantContextHolder.getTenantId());
        String providerName = creds.provider();
        SmsProvider provider = smsProviders.stream()
            .filter(p -> p.getProviderName().equalsIgnoreCase(providerName))
            .findFirst()
            .orElse(null);
        
        if (provider == null) {
            log.error("❌ SMS 프로바이더를 찾을 수 없습니다: {}", providerName);
            return false;
        }
        
        if (!provider.isConfigured()) {
            log.error("❌ SMS 프로바이더 설정이 완료되지 않았습니다: {}", providerName);
            return false;
        }
        
        try {
            // SMS 메시지 구성
            String senderLabel = creds.senderNumber() != null && !creds.senderNumber().isEmpty()
                ? creds.senderNumber()
                : "CoreSolution";
            String message = String.format("[%s] 인증번호는 %s입니다.", senderLabel, verificationCode);
            
            // SMS 발송
            boolean success = provider.sendSms(phoneNumber, message);
            
            if (success) {
                log.info("✅ SMS 발송 성공 - 전화번호: {}, 프로바이더: {}", phoneNumber, providerName);
            } else {
                log.error("❌ SMS 발송 실패 - 전화번호: {}, 프로바이더: {}", phoneNumber, providerName);
            }
            
            return success;
            
        } catch (Exception e) {
            log.error("❌ SMS 발송 중 오류 발생: {}", e.getMessage(), e);
            return false;
        }
    }
}
