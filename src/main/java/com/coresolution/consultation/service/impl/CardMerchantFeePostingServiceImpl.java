package com.coresolution.consultation.service.impl;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.constant.CardMerchantFeeConstants;
import com.coresolution.consultation.dto.FinancialTransactionRequest;
import com.coresolution.consultation.entity.erp.financial.CardMerchantFeeIssuerRate;
import com.coresolution.consultation.entity.erp.financial.CardMerchantFeeSettings;
import com.coresolution.consultation.entity.erp.financial.FinancialTransaction;
import com.coresolution.consultation.repository.erp.financial.CardMerchantFeeIssuerRateRepository;
import com.coresolution.consultation.repository.erp.financial.CardMerchantFeeSettingsRepository;
import com.coresolution.consultation.repository.erp.financial.FinancialTransactionRepository;
import com.coresolution.consultation.service.erp.financial.CardMerchantFeePostingService;
import com.coresolution.consultation.service.erp.financial.FinancialTransactionService;
import com.coresolution.consultation.util.CardMerchantFeeCalculationUtil;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.extern.slf4j.Slf4j;

/**
 * 카드 가맹점 수수료 자동 기록 서비스 구현.
 *
 * @author CoreSolution
 * @since 2026-08-28
 */
@Slf4j
@Service
@Transactional
public class CardMerchantFeePostingServiceImpl implements CardMerchantFeePostingService {

    private static final String EXPENSE_CATEGORY_OTHER = "OTHER";

    private final CardMerchantFeeSettingsRepository settingsRepository;
    private final CardMerchantFeeIssuerRateRepository issuerRateRepository;
    private final FinancialTransactionRepository financialTransactionRepository;
    private final FinancialTransactionService financialTransactionService;

    public CardMerchantFeePostingServiceImpl(
            CardMerchantFeeSettingsRepository settingsRepository,
            CardMerchantFeeIssuerRateRepository issuerRateRepository,
            FinancialTransactionRepository financialTransactionRepository,
            @Lazy FinancialTransactionService financialTransactionService) {
        this.settingsRepository = settingsRepository;
        this.issuerRateRepository = issuerRateRepository;
        this.financialTransactionRepository = financialTransactionRepository;
        this.financialTransactionService = financialTransactionService;
    }

    @Override
    public void applyCardMerchantFeeForIncome(FinancialTransaction incomeTxn) {
        if (incomeTxn == null || incomeTxn.getId() == null) {
            return;
        }
        if (incomeTxn.getTransactionType() != FinancialTransaction.TransactionType.INCOME) {
            return;
        }
        if (!CardMerchantFeeConstants.isCardPaymentMethod(incomeTxn.getPaymentMethod())) {
            clearFeeIfPresent(incomeTxn);
            return;
        }

        String tenantId = incomeTxn.getTenantId();
        if (tenantId == null || tenantId.isBlank()) {
            log.debug("카드 수수료 적용 생략: tenantId 없음, incomeId={}", incomeTxn.getId());
            return;
        }

        BigDecimal rate = resolveRatePercent(tenantId, incomeTxn.getCardIssuer());
        if (rate == null || rate.compareTo(BigDecimal.ZERO) <= 0) {
            log.debug("카드 수수료 적용 생략: 요율 없음, incomeId={}", incomeTxn.getId());
            clearFeeIfPresent(incomeTxn);
            return;
        }

        BigDecimal fee = CardMerchantFeeCalculationUtil.calculateFee(incomeTxn.getAmount(), rate);
        if (fee.compareTo(BigDecimal.ZERO) <= 0) {
            clearFeeIfPresent(incomeTxn);
            return;
        }

        incomeTxn.setCardMerchantFeeAmount(fee);
        financialTransactionRepository.save(incomeTxn);

        upsertLinkedFeeExpense(tenantId, incomeTxn, fee);
    }

    private void clearFeeIfPresent(FinancialTransaction incomeTxn) {
        if (incomeTxn.getCardMerchantFeeAmount() != null
                && incomeTxn.getCardMerchantFeeAmount().compareTo(BigDecimal.ZERO) > 0) {
            incomeTxn.setCardMerchantFeeAmount(BigDecimal.ZERO);
            financialTransactionRepository.save(incomeTxn);
        }
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

    private void upsertLinkedFeeExpense(String tenantId, FinancialTransaction incomeTxn, BigDecimal fee) {
        List<FinancialTransaction> linked = financialTransactionRepository
                .findByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndIsDeletedFalse(
                        tenantId,
                        incomeTxn.getId(),
                        CardMerchantFeeConstants.RELATED_ENTITY_TYPE);

        if (!linked.isEmpty()) {
            FinancialTransaction existing = linked.get(0);
            if (isAutoPosted(existing)) {
                existing.setAmount(fee);
                existing.setAmountBeforeTax(fee);
                existing.setTransactionDate(incomeTxn.getTransactionDate());
                financialTransactionRepository.save(existing);
                log.debug("카드 수수료 지출 갱신: expenseId={}, fee={}", existing.getId(), fee);
            }
            return;
        }

        FinancialTransactionRequest expenseRequest = FinancialTransactionRequest.builder()
                .transactionType("EXPENSE")
                .category(resolveExpenseCategory(tenantId))
                .amount(fee)
                .amountBeforeTax(fee)
                .taxAmount(BigDecimal.ZERO)
                .description(CardMerchantFeeConstants.EXPENSE_DESCRIPTION)
                .transactionDate(incomeTxn.getTransactionDate())
                .relatedEntityId(incomeTxn.getId())
                .relatedEntityType(CardMerchantFeeConstants.RELATED_ENTITY_TYPE)
                .tenantId(tenantId)
                .taxIncluded(false)
                .remarks(CardMerchantFeeConstants.AUTO_REMARKS)
                .build();

        financialTransactionService.createTransaction(expenseRequest, null);
        log.info("카드 수수료 지출 자동 기록: incomeId={}, fee={}", incomeTxn.getId(), fee);
    }

    private static boolean isAutoPosted(FinancialTransaction expense) {
        return expense.getRemarks() != null
                && expense.getRemarks().contains(CardMerchantFeeConstants.AUTO_REMARKS);
    }

    private String resolveExpenseCategory(String tenantId) {
        return EXPENSE_CATEGORY_OTHER;
    }
}
