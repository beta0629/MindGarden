package com.coresolution.consultation.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import lombok.Data;

/**
 * SMS 인증 설정 프로퍼티
 * 비용 절약을 위해 사용 여부를 제어할 수 있도록 설계
 */
@Data
@Component
@ConfigurationProperties(prefix = "sms.auth")
public class SmsProperties {
    
    /**
     * SMS 인증 사용 여부 (기본값: false - 비용 절약)
     */
    private boolean enabled = false;
    
    /**
     * SMS 제공업체 (nhn, twilio, aligo 등)
     */
    private String provider = "nhn";
    
    /**
     * API 키
     */
    private String apiKey;
    
    /**
     * API 시크릿
     */
    private String apiSecret;
    
    /**
     * 발신자 번호
     */
    private String senderNumber;
    
    /**
     * 테스트 모드 여부 (기본값: true - 실제 SMS 발송 안함)
     */
    private boolean testMode = true;
    
    /**
     * 테스트용 고정 인증번호
     */
    private String mockVerificationCode = "123456";
    
    /**
     * SMS 인증이 활성화되어 있고 실제 모드인지 확인
     */
    public boolean isProductionMode() {
        return enabled && !testMode;
    }
    
    /**
     * SMS 인증이 사용 가능한지 확인 (테스트 모드 포함)
     */
    public boolean isAvailable() {
        return enabled;
    }
}
