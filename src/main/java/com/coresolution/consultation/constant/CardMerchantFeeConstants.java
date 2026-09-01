package com.coresolution.consultation.constant;

import java.time.LocalDate;
import java.util.List;
import java.util.Locale;

/**
 * 카드 가맹점 수수료 관련 상수.
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

    /** 결제 수단 — 카드 (영문) */
    public static final String PAYMENT_METHOD_CARD = "CARD";

    /** 결제 수단 — 카드 (한글) */
    public static final String PAYMENT_METHOD_CARD_KO = "카드";

    /**
     * 매핑·결제 SSOT 카드 결제 수단 코드 (billing.js MAPPING_PAYMENT_METHOD_LABELS, CheckoutSameDayModal 등과 동일).
     * {@link #isCardPaymentMethod(String)} 판별에 사용.
     */
    public static final List<String> MAPPING_CARD_PAYMENT_METHOD_CODES = List.of(
            PAYMENT_METHOD_CARD,
            "CREDIT_CARD",
            "DEBIT_CARD",
            "CARD_TERMINAL",
            PAYMENT_METHOD_CARD_KO
    );

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
     * {@link #MAPPING_CARD_PAYMENT_METHOD_CODES} 기준 (대소문자 무시, 한글 카드는 정확 일치).
     *
     * @param paymentMethod 결제 수단 문자열
     * @return 카드로 명확히 판별되면 true
     */
    public static boolean isCardPaymentMethod(String paymentMethod) {
        if (paymentMethod == null || paymentMethod.isBlank()) {
            return false;
        }
        String trimmed = paymentMethod.trim();
        if (PAYMENT_METHOD_CARD_KO.equals(trimmed)) {
            return true;
        }
        String upper = trimmed.toUpperCase(Locale.ROOT);
        for (String code : MAPPING_CARD_PAYMENT_METHOD_CODES) {
            if (PAYMENT_METHOD_CARD_KO.equals(code)) {
                continue;
            }
            if (code.equalsIgnoreCase(upper)) {
                return true;
            }
        }
        return false;
    }
}
