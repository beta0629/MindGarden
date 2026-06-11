package com.coresolution.consultation.service;

/**
 * SMS OTP 인증 코드 저장·검증 SSOT.
 *
 * <p>마이페이지 휴대전화 변경(Phase A) 등 OTP 단일 사용·5분 TTL 정책이 필요한 흐름에서
 * 재사용하기 위해 기존 {@code AuthController} 내부 메모리 저장을 Spring Bean 으로 추출했다.
 * 본 인터페이스는 정규화된 한국 휴대폰 숫자열(예: {@code 01012345678}) 을 키로 사용한다.</p>
 *
 * @author MindGarden
 * @since 2026-06-11
 */
public interface SmsOtpVerificationService {

    /**
     * OTP 발송 직후 호출. 정규화된 휴대폰 번호와 함께 6자리 코드를 저장한다.
     * TTL 은 구현체가 보장한다 (5분 기본). 같은 번호로 재발송 시 직전 코드는 덮어쓴다.
     *
     * @param normalizedPhone {@link com.coresolution.consultation.util.LoginIdentifierUtils#normalizeAndValidateKoreanMobileForSms(String)} 결과
     * @param code            6자리 숫자 코드
     */
    void storeCode(String normalizedPhone, String code);

    /**
     * OTP 검증 후 단일 사용 처리. 일치하면 메모리에서 즉시 삭제한다.
     *
     * @param normalizedPhone 발송 시와 동일한 정규화된 번호
     * @param code            사용자가 입력한 6자리 코드
     * @return 코드가 일치하고 TTL 내였으면 true, 그 외 false
     */
    boolean verifyAndConsume(String normalizedPhone, String code);

    /**
     * 만료된 항목을 정리한다. 스케줄러나 테스트에서 사용. 일반 흐름에서는 verify 시점 lazy 삭제로 충분.
     */
    void evictExpired();
}
