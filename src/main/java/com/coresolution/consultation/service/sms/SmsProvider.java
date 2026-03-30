package com.coresolution.consultation.service.sms;

/**
 * SMS 프로바이더 인터페이스
 * 다양한 SMS 서비스 제공업체를 지원하기 위한 인터페이스
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-20
 */
public interface SmsProvider {
    
    /**
     * SMS 발송
     * 
     * @param phoneNumber 수신자 전화번호
     * @param message 발송할 메시지
     * @return 발송 성공 여부
     */
    boolean sendSms(String phoneNumber, String message);
    
    /**
     * 프로바이더 이름
     * 
     * @return 프로바이더 이름 (예: "nhn", "twilio", "aligo")
     */
    String getProviderName();
    
    /**
     * 프로바이더 설정 유효성 검증
     * 
     * @return 설정이 유효한지 여부
     */
    boolean isConfigured();
}

