package com.coresolution.consultation.service.erp.financial;

import com.coresolution.consultation.dto.CardMerchantFeeSettingsRequest;
import com.coresolution.consultation.dto.CardMerchantFeeSettingsResponse;

/**
 * 카드 가맹점 수수료 설정 서비스.
 *
 * @author CoreSolution
 * @since 2026-08-28
 */
public interface CardMerchantFeeSettingsService {

    /**
     * 테넌트 카드 수수료 설정 조회. 미설정 시 기본 카드사 라벨만 반환.
     *
     * @return 설정 응답
     */
    CardMerchantFeeSettingsResponse getSettings();

    /**
     * 테넌트 카드 수수료 설정 저장(upsert).
     *
     * @param request 저장 요청
     * @return 저장된 설정
     */
    CardMerchantFeeSettingsResponse saveSettings(CardMerchantFeeSettingsRequest request);
}
