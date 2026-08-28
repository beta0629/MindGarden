package com.coresolution.consultation.constant;

import java.util.List;

/**
 * 카드 가맹점 수수료 관련 상수.
 *
 * @author CoreSolution
 * @since 2026-08-28
 */
public final class CardMerchantFeeConstants {

    /** 연동 지출 relatedEntityType */
    public static final String RELATED_ENTITY_TYPE = "CARD_MERCHANT_FEE";

    /** 자동 기록 지출 remarks 마커 */
    public static final String AUTO_REMARKS = "AUTO_CARD_MERCHANT_FEE";

    /** 자동 기록 지출 설명 */
    public static final String EXPENSE_DESCRIPTION = "카드수수료";

    /** 결제 수단 — 카드 (영문) */
    public static final String PAYMENT_METHOD_CARD = "CARD";

    /** 결제 수단 — 카드 (한글) */
    public static final String PAYMENT_METHOD_CARD_KO = "카드";

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

    /**
     * 결제 수단이 카드인지 판별.
     *
     * @param paymentMethod 결제 수단 문자열
     * @return 카드로 명확히 판별되면 true
     */
    public static boolean isCardPaymentMethod(String paymentMethod) {
        if (paymentMethod == null || paymentMethod.isBlank()) {
            return false;
        }
        String trimmed = paymentMethod.trim();
        if (PAYMENT_METHOD_CARD.equalsIgnoreCase(trimmed)) {
            return true;
        }
        if (PAYMENT_METHOD_CARD_KO.equals(trimmed)) {
            return true;
        }
        return "CARD".equalsIgnoreCase(trimmed);
    }
}
