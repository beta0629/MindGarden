package com.coresolution.consultation.service.impl;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.constant.CardMerchantFeeConstants;
import com.coresolution.consultation.entity.erp.financial.CardMerchantFeeIssuerRate;
import com.coresolution.consultation.entity.erp.financial.CardMerchantFeeSettings;
import com.coresolution.consultation.repository.erp.financial.CardMerchantFeeIssuerRateRepository;
import com.coresolution.consultation.repository.erp.financial.CardMerchantFeeSettingsRepository;
import com.coresolution.consultation.service.erp.financial.CardMerchantFeeResolutionService;
import com.coresolution.consultation.util.CardMerchantFeeCalculationUtil;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 테넌트 카드 수수료 요율 설정 기반 수수료 금액 산출 구현.
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
    private final CardMerchantFeeIssuerRateRepository issuerRateRepository;

    @Override
    public BigDecimal resolveFeeAmount(String tenantId, BigDecimal grossAmount, String paymentMethod,
            String cardIssuer) {
        if (tenantId == null || tenantId.isBlank()) {
            return BigDecimal.ZERO;
        }
        if (!CardMerchantFeeConstants.isCardPaymentMethod(paymentMethod)) {
            return BigDecimal.ZERO;
        }
        if (grossAmount == null || grossAmount.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }

        BigDecimal rate = resolveRatePercent(tenantId, cardIssuer);
        if (rate == null || rate.compareTo(BigDecimal.ZERO) <= 0) {
            log.debug("카드 수수료 산출 생략: 요율 없음, tenantId={}", tenantId);
            return BigDecimal.ZERO;
        }

        return CardMerchantFeeCalculationUtil.calculateFee(grossAmount, rate);
    }

    private BigDecimal resolveRatePercent(String tenantId, String cardIssuer) {
        Optional<CardMerchantFeeSettings> settingsOpt =
                settingsRepository.findByTenantIdAndIsDeletedFalse(tenantId);
        if (settingsOpt.isEmpty()) {
            return null;
        }
        CardMerchantFeeSettings settings = settingsOpt.get();

        if (cardIssuer != null && !cardIssuer.isBlank()) {
            String trimmedIssuer = cardIssuer.trim();
            List<CardMerchantFeeIssuerRate> issuerRates = issuerRateRepository
                    .findByTenantIdAndSettingsIdAndIsDeletedFalseOrderBySortOrderAsc(
                            tenantId, settings.getId());
            for (CardMerchantFeeIssuerRate issuerRate : issuerRates) {
                if (trimmedIssuer.equals(issuerRate.getIssuerLabel())
                        && issuerRate.getRatePercent() != null
                        && issuerRate.getRatePercent().compareTo(BigDecimal.ZERO) > 0) {
                    return issuerRate.getRatePercent();
                }
            }
        }

        BigDecimal average = settings.getAverageRatePercent();
        if (average != null && average.compareTo(BigDecimal.ZERO) > 0) {
            return average;
        }
        return null;
    }
}
