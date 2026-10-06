package com.coresolution.consultation.service.support;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;

import com.coresolution.consultation.constant.FinancialTransactionConstants;
import com.coresolution.consultation.constant.admin.AdminServiceUserFacingMessages;
import com.coresolution.consultation.entity.ConsultantClientMapping;
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

    @Mock
    private FinancialTransactionService financialTransactionService;

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

    private static ConsultantClientMapping mapping(Long id, String notes) {
        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setId(id);
        mapping.setNotes(notes);
        return mapping;
    }
}
