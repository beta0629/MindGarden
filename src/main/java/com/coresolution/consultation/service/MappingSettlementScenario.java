package com.coresolution.consultation.service;

/**
 * 어드민 매칭 정산 API(결제 확인·입금 확인·승인) 알림 시나리오.
 * PG {@code Payment} 경로와 분리하여 삼중 발송을 방지한다.
 *
 * @author MindGarden
 * @since 2026-05-18
 */
public enum MappingSettlementScenario {

    /** {@code confirmPayment} — 미수금·결제 확인 */
    PAYMENT_CONFIRMED,
    /** {@code confirmDeposit} — 입금 확인 */
    DEPOSIT_CONFIRMED,
    /** {@code approveMapping} — 관리자 승인 */
    MAPPING_APPROVED
}
