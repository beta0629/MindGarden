package com.coresolution.consultation.service.erp.financial;

import com.coresolution.consultation.entity.erp.financial.FinancialTransaction;

/**
 * 카드 가맹점 수수료 자동 기록 서비스.
 *
 * @author CoreSolution
 * @since 2026-08-28
 */
public interface CardMerchantFeePostingService {

    /**
     * 수입 거래 저장·수정 후 카드 수수료를 적용한다.
     * CARD 결제가 아니거나 요율이 없으면 no-op.
     *
     * @param incomeTxn 저장된 수입 거래
     */
    void applyCardMerchantFeeForIncome(FinancialTransaction incomeTxn);
}
