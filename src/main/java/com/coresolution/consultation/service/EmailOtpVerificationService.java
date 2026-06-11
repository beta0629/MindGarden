package com.coresolution.consultation.service;

/**
 * 이메일 OTP 인증 코드 저장·검증 SSOT.
 *
 * <p>마이페이지 이메일 변경(Phase B) 흐름에서 사용한다. {@link SmsOtpVerificationService} 와
 * 동일한 단일 사용·5분 TTL 정책을 따르되, 키는 정규화된 이메일({@code trim().toLowerCase()})
 * 을 사용한다. 사용자 키 변경이라는 민감 작업이므로 OTP 단일 사용이 반드시 보장되어야 하며,
 * 검증 성공 직후 후속 흐름(이메일 갱신·세션/토큰 무효화)이 이어져야 한다.</p>
 *
 * @author MindGarden
 * @since 2026-06-11
 */
public interface EmailOtpVerificationService {

    /**
     * OTP 발송 직후 호출. 정규화된 이메일과 6자리 코드를 저장한다.
     * 같은 이메일로 재발송 시 직전 코드는 덮어쓴다. TTL 은 구현체가 5분으로 보장한다.
     *
     * @param normalizedEmail {@code trim().toLowerCase()} 정규화된 이메일
     * @param code            6자리 숫자 코드
     */
    void storeCode(String normalizedEmail, String code);

    /**
     * OTP 검증 후 단일 사용 처리. 일치하면 메모리에서 즉시 삭제한다.
     *
     * @param normalizedEmail 발송 시와 동일한 정규화된 이메일
     * @param code            사용자가 입력한 6자리 코드
     * @return 코드가 일치하고 TTL 내였으면 true, 그 외 false
     */
    boolean verifyAndConsume(String normalizedEmail, String code);

    /**
     * 만료된 항목을 정리한다. 스케줄러나 테스트에서 사용. 일반 흐름에서는 verify 시점 lazy 삭제로 충분.
     */
    void evictExpired();
}
