package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.erp.financial.FinancialTransaction;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.erp.financial.FinancialTransactionRepository;
import com.coresolution.consultation.service.AmountManagementService.AmountConsistencyResult;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.core.context.TenantContext;
import com.coresolution.core.context.TenantContextHolder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;

/**
 * {@link AmountManagementServiceImpl} 단위 테스트.
 *
 * <p>PR-D ([Hotfix P1]) 회귀 보호:
 * <ul>
 *   <li>{@link AccurateAmountFallbackTest} — DB M3 측정 8건 fixture (package=0|null & payment&gt;0)</li>
 *   <li>{@link AmountConsistencyRefundDiffTest} — 인벤토리 §G4 환불 후 isConsistent 오탐 회귀 보호</li>
 * </ul>
 *
 * @author MindGarden
 * @since 2026-05-28
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AmountManagementServiceImpl — P1 환불 차감 + accurateAmount 산식")
class AmountManagementServiceImplTest {

    private static final String TENANT_ID = "tenant-amount-management-p1";
    private static final Long MAPPING_ID = 1001L;
    private static final String REFUND_SUBCATEGORY_FULL = "CONSULTATION_REFUND";
    private static final String REFUND_SUBCATEGORY_PARTIAL = "CONSULTATION_PARTIAL_REFUND";

    @Mock
    private ConsultantClientMappingRepository mappingRepository;

    @Mock
    private FinancialTransactionRepository financialTransactionRepository;

    @Mock
    private PersonalDataEncryptionUtil encryptionUtil;

    @InjectMocks
    private AmountManagementServiceImpl service;

    @BeforeEach
    void setTenant() {
        TenantContext.setTenantId(TENANT_ID);
    }

    @AfterEach
    void clearTenant() {
        TenantContextHolder.clear();
    }

    // =========================================================================
    // 변경 3 — accurateAmount 산식 결함 fix
    // =========================================================================

    @Nested
    @DisplayName("AccurateAmountFallback — DB M3 8건 fixture")
    class AccurateAmountFallbackTest {

        @Test
        @DisplayName("packagePrice 가 양수면 우선 사용")
        void usesPackagePriceWhenPositive() {
            ConsultantClientMapping mapping = mappingWithPrices(500_000L, 800_000L);

            Long accurate = service.getAccurateTransactionAmount(mapping);

            assertThat(accurate).isEqualTo(500_000L);
        }

        @Test
        @DisplayName("packagePrice=null & paymentAmount>0 — paymentAmount fallback")
        void fallsBackToPaymentWhenPackageIsNull() {
            ConsultantClientMapping mapping = mappingWithPrices(null, 80_000L);

            Long accurate = service.getAccurateTransactionAmount(mapping);

            assertThat(accurate).isEqualTo(80_000L);
        }

        @Test
        @DisplayName("packagePrice=0 & paymentAmount>0 — paymentAmount fallback (DB M3 패턴 7건)")
        void fallsBackToPaymentWhenPackageIsZero() {
            // DB M3 관측 패턴 (mappings 2/4/7/8 80,000 · 3/5 75,000 · 6 30,000)
            long[] paymentAmounts = {80_000L, 80_000L, 80_000L, 80_000L, 75_000L, 75_000L, 30_000L};

            for (long payment : paymentAmounts) {
                ConsultantClientMapping mapping = mappingWithPrices(0L, payment);
                Long accurate = service.getAccurateTransactionAmount(mapping);
                assertThat(accurate)
                        .as("package=0 & payment=%,d 케이스는 paymentAmount fallback 이 되어야 함", payment)
                        .isEqualTo(payment);
            }
        }

        @Test
        @DisplayName("DB M3 mapping#10 — package=800,000 & payment=800,000 (REJECTED) 도 packagePrice 우선")
        void rejectedMappingStillUsesPackageWhenBothPositive() {
            ConsultantClientMapping mapping = mappingWithPrices(800_000L, 800_000L);

            Long accurate = service.getAccurateTransactionAmount(mapping);

            assertThat(accurate).isEqualTo(800_000L);
        }

        @Test
        @DisplayName("packagePrice=0 & paymentAmount=null — null (유효 금액 없음)")
        void returnsNullWhenBothZeroOrNull() {
            ConsultantClientMapping mapping = mappingWithPrices(0L, null);

            Long accurate = service.getAccurateTransactionAmount(mapping);

            assertThat(accurate).isNull();
        }

        @Test
        @DisplayName("packagePrice=null & paymentAmount=0 — null (유효 금액 없음)")
        void returnsNullWhenPackageNullAndPaymentZero() {
            ConsultantClientMapping mapping = mappingWithPrices(null, 0L);

            Long accurate = service.getAccurateTransactionAmount(mapping);

            assertThat(accurate).isNull();
        }
    }

    // =========================================================================
    // 변경 2 — checkAmountConsistency 환불 차감
    // =========================================================================

    @Nested
    @DisplayName("AmountConsistencyRefundDiff — 인벤토리 §G4 회귀 보호")
    class AmountConsistencyRefundDiffTest {

        @Test
        @DisplayName("INCOME 만 있는 경우 (기존 동작 회귀) — packagePrice == erpTotal 이면 일관")
        void incomeOnlyConsistent() {
            stubMapping(800_000L, 800_000L);
            stubTransactions(List.of(
                    income(800_000L)
            ));

            AmountConsistencyResult result = service.checkAmountConsistency(MAPPING_ID);

            assertThat(result.isConsistent()).isTrue();
            assertThat(result.getAmountBreakdown())
                    .containsEntry("erpIncomeAmount", 800_000L)
                    .containsEntry("erpRefundAmount", 0L)
                    .containsEntry("erpTotalAmount", 800_000L);
        }

        @Test
        @DisplayName("부분 환불 후 erpTotal = INCOME - REFUND 로 정확히 차감")
        void partialRefundSubtractsFromErpTotal() {
            stubMapping(100_000L, 100_000L);
            stubTransactions(List.of(
                    income(100_000L),
                    refund(40_000L, REFUND_SUBCATEGORY_PARTIAL)
            ));

            AmountConsistencyResult result = service.checkAmountConsistency(MAPPING_ID);

            assertThat(result.getAmountBreakdown())
                    .containsEntry("erpIncomeAmount", 100_000L)
                    .containsEntry("erpRefundAmount", 40_000L)
                    .containsEntry("erpTotalAmount", 60_000L);
            // packagePrice=100_000 vs erpTotal=60_000 (환불 차감 후) → 불일치 정상 감지
            assertThat(result.isConsistent()).isFalse();
            assertThat(result.getInconsistencyReason()).contains("60,000원");
        }

        @Test
        @DisplayName("전액 환불 후 erpTotal = 0 — 잔여 ERP 금액 없음으로 일관 (packagePrice 비교 스킵)")
        void fullRefundLeavesZeroErpTotal() {
            // DB M4 패턴: 매핑 67/72 — 환불 100,000 + 부분환불 100,000 = 200,000 EXPENSE
            // 단, 본 테스트는 INCOME 100,000 + REFUND 100,000 = erpTotal 0 인 청산 시나리오
            stubMapping(100_000L, 100_000L);
            stubTransactions(List.of(
                    income(100_000L),
                    refund(100_000L, REFUND_SUBCATEGORY_FULL)
            ));

            AmountConsistencyResult result = service.checkAmountConsistency(MAPPING_ID);

            assertThat(result.getAmountBreakdown())
                    .containsEntry("erpIncomeAmount", 100_000L)
                    .containsEntry("erpRefundAmount", 100_000L)
                    .containsEntry("erpTotalAmount", 0L);
            // erpAmount=0 이면 packagePrice 비교 분기 (line ~274) 자체를 건너뜀 → 일관
            assertThat(result.isConsistent()).isTrue();
        }

        @Test
        @DisplayName("INCOME + 환불 + 부분환불 동시 존재 — 두 EXPENSE 모두 차감")
        void fullAndPartialRefundBothSubtracted() {
            stubMapping(200_000L, 200_000L);
            stubTransactions(List.of(
                    income(200_000L),
                    refund(50_000L, REFUND_SUBCATEGORY_FULL),
                    refund(30_000L, REFUND_SUBCATEGORY_PARTIAL)
            ));

            AmountConsistencyResult result = service.checkAmountConsistency(MAPPING_ID);

            assertThat(result.getAmountBreakdown())
                    .containsEntry("erpIncomeAmount", 200_000L)
                    .containsEntry("erpRefundAmount", 80_000L)
                    .containsEntry("erpTotalAmount", 120_000L);
        }

        @Test
        @DisplayName("환불이 아닌 EXPENSE (subcategory 미스매치) 는 차감 대상에서 제외")
        void nonRefundExpenseNotSubtracted() {
            stubMapping(100_000L, 100_000L);
            FinancialTransaction otherExpense = financialTransaction(
                    FinancialTransaction.TransactionType.EXPENSE,
                    20_000L,
                    "OFFICE_SUPPLIES"
            );
            stubTransactions(List.of(
                    income(100_000L),
                    otherExpense
            ));

            AmountConsistencyResult result = service.checkAmountConsistency(MAPPING_ID);

            // 환불 서브카테고리가 아니므로 차감되지 않아 erpTotal = INCOME 그대로
            assertThat(result.getAmountBreakdown())
                    .containsEntry("erpIncomeAmount", 100_000L)
                    .containsEntry("erpRefundAmount", 0L)
                    .containsEntry("erpTotalAmount", 100_000L);
        }

        @Test
        @DisplayName("ERP 거래 0 건 — erpTotal=0, packagePrice 비교 분기 스킵, 일관")
        void noRelatedTransactions() {
            stubMapping(50_000L, 50_000L);
            stubTransactions(List.of());

            AmountConsistencyResult result = service.checkAmountConsistency(MAPPING_ID);

            assertThat(result.isConsistent()).isTrue();
            assertThat(result.getAmountBreakdown())
                    .containsEntry("erpIncomeAmount", 0L)
                    .containsEntry("erpRefundAmount", 0L)
                    .containsEntry("erpTotalAmount", 0L);
        }

        @Test
        @DisplayName("매핑이 존재하지 않으면 inconsistent + 메시지 반환")
        void mappingNotFound() {
            lenient().when(mappingRepository.findByTenantIdAndId(eq(TENANT_ID), eq(MAPPING_ID)))
                    .thenReturn(Optional.empty());

            AmountConsistencyResult result = service.checkAmountConsistency(MAPPING_ID);

            assertThat(result.isConsistent()).isFalse();
            assertThat(result.getInconsistencyReason()).contains("매핑을 찾을 수 없습니다");
        }
    }

    // =========================================================================
    // 테스트 헬퍼
    // =========================================================================

    private void stubMapping(Long packagePrice, Long paymentAmount) {
        ConsultantClientMapping mapping = mappingWithPrices(packagePrice, paymentAmount);
        mapping.setId(MAPPING_ID);
        lenient().when(mappingRepository.findByTenantIdAndId(eq(TENANT_ID), eq(MAPPING_ID)))
                .thenReturn(Optional.of(mapping));
    }

    private void stubTransactions(List<FinancialTransaction> transactions) {
        lenient().when(financialTransactionRepository
                .findByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndIsDeletedFalse(
                        eq(TENANT_ID), eq(MAPPING_ID), eq("CONSULTANT_CLIENT_MAPPING")))
                .thenReturn(transactions);
    }

    private ConsultantClientMapping mappingWithPrices(Long packagePrice, Long paymentAmount) {
        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setId(MAPPING_ID);
        mapping.setPackagePrice(packagePrice);
        mapping.setPaymentAmount(paymentAmount);
        return mapping;
    }

    private FinancialTransaction income(long amount) {
        return financialTransaction(FinancialTransaction.TransactionType.INCOME, amount, null);
    }

    private FinancialTransaction refund(long amount, String subcategory) {
        return financialTransaction(FinancialTransaction.TransactionType.EXPENSE, amount, subcategory);
    }

    private FinancialTransaction financialTransaction(
            FinancialTransaction.TransactionType type, long amount, String subcategory) {
        FinancialTransaction transaction = new FinancialTransaction();
        transaction.setTransactionType(type);
        transaction.setAmount(BigDecimal.valueOf(amount));
        transaction.setSubcategory(subcategory);
        return transaction;
    }
}
