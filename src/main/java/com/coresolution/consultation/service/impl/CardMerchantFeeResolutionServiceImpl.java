package com.coresolution.consultation.service.impl;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import com.coresolution.consultation.constant.CardMerchantFeeConstants;
import com.coresolution.consultation.entity.erp.financial.CardMerchantFeeSettings;
import com.coresolution.consultation.repository.erp.financial.CardMerchantFeeSettingsRepository;
import com.coresolution.consultation.service.erp.financial.CardMerchantFeeResolutionService;
import com.coresolution.consultation.util.CardMerchantFeeCalculationUtil;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 테넌트 카드 수수료 요율 설정 기반 수수료 금액 산출 구현.
 * <p>
 * issuerRates는 계산에 사용하지 않으며 {@code averageRatePercent}만 적용합니다.
 * </p>
 *
 * @author CoreSolution
 * @since 2026-08-28
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CardMerchantFeeResolutionServiceImpl implements CardMerchantFeeResolutionService {

    private final CardMerchantFeeSettingsRepository settingsRepository;

    @Override
    public BigDecimal resolveFeeAmount(String tenantId, BigDecimal grossAmount, String paymentMethod,
            String cardIssuer, LocalDate transactionDate) {
        if (tenantId == null || tenantId.isBlank()) {
            return BigDecimal.ZERO;
        }
        if (transactionDate == null
                || transactionDate.isBefore(CardMerchantFeeConstants.FEE_EFFECTIVE_FROM)) {
            return BigDecimal.ZERO;
        }
        if (!CardMerchantFeeConstants.isCardPaymentMethod(paymentMethod)) {
            return BigDecimal.ZERO;
        }
        if (grossAmount == null || grossAmount.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }

        // cardIssuer는 시그니처 호환용 — 요율 산출에 사용하지 않음
        BigDecimal rate = resolveRatePercent(tenantId);
        if (rate == null || rate.compareTo(BigDecimal.ZERO) <= 0) {
            log.debug("카드 수수료 산출 생략: 요율 없음, tenantId={}", tenantId);
            return BigDecimal.ZERO;
        }

        return CardMerchantFeeCalculationUtil.calculateFee(grossAmount, rate);
    }

    /**
     * 평균 요율만 반환. issuerRates는 무시합니다.
     */
    private BigDecimal resolveRatePercent(String tenantId) {
        Optional<CardMerchantFeeSettings> settingsOpt =
                settingsRepository.findByTenantIdAndIsDeletedFalse(tenantId);
        if (settingsOpt.isEmpty()) {
            return null;
        }
        BigDecimal average = settingsOpt.get().getAverageRatePercent();
        if (average != null && average.compareTo(BigDecimal.ZERO) > 0) {
            return average;
        }
        return null;
    }
}
