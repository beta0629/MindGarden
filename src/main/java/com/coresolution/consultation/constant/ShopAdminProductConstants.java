package com.coresolution.consultation.constant;

import java.util.List;

/**
 * 어드민 「상품」 통합 목록·판매 상태 상수.
 *
 * @author MindGarden
 * @since 2026-09-29
 */
public final class ShopAdminProductConstants {

    /** 패키지 요금(CONSULTATION_PACKAGE) 기반 상품 */
    public static final String KIND_PACKAGE = "PACKAGE";

    /** 직접 등록(패키지 미연결) SKU */
    public static final String KIND_LEGACY = "LEGACY";

    /** 세그먼트 — 전체 */
    public static final String SEGMENT_ALL = "ALL";

    /** 세그먼트 — 판매 중 */
    public static final String SEGMENT_ON_SALE = "ON_SALE";

    /** 세그먼트 — 판매 중지 */
    public static final String SEGMENT_STOPPED = "STOPPED";

    /** 세그먼트 목록 (counts 키 순서) */
    public static final List<String> SEGMENTS = List.of(SEGMENT_ALL, SEGMENT_ON_SALE, SEGMENT_STOPPED);

    /** 공통코드 extraData — 홈 공개 키 */
    public static final String EXTRA_PUBLIC_VISIBLE = "publicVisible";

    /** 판매 상태 대상 누락 */
    public static final String MSG_SALE_STATUS_TARGET_REQUIRED = "판매 상태를 바꿀 상품을 찾지 못했어요.";

    /** 상품 구분 오류 */
    public static final String MSG_SALE_STATUS_KIND_INVALID = "상품 구분이 올바르지 않아요.";

    /** extraData 저장 실패 */
    public static final String MSG_EXTRA_DATA_INVALID = "상품 추가 정보를 저장하지 못했어요.";

    private ShopAdminProductConstants() {
    }
}
