package com.coresolution.consultation.constant;

/**
 * 주문 이행 이벤트 메시지 상수.
 *
 * @author MindGarden
 * @since 2026-05-19
 */
public final class ShopOrderFulfillmentMessages {

    /** 상담 패키지 ERP confirm-payment 연동 완료 */
    public static final String CONSULTATION_ERP_COMPLETED =
            "Consultation package fulfilled; ERP income synced via confirm-payment";

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
