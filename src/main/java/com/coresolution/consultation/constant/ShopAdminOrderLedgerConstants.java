package com.coresolution.consultation.constant;

import java.util.List;
import java.util.Set;

/**
 * 어드민 온라인 주문 목록 — 세그먼트(쌍장부 상태) 값.
 *
 * <p>한 주문은 세그먼트 하나에만 들어간다. 결제 완료(PAID)는 만료 임박·기한 만료·정합 필요가 아닌 주문.</p>
 *
 * @author MindGarden
 * @since 2026-09-29
 */
public final class ShopAdminOrderLedgerConstants {

    public static final String SEGMENT_ALL = "ALL";
    public static final String STATE_PAID = "PAID";
    public static final String STATE_EXPIRING_SOON = ShopOrderExpiryConstants.STATE_EXPIRING_SOON;
    public static final String STATE_EXPIRED = ShopOrderExpiryConstants.STATE_EXPIRED;
    public static final String STATE_PENDING = "PENDING";
    public static final String STATE_RECONCILE = "RECONCILE";
    public static final String STATE_REFUNDED = "REFUNDED";
    /** 결제 시간 초과·취소 (「미결제 · 시간 초과」) */
    public static final String STATE_UNPAID = "UNPAID";

    /** 세그먼트 순서 (응답 counts 키) */
    public static final List<String> SEGMENTS = List.of(
            SEGMENT_ALL,
            STATE_PAID,
            STATE_EXPIRING_SOON,
            STATE_EXPIRED,
            STATE_PENDING,
            STATE_RECONCILE,
            STATE_REFUNDED,
            STATE_UNPAID);

    /** 이미 받은 돈 (요약 들어온 돈) */
    public static final Set<String> COLLECTED_STATES = Set.of(STATE_PAID, STATE_EXPIRING_SOON, STATE_EXPIRED);

    /** 활성 회기 부여 (요약 회기) */
    public static final Set<String> ACTIVE_GRANT_STATES = Set.of(STATE_PAID, STATE_EXPIRING_SOON);

    private ShopAdminOrderLedgerConstants() {
    }
}
