package com.coresolution.consultation.service.support;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;

import com.coresolution.consultation.constant.FinancialTransactionConstants;
import com.coresolution.consultation.constant.admin.AdminServiceUserFacingMessages;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.erp.financial.FinancialTransaction;
import com.coresolution.consultation.entity.erp.financial.FinancialTransaction.TransactionStatus;
import com.coresolution.consultation.repository.erp.financial.FinancialTransactionRepository;
import com.coresolution.consultation.service.erp.financial.FinancialTransactionService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * 종료 시 본 매핑·병합 추가 패키지 INCOME 취소 대상 ID.
 *
 * @author CoreSolution
 * @since 2026-10-06
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ConsultationDepositIncomeLedger — 병합 추가 패키지 INCOME")
class ConsultationDepositIncomeLedgerTest {

    private static final String TENANT = "ledger-test-tenant";

    @Mock
    private FinancialTransactionService financialTransactionService;

    @Mock
    private FinancialTransactionRepository financialTransactionRepository;

    @Test
    @DisplayName("병합 notes 의 targetActiveMappingId 가 타깃이면 포함")
    void mappingIds_includeMergedSource() {
        ConsultantClientMapping target = mapping(10L, null);
        ConsultantClientMapping merged = mapping(20L, String.format(
                AdminServiceUserFacingMessages.NOTES_ADDITIONAL_MAPPING_MERGED_FMT, 10L, 5));
        ConsultantClientMapping other = mapping(30L, String.format(
                AdminServiceUserFacingMessages.NOTES_ADDITIONAL_MAPPING_MERGED_FMT, 99L, 2));

        List<Long> ids = ConsultationDepositIncomeLedger.mappingIdsWhoseIncomeIsReversedOnTermination(
                target, List.of(target, merged, other));

        assertThat(ids).containsExactly(10L, 20L);
        assertThat(ConsultationDepositIncomeLedger.isMergedIntoTarget(merged, 10L)).isTrue();
        assertThat(ConsultationDepositIncomeLedger.isMergedIntoTarget(other, 10L)).isFalse();
    }

    @Test
    @DisplayName("쌍 목록이 없으면 대상 ID 만")
    void mappingIds_targetOnlyWhenPairMissing() {
        ConsultantClientMapping target = mapping(7L, null);
        assertThat(ConsultationDepositIncomeLedger.mappingIdsWhoseIncomeIsReversedOnTermination(target, null))
                .containsExactly(7L);
    }

    @Test
    @DisplayName("종료 취소는 대상·병합 소스의 두 슬롯을 모두 호출하고 재호출해도 서비스가 멱등")
    void cancelPostedIncomeForTerminatedMapping_callsSlotsForTargetAndMerged() {
        ConsultantClientMapping target = mapping(10L, null);
        ConsultantClientMapping merged = mapping(20L, String.format(
                AdminServiceUserFacingMessages.NOTES_ADDITIONAL_MAPPING_MERGED_FMT, 10L, 5));
        when(financialTransactionService.cancelRelatedPostedIncomeTransactions(anyLong(), anyString()))
                .thenReturn(1);

        int first = ConsultationDepositIncomeLedger.cancelPostedIncomeForTerminatedMapping(
                financialTransactionService, target, List.of(merged));
        int second = ConsultationDepositIncomeLedger.cancelPostedIncomeForTerminatedMapping(
                financialTransactionService, target, List.of(merged));

        assertThat(first).isEqualTo(4);
        assertThat(second).isEqualTo(4);
        verify(financialTransactionService, times(2)).cancelRelatedPostedIncomeTransactions(
                eq(10L), eq(FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING));
        verify(financialTransactionService, times(2)).cancelRelatedPostedIncomeTransactions(
                eq(20L), eq(FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING_ADDITIONAL));
    }

    @Test
    @DisplayName("기본 회기 먼저 소진 — 원래 총회기-사용 ≥ B 회기 이고 잔여 ≥ B 회기일 때만 B 미사용 (경계 포함)")
    void isMergedAddonUnused_boundaries() {
        assertThat(ConsultationDepositIncomeLedger.isMergedAddonUnused(15, 3, 12, 5)).isTrue();
        assertThat(ConsultationDepositIncomeLedger.isMergedAddonUnused(15, 10, 5, 5)).isTrue();
        assertThat(ConsultationDepositIncomeLedger.isMergedAddonUnused(15, 11, 4, 5)).isFalse();
        // 앞선 부분 환불이 B 회기까지 빼 갔으면(잔여 < B) 원래 총회기 조건을 만족해도 되돌리지 않는다
        assertThat(ConsultationDepositIncomeLedger.isMergedAddonUnused(15, 3, 3, 5)).isFalse();
        assertThat(ConsultationDepositIncomeLedger.isMergedAddonUnused(15, 0, 15, 0)).isFalse();
    }

