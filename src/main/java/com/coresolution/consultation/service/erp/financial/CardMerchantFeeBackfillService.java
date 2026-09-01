package com.coresolution.consultation.service.erp.financial;

import java.util.Map;

/**
 * 카드 가맹점 수수료 백필 — 적용일 이후 INCOME 거래 중 수수료 0/null 건을 SSOT로 재산출.
 *
 * @author CoreSolution
 * @since 2026-09-01
 */
public interface CardMerchantFeeBackfillService {

    /**
     * 테넌트 INCOME 거래 중 {@code cardMerchantFeeAmount} 가 0 또는 null 인 건을 스캔하고,
     * 매핑·결제에서 결제 수단을 해석해 {@link CardMerchantFeeResolutionService} 로 재계산 후 갱신합니다.
     *
     * @param tenantId 테넌트 ID
     * @return scanned, updated, skipped 건수
     */
    Map<String, Long> backfillCardMerchantFees(String tenantId);
}
