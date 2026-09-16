package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.Collections;
import java.util.List;
import com.coresolution.consultation.constant.FinancialTransactionConstants;
import com.coresolution.consultation.constant.InstitutionLinkConstants;
import com.coresolution.consultation.dto.FinancialTransactionRequest;
import com.coresolution.consultation.dto.FinancialTransactionResponse;
import com.coresolution.consultation.dto.InstitutionLinkMonthlyBillingRunResponse;
import com.coresolution.consultation.entity.InstitutionLinkContract;
import com.coresolution.consultation.entity.erp.financial.FinancialTransaction;
import com.coresolution.consultation.repository.InstitutionLinkContractRepository;
import com.coresolution.consultation.repository.erp.financial.FinancialTransactionRepository;
import com.coresolution.consultation.service.erp.financial.FinancialTransactionService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * 타기관 월청구 — ACTIVE만, remaining 미사용, 멱등, ADVANCE/선납 경로 비침범.
 *
 * @author CoreSolution
 * @since 2026-09-14
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("InstitutionLinkMonthlyBillingServiceImpl")
class InstitutionLinkMonthlyBillingServiceImplTest {

    private static final String TENANT_ID = "tenant-monthly-billing-1";
    private static final YearMonth YEAR_MONTH = YearMonth.of(2026, 9);

    @Mock
    private InstitutionLinkContractRepository institutionLinkContractRepository;

    @Mock
    private FinancialTransactionRepository financialTransactionRepository;

    @Mock
    private FinancialTransactionService financialTransactionService;

    @InjectMocks
    private InstitutionLinkMonthlyBillingServiceImpl service;

    @Test
    @DisplayName("ACTIVE + monthly_amount>0 이면 RECEIVABLES(타기관월청구) 1건 생성")
    void run_createsReceivablesForActiveContract() {
        InstitutionLinkContract contract = activeContract(11L, 100_000L, LocalDate.of(2026, 9, 5));
        when(institutionLinkContractRepository.findByTenantIdAndStatusAndIsDeletedFalseOrderByIdDesc(
                TENANT_ID, InstitutionLinkConstants.STATUS_ACTIVE))
                .thenReturn(List.of(contract));
        stubNoExistingReceivable(11L);
        when(financialTransactionService.createTransaction(any(FinancialTransactionRequest.class), isNull()))
                .thenReturn(FinancialTransactionResponse.builder().id(901L).build());

        InstitutionLinkMonthlyBillingRunResponse result = service.runMonthlyBilling(TENANT_ID, YEAR_MONTH);

        assertThat(result.getChargedCount()).isEqualTo(1);
        assertThat(result.getSkippedCount()).isZero();
        assertThat(result.getChargedContractIds()).containsExactly(11L);
        assertThat(result.getYearMonth()).isEqualTo("2026-09");

        ArgumentCaptor<FinancialTransactionRequest> captor =
                ArgumentCaptor.forClass(FinancialTransactionRequest.class);
        verify(financialTransactionService).createTransaction(captor.capture(), isNull());
        FinancialTransactionRequest request = captor.getValue();
        assertThat(request.getTransactionType()).isEqualTo("RECEIVABLES");
        assertThat(request.getCategory())
                .isEqualTo(FinancialTransactionConstants.CATEGORY_INSTITUTION_LINK_MONTHLY);
        assertThat(request.getSubcategory())
                .isEqualTo(FinancialTransactionConstants.SUBCATEGORY_INSTITUTION_LINK_MONTHLY);
        assertThat(request.getAmount()).isEqualByComparingTo(BigDecimal.valueOf(100_000L));
        assertThat(request.getRelatedEntityId()).isEqualTo(11L);
        assertThat(request.getRelatedEntityType()).isEqualTo("INSTITUTION_LINK_MONTHLY_2026_09");
        assertThat(request.getTenantId()).isEqualTo(TENANT_ID);
        assertThat(request.getTransactionDate()).isEqualTo(LocalDate.of(2026, 9, 5));
        assertThat(request.getDescription()).contains("타기관 월청구");
        assertThat(request.getRelatedEntityType())
                .doesNotContain("INSTITUTION_LINK_PREPAID")
                .doesNotContain("CONSULTANT_CLIENT_MAPPING")
                .doesNotContain("SAME_DAY");
    }

    @Test
    @DisplayName("동일 계약+연월 재실행 시 RECEIVABLES 추가 생성 없음(멱등)")
    void run_isIdempotentOnDoubleRun() {
        InstitutionLinkContract contract = activeContract(22L, 50_000L, LocalDate.of(2026, 1, 1));
        when(institutionLinkContractRepository.findByTenantIdAndStatusAndIsDeletedFalseOrderByIdDesc(
                TENANT_ID, InstitutionLinkConstants.STATUS_ACTIVE))
                .thenReturn(List.of(contract));
        when(financialTransactionRepository
                .existsByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndTransactionTypeAndIsDeletedFalse(
                        eq(TENANT_ID),
                        eq(22L),
                        eq("INSTITUTION_LINK_MONTHLY_2026_09"),
                        eq(FinancialTransaction.TransactionType.RECEIVABLES)))
                .thenReturn(false)
                .thenReturn(true);
        when(financialTransactionService.createTransaction(any(FinancialTransactionRequest.class), isNull()))
                .thenReturn(FinancialTransactionResponse.builder().id(902L).build());

        InstitutionLinkMonthlyBillingRunResponse first = service.runMonthlyBilling(TENANT_ID, YEAR_MONTH);
        InstitutionLinkMonthlyBillingRunResponse second = service.runMonthlyBilling(TENANT_ID, YEAR_MONTH);

        assertThat(first.getChargedCount()).isEqualTo(1);
        assertThat(second.getChargedCount()).isZero();
        assertThat(second.getSkippedAlreadyBilled()).isEqualTo(1);
        verify(financialTransactionService, times(1))
                .createTransaction(any(FinancialTransactionRequest.class), isNull());
    }