    @Test
    @DisplayName("판정 — 유효 INCOME 이 남은 병합 B 만 대상, 금액은 유효 INCOME 합, 취소된 B 회기는 reversed 로")
    void resolveMergedAddonRefund_collectsPostedAddonAndReversedSessions() {
        ConsultantClientMapping target = target(10L, 15, 3, 12);
        ConsultantClientMapping posted = merged(20L, 10L, 5);
        ConsultantClientMapping reversed = merged(30L, 10L, 4);
        ConsultantClientMapping otherTarget = merged(40L, 99L, 6);
        when(financialTransactionRepository.findByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndIsDeletedFalse(
                eq(TENANT), anyLong(), anyString())).thenAnswer(invocation -> {
                    Long id = invocation.getArgument(1);
                    String type = invocation.getArgument(2);
                    if (!FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING.equals(type)) {
                        return List.of();
                    }
                    if (id == 20L) {
                        return List.of(income(400_000L, TransactionStatus.COMPLETED),
                                income(1_000L, TransactionStatus.CANCELLED));
                    }
                    if (id == 30L) {
                        return List.of(income(300_000L, TransactionStatus.CANCELLED));
                    }
                    return List.of(income(999_000L, TransactionStatus.COMPLETED));
                });

        ConsultationDepositIncomeLedger.MergedAddonRefund result = ConsultationDepositIncomeLedger
                .resolveMergedAddonRefund(financialTransactionRepository, TENANT, target,
                        List.of(target, posted, reversed, otherTarget), 19);

        assertThat(result.reversible()).isTrue();
        assertThat(result.addonMappingIds()).containsExactly(20L);
        assertThat(result.addonSessions()).isEqualTo(5);
        assertThat(result.addonIncomeAmount()).isEqualTo(400_000L);
        assertThat(result.reversedAddonSessions()).isEqualTo(4);
    }

    @Test
    @DisplayName("판정 — B 회기를 일부 쓴 경우·B 회기 미기록·쌍 목록 없음은 되돌리지 않는다")
    void resolveMergedAddonRefund_conservativeCases() {
        ConsultantClientMapping used = target(10L, 15, 11, 4);
        ConsultantClientMapping posted = merged(20L, 10L, 5);
        when(financialTransactionRepository.findByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndIsDeletedFalse(
                eq(TENANT), anyLong(), anyString())).thenAnswer(invocation ->
                        FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING
                                .equals(invocation.getArgument(2))
                                ? List.of(income(400_000L, TransactionStatus.COMPLETED))
                                : List.of());

        assertThat(ConsultationDepositIncomeLedger.resolveMergedAddonRefund(financialTransactionRepository,
                TENANT, used, List.of(used, posted), 15).reversible()).isFalse();

        ConsultantClientMapping unused = target(10L, 15, 3, 12);
        ConsultantClientMapping noSessions = merged(21L, 10L, 5);
        noSessions.setTotalSessions(null);
        assertThat(ConsultationDepositIncomeLedger.resolveMergedAddonRefund(financialTransactionRepository,
                TENANT, unused, List.of(unused, posted, noSessions), 15).reversible()).isFalse();
        assertThat(ConsultationDepositIncomeLedger.resolveMergedAddonRefund(financialTransactionRepository,
                TENANT, unused, null, 15).reversible()).isFalse();
    }

    private static ConsultantClientMapping target(Long id, int total, int used, int remaining) {
        ConsultantClientMapping mapping = mapping(id, null);
        mapping.setTenantId(TENANT);
        mapping.setTotalSessions(total);
        mapping.setUsedSessions(used);
        mapping.setRemainingSessions(remaining);
        return mapping;
    }

    private static ConsultantClientMapping merged(Long id, Long targetId, int sessions) {
        ConsultantClientMapping mapping = mapping(id, String.format(
                AdminServiceUserFacingMessages.NOTES_ADDITIONAL_MAPPING_MERGED_FMT, targetId, sessions));
        mapping.setTenantId(TENANT);
        mapping.setTotalSessions(sessions);
        mapping.setUsedSessions(sessions);
        mapping.setRemainingSessions(0);
        return mapping;
    }

    private static FinancialTransaction income(long amount, TransactionStatus status) {
        FinancialTransaction tx = FinancialTransaction.builder()
                .transactionType(FinancialTransaction.TransactionType.INCOME)
                .amount(BigDecimal.valueOf(amount))
                .status(status)
                .build();
        tx.setIsDeleted(false);
        return tx;
    }

    private static ConsultantClientMapping mapping(Long id, String notes) {
        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setId(id);
        mapping.setNotes(notes);
        return mapping;
    }
}
