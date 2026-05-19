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

    /** 상담 패키지 — 매핑 ID 없음, ERP 연동 SKIPPED */
    public static final String CONSULTATION_MAPPING_MISSING_SKIPPED =
            "Consultation SKU: consultant_client_mapping_id missing; ERP sync skipped";

    /** 상담 패키지 ERP 연동 실패 (주문 PAID 유지) */
    public static final String CONSULTATION_ERP_SYNC_FAILED =
            "Consultation package fulfilled; ERP sync failed (order remains PAID)";

    /** 심리검사 SKU — Phase 3 psych-assessment 연동 대기 */
    public static final String ASSESSMENT_PENDING_PHASE3 =
            "Phase 3: psych-assessment fulfillment integration pending";

    /** 알 수 없는 카탈로그 카테고리 */
    public static final String UNKNOWN_CATEGORY_SKIPPED = "Unknown catalog category; fulfillment skipped";

    private ShopOrderFulfillmentMessages() {
    }
}