    @Test
    @DisplayName("monthly_amount=0 이면 청구 스킵 (최가을 등 금액 미설정)")
    void run_skipsZeroMonthlyAmount() {
        InstitutionLinkContract contract = activeContract(33L, 0L, LocalDate.of(2026, 9, 1));
        when(institutionLinkContractRepository.findByTenantIdAndStatusAndIsDeletedFalseOrderByIdDesc(
                TENANT_ID, InstitutionLinkConstants.STATUS_ACTIVE))
                .thenReturn(List.of(contract));

        InstitutionLinkMonthlyBillingRunResponse result = service.runMonthlyBilling(TENANT_ID, YEAR_MONTH);

        assertThat(result.getChargedCount()).isZero();
        assertThat(result.getSkippedZeroAmount()).isEqualTo(1);
        verify(financialTransactionService, never()).createTransaction(any(), any());
        verify(financialTransactionRepository, never())
                .existsByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndTransactionTypeAndIsDeletedFalse(
                        any(), any(), any(), any());
    }

    @Test
    @DisplayName("ACTIVE만 조회 — PREPAID/ENDED 및 ADVANCE 매핑은 조회하지 않음")
    void run_queriesActiveInstitutionContractsOnly() {
        when(institutionLinkContractRepository.findByTenantIdAndStatusAndIsDeletedFalseOrderByIdDesc(
                TENANT_ID, InstitutionLinkConstants.STATUS_ACTIVE))
                .thenReturn(Collections.emptyList());

        InstitutionLinkMonthlyBillingRunResponse result = service.runMonthlyBilling(TENANT_ID, YEAR_MONTH);

        assertThat(result.getChargedCount()).isZero();
        verify(institutionLinkContractRepository).findByTenantIdAndStatusAndIsDeletedFalseOrderByIdDesc(
                TENANT_ID, InstitutionLinkConstants.STATUS_ACTIVE);
        verify(institutionLinkContractRepository, never())
                .findByTenantIdAndStatusAndIsDeletedFalseOrderByIdDesc(
                        TENANT_ID, InstitutionLinkConstants.STATUS_PREPAID);
        verify(financialTransactionService, never()).createTransaction(any(), any());
    }

    @Test
    @DisplayName("period_end 지난 연월은 스킵")
    void run_skipsOutOfPeriod() {
        InstitutionLinkContract contract = activeContract(44L, 80_000L, LocalDate.of(2026, 1, 10));
        contract.setPeriodEnd(LocalDate.of(2026, 6, 30));
        when(institutionLinkContractRepository.findByTenantIdAndStatusAndIsDeletedFalseOrderByIdDesc(
                TENANT_ID, InstitutionLinkConstants.STATUS_ACTIVE))
                .thenReturn(List.of(contract));

        InstitutionLinkMonthlyBillingRunResponse result = service.runMonthlyBilling(TENANT_ID, YEAR_MONTH);

        assertThat(result.getSkippedOutOfPeriod()).isEqualTo(1);
        verify(financialTransactionService, never()).createTransaction(any(), any());
    }

    @Test
    @DisplayName("tenantId 없으면 예외")
    void run_requiresTenantId() {
        assertThatThrownBy(() -> service.runMonthlyBilling(" ", YEAR_MONTH))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("tenantId는 필수입니다.");
    }

    @Test
    @DisplayName("관련 엔티티 타입 빌더는 연월을 넣는다")
    void buildMonthlyRelatedEntityType_embedsYearMonth() {
        assertThat(InstitutionLinkMonthlyBillingServiceImpl.buildMonthlyRelatedEntityType(YEAR_MONTH))
                .isEqualTo("INSTITUTION_LINK_MONTHLY_2026_09");
    }

    @Test
    @DisplayName("청구일은 period_start day-of-month 를 쓴다")
    void resolveBillingDate_usesPeriodStartDay() {
        InstitutionLinkContract contract = activeContract(1L, 1L, LocalDate.of(2026, 1, 31));
        assertThat(InstitutionLinkMonthlyBillingServiceImpl.resolveBillingDate(
                contract, YearMonth.of(2026, 2)))
                .isEqualTo(LocalDate.of(2026, 2, 28));
    }

    private void stubNoExistingReceivable(Long contractId) {
        when(financialTransactionRepository
                .existsByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndTransactionTypeAndIsDeletedFalse(
                        eq(TENANT_ID),
                        eq(contractId),
                        eq("INSTITUTION_LINK_MONTHLY_2026_09"),
                        eq(FinancialTransaction.TransactionType.RECEIVABLES)))
                .thenReturn(false);
    }

    private static InstitutionLinkContract activeContract(Long id, Long monthlyAmount, LocalDate periodStart) {
        InstitutionLinkContract contract = InstitutionLinkContract.builder()
                .clientId(9L)
                .institutionId(3L)
                .periodStart(periodStart)
                .prepaidAmount(0L)
                .monthlyAmount(monthlyAmount)
                .status(InstitutionLinkConstants.STATUS_ACTIVE)
                .build();
        contract.setId(id);
        contract.setTenantId(TENANT_ID);
        contract.setIsDeleted(false);
        return contract;
    }
}
