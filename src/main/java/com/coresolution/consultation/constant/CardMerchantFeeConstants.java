package com.coresolution.consultation.constant;

import java.time.LocalDate;
import java.util.List;

/**
 * 카드 가맹점 수수료 관련 상수.
 * <p>
 * 결제 수단·카드 수수료 적용 여부는 {@link PaymentMethodSsotConstants} 및
 * {@link com.coresolution.consultation.service.PaymentMethodSsotService} 를 SSOT로 사용한다.
 * </p>
 *
 * @author CoreSolution
 * @since 2026-08-28
 */
public final class CardMerchantFeeConstants {

    /**
     * 카드 가맹점 수수료(평균 요율) 적용 시작일.
     * 거래일(또는 수입 기준일)이 이 날짜 미만이면 수수료 0. 요율 하드코딩이 아닌 정책 적용일 상수.
     */
    public static final LocalDate FEE_EFFECTIVE_FROM = LocalDate.of(2026, 9, 1);

    /** 레거시 연동 지출 relatedEntityType (V20260828_001~002 구간). 정리·soft-delete 용 */
    public static final String LEGACY_LINKED_EXPENSE_RELATED_ENTITY_TYPE = "CARD_MERCHANT_FEE";

    /** 레거시 자동 기록 지출 remarks 마커 */
    public static final String LEGACY_AUTO_REMARKS = "AUTO_CARD_MERCHANT_FEE";

    /** 기본 카드사 라벨 목록 (요율 없음 — UI 초기 행용) */
    public static final List<String> DEFAULT_ISSUER_LABELS = List.of(
            "신한",
            "삼성",
            "KB국민",
            "현대",
            "농협",
            "우리",
            "하나",
            "BC",
            "기타"
    );

    private CardMerchantFeeConstants() {
    }
}
