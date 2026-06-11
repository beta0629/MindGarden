package com.coresolution.consultation.constant;

/**
 * OTP 발송 채널 코드.
 *
 * <p>{@link com.coresolution.consultation.service.OtpDeliveryService} 가 push-first → SMS 폴백
 * 정책에 따라 결정한 실제 발송 채널을 표현한다. FE 안내 메시지 분기·로깅·AuditLog 메타데이터에서
 * 동일 SSOT 값으로 사용한다.</p>
 *
 * @author MindGarden
 * @since 2026-06-11
 */
public enum OtpDeliveryChannel {

    /** Expo push 발송 성공 — 사용자가 앱에서 OTP 코드를 수신한다. */
    PUSH,

    /** SMS 게이트웨이 발송 성공 — 사용자가 문자로 OTP 코드를 수신한다. */
    SMS,

    /**
     * SMS 게이트웨이 미설정으로 stub(시뮬레이션) 모드로 처리된 경우. dev/test 에서는 정상,
     * 운영 profile 에서는 명시적 WARN 경고와 함께 사용된다(향후 SMS 게이트웨이 정식 연동 시 제거 예정).
     */
    SMS_STUB,

    /** 모든 채널 발송 실패 — 호출자(컨트롤러)는 사용자에게 재시도 안내 후 4xx/5xx 로 응답해야 한다. */
    FAILED
}
