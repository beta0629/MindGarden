package com.coresolution.consultation.service.impl;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import com.coresolution.consultation.constant.FinancialTransactionConstants;
import com.coresolution.consultation.constant.InstitutionLinkConstants;
import com.coresolution.consultation.constant.admin.AdminServiceUserFacingMessages;
import com.coresolution.consultation.dto.FinancialTransactionRequest;
import com.coresolution.consultation.dto.InstitutionLinkMonthlyBillingRunResponse;
import com.coresolution.consultation.entity.InstitutionLinkContract;
import com.coresolution.consultation.entity.erp.financial.FinancialTransaction;
import com.coresolution.consultation.repository.InstitutionLinkContractRepository;
import com.coresolution.consultation.repository.erp.financial.FinancialTransactionRepository;
import com.coresolution.consultation.service.InstitutionLinkMonthlyBillingService;
import com.coresolution.consultation.service.erp.financial.FinancialTransactionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 타기관 연계 월청구 구현. 계약+연월 단위로 RECEIVABLES 를 멱등 생성한다.
 *
 * @author CoreSolution
 * @since 2026-09-14
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class InstitutionLinkMonthlyBillingServiceImpl implements InstitutionLinkMonthlyBillingService {

    private static final ZoneId SEOUL = ZoneId.of(InstitutionLinkConstants.BILLING_ZONE_ID);

    private final InstitutionLinkContractRepository institutionLinkContractRepository;
    private final FinancialTransactionRepository financialTransactionRepository;
    private final FinancialTransactionService financialTransactionService;

    @Override
    @Transactional
    public InstitutionLinkMonthlyBillingRunResponse runMonthlyBilling(String tenantId, YearMonth yearMonth) {
        requireTenantId(tenantId);
        YearMonth targetMonth = yearMonth != null ? yearMonth : YearMonth.now(SEOUL);

        List<InstitutionLinkContract> contracts =
                institutionLinkContractRepository.findByTenantIdAndStatusAndIsDeletedFalseOrderByIdDesc(
                        tenantId, InstitutionLinkConstants.STATUS_ACTIVE);

        int chargedCount = 0;
        int skippedZeroAmount = 0;
        int skippedOutOfPeriod = 0;
        int skippedAlreadyBilled = 0;
        List<Long> chargedContractIds = new ArrayList<>();

        String relatedEntityType = buildMonthlyRelatedEntityType(targetMonth);

        for (InstitutionLinkContract contract : contracts) {
            if (contract == null || contract.getId() == null) {
                continue;
            }
            Long monthlyAmount = contract.getMonthlyAmount();
            if (monthlyAmount == null || monthlyAmount <= 0L) {
                skippedZeroAmount++;
                log.info("타기관 월청구 스킵(금액0): tenantId={}, contractId={}, yearMonth={}",
                        tenantId, contract.getId(), targetMonth);
                continue;
            }
            if (!isWithinContractPeriod(contract, targetMonth)) {
                skippedOutOfPeriod++;
                log.info("타기관 월청구 스킵(기간외): tenantId={}, contractId={}, yearMonth={}",
                        tenantId, contract.getId(), targetMonth);
                continue;
            }
            boolean exists = financialTransactionRepository
                    .existsByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndTransactionTypeAndIsDeletedFalse(
                            tenantId,
                            contract.getId(),
                            relatedEntityType,
                            FinancialTransaction.TransactionType.RECEIVABLES);
            if (exists) {
                skippedAlreadyBilled++;
                log.info("타기관 월청구 스킵(기청구): tenantId={}, contractId={}, yearMonth={}",
                        tenantId, contract.getId(), targetMonth);
                continue;
            }

            createMonthlyReceivables(tenantId, contract, targetMonth, relatedEntityType, monthlyAmount);
            chargedCount++;
            chargedContractIds.add(contract.getId());
        }

        int skippedCount = skippedZeroAmount + skippedOutOfPeriod + skippedAlreadyBilled;
        log.info("타기관 월청구 완료: tenantId={}, yearMonth={}, charged={}, skipped={}",
                tenantId, targetMonth, chargedCount, skippedCount);

        return InstitutionLinkMonthlyBillingRunResponse.builder()
                .yearMonth(targetMonth.toString())
                .chargedCount(chargedCount)
                .skippedCount(skippedCount)
                .skippedZeroAmount(skippedZeroAmount)
                .skippedOutOfPeriod(skippedOutOfPeriod)
                .skippedAlreadyBilled(skippedAlreadyBilled)
                .chargedContractIds(chargedContractIds)
                .build();
    }

    private void createMonthlyReceivables(
            String tenantId,
            InstitutionLinkContract contract,
            YearMonth targetMonth,
            String relatedEntityType,
            long monthlyAmount) {
        LocalDate transactionDate = resolveBillingDate(contract, targetMonth);
        String description = String.format(
                AdminServiceUserFacingMessages.DESC_INSTITUTION_LINK_MONTHLY_RECEIVABLES_FMT,
                contract.getId(),
                targetMonth.toString(),
                monthlyAmount);

        FinancialTransactionRequest request = FinancialTransactionRequest.builder()
                .transactionType(FinancialTransaction.TransactionType.RECEIVABLES.name())
                .category(FinancialTransactionConstants.CATEGORY_INSTITUTION_LINK_MONTHLY)
                .subcategory(FinancialTransactionConstants.SUBCATEGORY_INSTITUTION_LINK_MONTHLY)
                .amount(BigDecimal.valueOf(monthlyAmount))
                .description(description)
                .transactionDate(transactionDate)
                .relatedEntityId(contract.getId())
                .relatedEntityType(relatedEntityType)
                .tenantId(tenantId)
                .branchCode(null)
                .taxIncluded(false)
                .build();

        financialTransactionService.createTransaction(request, null);
        log.info("타기관 월청구 RECEIVABLES 생성: tenantId={}, contractId={}, yearMonth={}, amount={}",
                tenantId, contract.getId(), targetMonth, monthlyAmount);
    }

    /**
     * 청구일 = period_start 의 day-of-month (해당 월 말일 클램프). billing_day 컬럼 없음.
     *
     * @param contract 계약
     * @param targetMonth 청구 연월
     * @return 거래일
     */
    static LocalDate resolveBillingDate(InstitutionLinkContract contract, YearMonth targetMonth) {
        int requestedDay = 1;
        if (contract.getPeriodStart() != null) {
            requestedDay = contract.getPeriodStart().getDayOfMonth();
        }
        int day = Math.min(Math.max(requestedDay, 1), targetMonth.lengthOfMonth());
        return targetMonth.atDay(day);
    }

    /**
     * 계약 기간과 청구 연월 교집합 여부.
     *
     * @param contract 계약
     * @param targetMonth 청구 연월
     * @return 기간 안이면 true
     */
    static boolean isWithinContractPeriod(InstitutionLinkContract contract, YearMonth targetMonth) {
        if (contract.getPeriodStart() != null) {
            YearMonth startMonth = YearMonth.from(contract.getPeriodStart());
            if (targetMonth.isBefore(startMonth)) {
                return false;
            }
        }
        if (contract.getPeriodEnd() != null) {
            YearMonth endMonth = YearMonth.from(contract.getPeriodEnd());
            if (targetMonth.isAfter(endMonth)) {
                return false;
            }
        }
        return true;
    }

    /**
     * 멱등 키용 relatedEntityType ({@code INSTITUTION_LINK_MONTHLY_yyyy_MM}).
     *
     * @param yearMonth 연월
     * @return relatedEntityType
     */
    static String buildMonthlyRelatedEntityType(YearMonth yearMonth) {
        return FinancialTransactionConstants.RELATED_ENTITY_INSTITUTION_LINK_MONTHLY_PREFIX
                + yearMonth.toString().replace('-', '_');
    }

    private static void requireTenantId(String tenantId) {
        if (tenantId == null || tenantId.isBlank()) {
            throw new IllegalStateException("tenantId는 필수입니다.");
        }
    }
}
