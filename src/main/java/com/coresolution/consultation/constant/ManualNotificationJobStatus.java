package com.coresolution.consultation.constant;

/**
 * 수동 발송 작업 상태.
 *
 * <pre>
 * PENDING ──claim──▶ RUNNING ──모든 수신자 종료──▶ COMPLETED
 *    ▲                 │ 점유 만료(서버 재시작 등) → 다른 실행자가 claim 해 이어서 실행
 *    └─────────────────┘ 실행 불가 오류(템플릿 매핑 없음 등) → FAILED
 * </pre>
 *
 * @author MindGarden
 * @since 2026-10-05
 */
public enum ManualNotificationJobStatus {
    /** 생성됨, 아직 실행자가 집어 가지 않음. */
    PENDING,
    /** 실행 중(lease_owner·lease_until 로 점유). */
    RUNNING,
    /** 모든 수신자 처리 종료(성공·실패·스킵 집계). */
    COMPLETED,
    /** 실행 불가 오류로 종료. 남은 PENDING 수신자는 발송하지 않는다. */
    FAILED;

    /**
     * 종료 상태 여부.
     *
     * @return COMPLETED·FAILED 이면 true
     */
    public boolean isTerminal() {
        return this == COMPLETED || this == FAILED;
    }
}
