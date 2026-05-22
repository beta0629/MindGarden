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

    /**
     * 직전 {@link #sendSms(String, String)} 호출에서 발생한 오류 상세를 한 번만 조회한다.
     *
     * <p>구현체는 호출 스레드 단위(예: {@link ThreadLocal})로 상태를 유지하고,
     * 본 메서드 호출 시 반환과 동시에 내부 상태를 clear 해야 한다. 성공·정보 없음·
     * 미구현 프로바이더는 {@code null}을 반환한다.
     *
     * <p>형식 권장: {@code "Solapi 403 FORBIDDEN: {body...}"}와 같이 상태 코드 + 마스킹된 응답 본문.
     *
     * @return 직전 실패의 상세(상태코드, 응답 본문 등) 또는 {@code null}
     */
    default String consumeLastErrorDetail() {
        return null;
    }
}

