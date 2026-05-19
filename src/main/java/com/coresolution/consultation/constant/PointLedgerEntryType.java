package com.coresolution.consultation.constant;

/**
 * 포인트 원장 유형 — hold / release / commit / PAID 적립 earn.
 *
 * @author MindGarden
 * @since 2026-05-14
 */
public enum PointLedgerEntryType {
    HOLD,
    RELEASE,
    COMMIT,
    EARN,
    /** PAID 시 COMMIT(사용 확정) 역분개 — 환불 시 사용 포인트 복원 */
    COMMIT_REVERSAL,
    /** PAID 적립(EARN) 회수 — 잔액 부족 시 0까지, 마이너스 금지 */
    CLAWBACK
}
