package com.coresolution.consultation.constant.admin;

/**
 * 관리자 일괄 매칭 결제 처리(결제 확인·취소) 상수.
 *
 * @author CoreSolution
 * @since 2026-10-04
 */
public final class AdminBulkMappingConstants {

    /** 한 요청에 담을 수 있는 mappingIds 최대 개수 (중복 포함 원본 목록 기준) */
    public static final int MAX_MAPPING_IDS_PER_REQUEST = 100;

    /** 일괄 결제 확인 시 결제 참조값 접두사 (뒤에 처리 시각 epoch millis) */
    public static final String BULK_CONFIRM_PAYMENT_REFERENCE_PREFIX = "ADMIN_CONFIRMED_";

    /** 매칭별 결과 — 원인을 안내할 수 없는 처리 실패 코드 (그 매칭 변경은 롤백) */
    public static final String ITEM_FAILURE_CODE_PROCESSING_FAILED = "BULK_ITEM_PROCESSING_FAILED";

    private AdminBulkMappingConstants() {
    }
}
