package com.coresolution.consultation.service.erp.financial;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * 테넌트 카드 수수료 요율 설정 기반 {@code cardMerchantFeeAmount} 산출.
 * <p>
 * 분개는 {@code FinancialTransaction.cardMerchantFeeAmount}만 사용하며 별도 EXPENSE 거래를 만들지 않습니다.
 * 요율은 {@code averageRatePercent}만 사용합니다(카드사 issuer override 무시).
 * </p>
 *
 * @author CoreSolution
 * @since 2026-08-28
 */
public interface CardMerchantFeeResolutionService {

    /**
     * 카드 결제 수입에 적용할 가맹점 수수료 금액을 산출합니다.
     *
     * @param tenantId        테넌트 ID
     * @param grossAmount     승인·청구 총액
     * @param paymentMethod   결제 수단 (CARD/카드 등). 카드가 아니면 0
     * @param cardIssuer      카드사 (시그니처 호환용 — 요율 산출에 사용하지 않음)
     * @param transactionDate 거래일(또는 수입 기준일). null이거나
     *                        {@link com.coresolution.consultation.constant.CardMerchantFeeConstants#FEE_EFFECTIVE_FROM}
     *                        미만이면 0
     * @return 수수료 금액(원). 요율 없음·카드 아님·적용일 전 → 0
     */
    BigDecimal resolveFeeAmount(String tenantId, BigDecimal grossAmount, String paymentMethod,
            String cardIssuer, LocalDate transactionDate);
}
