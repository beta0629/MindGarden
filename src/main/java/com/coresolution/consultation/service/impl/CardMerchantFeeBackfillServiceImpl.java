package com.coresolution.consultation.service.impl;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.coresolution.consultation.constant.CardMerchantFeeConstants;
import com.coresolution.consultation.constant.FinancialTransactionConstants;
import com.coresolution.consultation.service.PaymentMethodSsotService;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.Payment;
import com.coresolution.consultation.entity.erp.financial.FinancialTransaction;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.PaymentRepository;
import com.coresolution.consultation.repository.erp.financial.FinancialTransactionRepository;
import com.coresolution.consultation.service.erp.financial.CardMerchantFeeBackfillService;
import com.coresolution.consultation.service.erp.financial.CardMerchantFeeResolutionService;
import com.coresolution.core.context.TenantIsolationValidator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 카드 가맹점 수수료 백필 구현.
 *
 * @author CoreSolution
 * @since 2026-09-01
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CardMerchantFeeBackfillServiceImpl implements CardMerchantFeeBackfillService {

    private final FinancialTransactionRepository financialTransactionRepository;
    private final ConsultantClientMappingRepository mappingRepository;
    private final PaymentRepository paymentRepository;
    private final CardMerchantFeeResolutionService cardMerchantFeeResolutionService;
    private final PaymentMethodSsotService paymentMethodSsotService;

    @Override
    @Transactional
    public Map<String, Long> backfillCardMerchantFees(String tenantId) {
        TenantIsolationValidator.requireTenantIdMatch(tenantId);

        Map<String, Long> result = new HashMap<>();
        result.put("scanned", 0L);
        result.put("updated", 0L);
        result.put("skipped", 0L);

        List<FinancialTransaction> candidates = financialTransactionRepository
                .findIncomeWithZeroOrNullCardMerchantFeeSince(
                        tenantId, CardMerchantFeeConstants.FEE_EFFECTIVE_FROM);

        for (FinancialTransaction transaction : candidates) {
            result.put("scanned", result.get("scanned") + 1);

            String paymentMethod = resolvePaymentMethod(tenantId, transaction);
            String canonicalMethod =
                    paymentMethodSsotService.normalizeToCanonicalCodeValue(tenantId, paymentMethod);
            if (!paymentMethodSsotService.isCardMerchantFeeEligible(tenantId, canonicalMethod)) {
                result.put("skipped", result.get("skipped") + 1);
                continue;
            }

            BigDecimal fee = cardMerchantFeeResolutionService.resolveFeeAmount(
                    tenantId,
                    transaction.getAmount(),
                    canonicalMethod,
                    null,
                    transaction.getTransactionDate());

            if (fee == null || fee.compareTo(BigDecimal.ZERO) <= 0) {
                result.put("skipped", result.get("skipped") + 1);
                continue;
            }

            transaction.setCardMerchantFeeAmount(fee);
            financialTransactionRepository.save(transaction);
            result.put("updated", result.get("updated") + 1);
            log.info("카드 수수료 백필 갱신: tenantId={}, transactionId={}, fee={}",
                    tenantId, transaction.getId(), fee);
        }

        log.info("카드 수수료 백필 완료: tenantId={}, scanned={}, updated={}, skipped={}",
                tenantId, result.get("scanned"), result.get("updated"), result.get("skipped"));
        return result;
    }

    /**
     * relatedEntityType·ID 로 결제 수단 문자열을 해석합니다.
     *
     * @param tenantId    테넌트 ID
     * @param transaction 재무 거래
     * @return 결제 수단 코드, 해석 불가 시 null
     */
    private String resolvePaymentMethod(String tenantId, FinancialTransaction transaction) {
        String relatedType = transaction.getRelatedEntityType();
        Long relatedId = transaction.getRelatedEntityId();
        if (relatedType == null || relatedType.isBlank() || relatedId == null) {
            return null;
        }

        if (FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING.equals(relatedType)
                || FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING_ADDITIONAL
                        .equals(relatedType)) {
            return mappingRepository.findByTenantIdAndId(tenantId, relatedId)
                    .map(ConsultantClientMapping::getPaymentMethod)
                    .orElse(null);
        }

        if (FinancialTransactionConstants.RELATED_ENTITY_PAYMENT.equals(relatedType)) {
            return paymentRepository.findByTenantIdAndId(tenantId, relatedId)
                    .map(Payment::getMethod)
                    .map(Payment.PaymentMethod::name)
                    .orElse(null);
        }

        return null;
    }
}
