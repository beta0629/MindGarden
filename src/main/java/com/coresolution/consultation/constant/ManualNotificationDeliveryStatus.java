package com.coresolution.consultation.constant;

/**
 * 수동 발송 수신자·발송 기록 상태.
 *
 * <p>PENDING → DISPATCHING(프로바이더 호출 직전 커밋) → SENT / FAILED / SKIPPED.
 * DISPATCHING 에서 서버가 멈추면 재시작 후 FAILED({@code DISPATCH_OUTCOME_UNKNOWN})로 닫고 다시 보내지 않는다.
 *
 * @author MindGarden
 * @since 2026-10-05
 */
public enum ManualNotificationDeliveryStatus {
    /** 아직 발송 전. 재개 시 이 상태만 이어서 보낸다. */
    PENDING,
    /** 프로바이더 호출 직전 기록됨. */
    DISPATCHING,
    /** 발송 성공(DRY_RUN 포함). */
    SENT,
    /** 발송 실패. */
    FAILED,
    /** 발송 대상 아님(푸시 토큰 없음·수신 거부 등). */
    SKIPPED;

    /**
     * 종료 상태 여부.
     *
     * @return SENT·FAILED·SKIPPED 이면 true
     */
    public boolean isTerminal() {
        return this == SENT || this == FAILED || this == SKIPPED;
    }
}
