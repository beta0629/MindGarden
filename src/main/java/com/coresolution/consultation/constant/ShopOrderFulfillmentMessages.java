package com.coresolution.consultation.constant;

/**
 * 주문 이행 이벤트 메시지 상수.
 *
 * @author MindGarden
 * @since 2026-05-19
 */
public final class ShopOrderFulfillmentMessages {

    /**
     * 상담 패키지 이행 완료 — 입금 INCOME 이 {@code ensureConsultationDepositIncome} 으로
     * posted 합=cashDue 검증된 뒤에만 사용. confirm-payment 동기화 주장 금지.
     */
    public static final String CONSULTATION_ERP_COMPLETED =
            "Consultation package fulfilled; ERP deposit INCOME ensured/posted";

    /**
     * 상담 패키지 — 매핑 ID 없음 (레거시 SKIPPED 메시지; 신규는 FAILED 사용).
     *
     * @deprecated 신규 경로는 {@link #CONSULTATION_MAPPING_MISSING_FAILED}
     */
    @Deprecated
    public static final String CONSULTATION_MAPPING_MISSING_SKIPPED =
            "Consultation SKU: consultant_client_mapping_id missing; ERP sync skipped";

    /** 상담 패키지 — 매핑 ID 없음, 이행 FAILED(재시도 가능, fail-closed) */
    public static final String CONSULTATION_MAPPING_MISSING_FAILED =
            "Consultation SKU: consultant_client_mapping_id missing; fulfillment FAILED (retryable)";

    /** 상담 패키지 ERP/회기 이행 실패 (주문 PAID 유지, 이벤트 FAILED·재시도 가능) */
    public static final String CONSULTATION_ERP_SYNC_FAILED =
            "Consultation ERP sync failed (order remains PAID; fulfillment FAILED, retryable)";

    /**
     * afterCommit fulfill 예외로 이벤트가 비었을 때 영속하는 FAILED(retryable) sentinel 메시지.
     * 재이행 버튼 노출·fulfill-retry 게이트용.
     */
    public static final String AFTER_COMMIT_FULFILL_FAILED =
            "After-commit fulfill failed (order remains PAID; fulfillment FAILED, retryable)";

    /**
     * 주문 라인이 없을 때 afterCommit sentinel 에 쓰는 SKU 코드
     * ({@code uk_shop_fulfillment_order_sku} 충족용).
     */
    public static final String AFTER_COMMIT_FAILURE_SENTINEL_SKU = "__AFTER_COMMIT_FULFILL__";

    /**
     * 회기 활성화는 커밋됐으나 입금 INCOME SSOT 동기화만 실패(레거시 분리 TX mid-state).
     * 원자 fulfill 이후에는 신규 발생하지 않으나, COMPLETED 갭 heal 강등·과거 재시도에 유지한다.
     */
    public static final String CONSULTATION_INCOME_SYNC_FAILED =
            "Consultation sessions granted but ERP deposit INCOME sync failed"
                    + " (order remains PAID; fulfillment FAILED, retryable)";

    /** 심리검사 SKU — Phase 3 psych-assessment 연동 대기 */
    public static final String ASSESSMENT_PENDING_PHASE3 =
            "Phase 3: psych-assessment fulfillment integration pending";

    /** 알 수 없는 카탈로그 카테고리 */
    public static final String UNKNOWN_CATEGORY_SKIPPED = "Unknown catalog category; fulfillment skipped";

    /** 전액 환불 — 상담 회기 가산 원복 완료 */
    public static final String CONSULTATION_SESSIONS_REVERSED =
            "Consultation sessions reversed on full refund";

    /** Path B 전액 환불 ERP EXPENSE 사유 (createShopOrderMappingRefundExpense) */
    public static final String SHOP_ORDER_FULL_REFUND_ERP_REASON = "Shop order full refund";

    private ShopOrderFulfillmentMessages() {
    }
}
