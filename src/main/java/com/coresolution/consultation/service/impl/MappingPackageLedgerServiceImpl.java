package com.coresolution.consultation.service.impl;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.coresolution.consultation.constant.FinancialTransactionConstants;
import com.coresolution.consultation.constant.admin.AdminServiceUserFacingMessages;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.erp.financial.FinancialTransaction;
import com.coresolution.consultation.exception.MappingAmountBelowRefundFloorException;
import com.coresolution.consultation.repository.erp.financial.FinancialTransactionRepository;
import com.coresolution.consultation.service.MappingPackageLedgerService;
import com.coresolution.consultation.service.SalaryTaxRateLookupService;
import com.coresolution.consultation.util.MappingPartialRefundLedger;
import com.coresolution.consultation.util.TaxCalculationUtil;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 입금 확인된 매칭의 패키지 금액 변경 재무 전표 writer.
 *
 * <p>증액은 차액 INCOME, 감액은 차액 EXPENSE(수입 감소 조정) 1건이다. 전표 금액은 엔티티·분개 규칙상 0 이상이라
 * 음수 INCOME 대신 환불과 같은 방식(양수 EXPENSE)으로 수입 감소를 남긴다. 기존 전표는 지우거나 고치지 않는다.</p>
 *
 * <p>모든 메서드는 {@link Propagation#MANDATORY} — 매칭 수정 트랜잭션 밖에서 부르면 실패한다. 조정 전표는
 * {@code saveAndFlush} 로 바로 INSERT 해 UNIQUE 위반이 호출자 안에서 드러나게 한다(커밋 시점 예외로 새지 않음).
 * 분개(AccountingEntry 는 금액 ≥ 0)·실시간 통계·외부 호출은 하지 않는다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-05
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MappingPackageLedgerServiceImpl implements MappingPackageLedgerService {

    private final FinancialTransactionRepository financialTransactionRepository;
    private final SalaryTaxRateLookupService salaryTaxRateLookupService;

    @Override
    @Transactional(propagation = Propagation.MANDATORY)
    public void assertDecreaseAllowed(ConsultantClientMapping mapping, long newPackagePrice) {
        String tenantId = requireTenantId(mapping);
        long paid = resolveOriginalPaidAmount(tenantId, mapping);
        if (paid <= 0L) {
            log.warn("감액 하한 확인 불가(결제액 없음) — 거부: mappingId={}", mapping.getId());
            throw new MappingAmountBelowRefundFloorException(mapping.getId());
        }
        long refunded = sumRefundedAmount(tenantId, mapping.getId());
        long floor = Math.max(paid - refunded, 0L);
        if (newPackagePrice < floor) {
            log.warn("감액 하한 미만 — 거부: mappingId={}, newPrice={}, paid={}, refunded={}",
                    mapping.getId(), newPackagePrice, paid, refunded);
            throw new MappingAmountBelowRefundFloorException(mapping.getId());
        }
    }

    @Override
    @Transactional(propagation = Propagation.MANDATORY)
    public Optional<FinancialTransaction> recordPackagePriceAdjustment(ConsultantClientMapping mapping,
            long oldPackagePrice, long newPackagePrice, long baseVersion, String actor) {
        long delta = newPackagePrice - oldPackagePrice;
        if (delta == 0L) {
            return Optional.empty();
        }
        String tenantId = requireTenantId(mapping);
        BigDecimal vatRate = salaryTaxRateLookupService.getVatRate(tenantId);
        TaxCalculationUtil.TaxCalculationResult tax =
                TaxCalculationUtil.calculateTaxFromPayment(BigDecimal.valueOf(Math.abs(delta)), vatRate);
        FinancialTransaction.TransactionType type = delta > 0L
                ? FinancialTransaction.TransactionType.INCOME
                : FinancialTransaction.TransactionType.EXPENSE;
        String packageName = StringUtils.hasText(mapping.getPackageName())
                ? mapping.getPackageName()
                : AdminServiceUserFacingMessages.FALLBACK_PACKAGE_DISPLAY_NAME;

        FinancialTransaction adjustment = FinancialTransaction.builder()
                .transactionType(type)
                .category(FinancialTransactionConstants.CATEGORY_CONSULTATION_FEE)
                .subcategory(FinancialTransactionConstants.SUBCATEGORY_PACKAGE_PRICE_ADJUSTMENT)
                .amount(tax.getAmountIncludingTax())
                .taxAmount(tax.getVatAmount())
                .amountBeforeTax(tax.getAmountExcludingTax())
                .withholdingTaxAmount(BigDecimal.ZERO)
                .cardMerchantFeeAmount(BigDecimal.ZERO)
                .taxIncluded(true)
                .description(String.format(AdminServiceUserFacingMessages.DESC_MAPPING_PACKAGE_PRICE_ADJUSTMENT_FMT,
                        packageName, oldPackagePrice, newPackagePrice, delta))
                .remarks(StringUtils.hasText(actor)
                        ? String.format(AdminServiceUserFacingMessages.REMARKS_MAPPING_PACKAGE_PRICE_ADJUSTMENT_ACTOR_FMT,
                                actor)
                        : null)
                .transactionDate(LocalDate.now())
                .relatedEntityId(mapping.getId())
                .relatedEntityType(FinancialTransactionConstants.mappingPackageAdjustmentRelatedEntityType(baseVersion))
                .status(FinancialTransaction.TransactionStatus.COMPLETED)
                .approvedAt(LocalDateTime.now())
                .branchCode(null)
                .build();
        adjustment.setTenantId(tenantId);

        FinancialTransaction saved = financialTransactionRepository.saveAndFlush(adjustment);
        log.info("패키지 금액 조정 전표 기록: mappingId={}, txId={}, type={}, delta={}, baseVersion={}",
                mapping.getId(), saved.getId(), type, delta, baseVersion);
        return Optional.of(saved);
    }

    private String requireTenantId(ConsultantClientMapping mapping) {
        String tenantId = mapping != null ? mapping.getTenantId() : null;
        if (!StringUtils.hasText(tenantId) || mapping.getId() == null) {
            throw new IllegalStateException("매칭 테넌트·ID 없음 — 재무 전표를 기록하지 않음");
        }
        return tenantId;
    }

    /**
     * 결제액: 매칭 payment_amount(입금 확인 시 기록, 수정으로 바뀌지 않음). 없으면 매칭 본전표 INCOME 합.
     */
    private long resolveOriginalPaidAmount(String tenantId, ConsultantClientMapping mapping) {
        if (mapping.getPaymentAmount() != null && mapping.getPaymentAmount() > 0L) {
            return mapping.getPaymentAmount();
        }
        return sumActiveAmount(financialTransactionRepository
                .findByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndIsDeletedFalse(tenantId, mapping.getId(),
                        FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING),
                FinancialTransaction.TransactionType.INCOME);
    }

    /**
     * 누적 환불액 = 활성 부분 환불 EXPENSE(공용 집계 {@link MappingPartialRefundLedger}) + 활성 전액 환불 EXPENSE.
     */
    private long sumRefundedAmount(String tenantId, Long mappingId) {
        long partial = MappingPartialRefundLedger.sumActivePartialRefundAmount(
                financialTransactionRepository
                        .findByTenantIdAndRelatedEntityIdAndRelatedEntityTypeStartingWithAndIsDeletedFalse(
                                tenantId, mappingId,
                                FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING_PARTIAL_REFUND),
                null);
        long full = sumActiveAmount(financialTransactionRepository
                .findByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndIsDeletedFalse(tenantId, mappingId,
                        FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING_REFUND),
                FinancialTransaction.TransactionType.EXPENSE);
        return partial + full;
    }

    private static long sumActiveAmount(List<FinancialTransaction> rows, FinancialTransaction.TransactionType type) {
        if (rows == null || rows.isEmpty()) {
            return 0L;
        }
        return rows.stream()
                .filter(Objects::nonNull)
                .filter(ft -> !Boolean.TRUE.equals(ft.getIsDeleted()))
                .filter(ft -> type.equals(ft.getTransactionType()))
                .filter(ft -> ft.getStatus() != FinancialTransaction.TransactionStatus.CANCELLED
                        && ft.getStatus() != FinancialTransaction.TransactionStatus.REJECTED)
                .map(FinancialTransaction::getAmount)
                .filter(Objects::nonNull)
                .mapToLong(BigDecimal::longValue)
                .filter(amount -> amount > 0L)
                .sum();
    }
}
