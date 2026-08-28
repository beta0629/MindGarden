package com.coresolution.consultation.util;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * 카드 가맹점 수수료 계산 유틸리티.
 *
 * @author CoreSolution
 * @since 2026-08-28
 */
public final class CardMerchantFeeCalculationUtil {

    private CardMerchantFeeCalculationUtil() {
    }

    /**
     * 승인 금액과 요율(%)로 수수료를 계산한다. 반올림(ROUND_HALF_UP)하여 정수 원 단위.
     *
     * @param amount      승인·청구 총액
     * @param ratePercent 요율 (%)
     * @return 수수료 금액 (원)
     */
    public static BigDecimal calculateFee(BigDecimal amount, BigDecimal ratePercent) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        if (ratePercent == null || ratePercent.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        return amount.multiply(ratePercent)
                .divide(new BigDecimal("100"), 0, RoundingMode.HALF_UP);
    }
}
