package com.coresolution.consultation.util;

import static org.assertj.core.api.Assertions.assertThat;

import com.coresolution.consultation.entity.erp.financial.FinancialTransaction;
import com.coresolution.consultation.entity.erp.financial.FinancialTransaction.TransactionStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;

/**
 * {@link FinancialTransactionValidity} — 판정·JPQL·네이티브 조건이 같은 제외 상태를 쓰는지.
 *
 * @author CoreSolution
 * @since 2026-10-06
 */
@DisplayName("재무 유효 거래 조건 SSOT")
class FinancialTransactionValidityTest {

    @Test
    @DisplayName("제외 상태는 취소·거부")
    void excludedStatuses_areCancelledAndRejected() {
        assertThat(FinancialTransactionValidity.EXCLUDED_STATUSES)
                .containsExactlyInAnyOrder(TransactionStatus.CANCELLED, TransactionStatus.REJECTED);
        assertThat(FinancialTransactionValidity.EXCLUDED_STATUSES)
                .doesNotContain(TransactionStatus.COMPLETED, TransactionStatus.PENDING, TransactionStatus.APPROVED);
    }

    @ParameterizedTest(name = "{0}")
    @EnumSource(TransactionStatus.class)
    @DisplayName("JPQL·네이티브 조건 문자열이 제외 상태 집합과 일치")
    void conditionStrings_matchExcludedStatuses(TransactionStatus status) {
        boolean excluded = FinancialTransactionValidity.EXCLUDED_STATUSES.contains(status);
        String jpqlToken = "$TransactionStatus." + status.name() + ",";
        String jpqlLastToken = "$TransactionStatus." + status.name() + ")";
        String jpql = FinancialTransactionValidity.JPQL_VALID_CONDITION_F;
        assertThat(jpql.contains(jpqlToken) || jpql.contains(jpqlLastToken)).isEqualTo(excluded);
        assertThat(FinancialTransactionValidity.nativeValidCondition("ft").contains("'" + status.name() + "'"))
                .isEqualTo(excluded);
        assertThat(FinancialTransactionValidity.isValidStatus(status)).isEqualTo(!excluded);
        assertThat(FinancialTransactionValidity.isValidStatusCode(status.name().toLowerCase())).isEqualTo(!excluded);
    }

    @Test
    @DisplayName("JPQL 유효 조건은 soft delete 를 제외하고 COMPLETED 제한은 없다")
    void jpqlCondition_excludesSoftDeletedWithoutCompletedFilter() {
        assertThat(FinancialTransactionValidity.JPQL_VALID_CONDITION_F).startsWith("f.isDeleted = false AND ");
        assertThat(FinancialTransactionValidity.JPQL_VALID_CONDITION_F).doesNotContain("COMPLETED");
        assertThat(FinancialTransactionValidity.nativeValidCondition("ft")).startsWith("ft.is_deleted = FALSE AND ");
        assertThat(FinancialTransactionValidity.nativeValidCondition(null)).startsWith("is_deleted = FALSE AND ");
        int cancelled = FinancialTransactionValidity.nativeValidCondition("ft").indexOf("'CANCELLED'");
        int rejected = FinancialTransactionValidity.nativeValidCondition("ft").indexOf("'REJECTED'");
        assertThat(cancelled).isLessThan(rejected);
    }

    @Test
    @DisplayName("COMPLETED 대시보드 조건은 COMPLETED 와 제외 상태를 함께 가진다")
    void jpqlCompletedAndValid_keepsCompletedAndExcludedStatuses() {
        String jpql = FinancialTransactionValidity.JPQL_COMPLETED_AND_VALID_CONDITION_F;
        assertThat(jpql).contains("COMPLETED");
        for (TransactionStatus status : FinancialTransactionValidity.EXCLUDED_STATUSES) {
            assertThat(jpql).contains(status.name());
        }
    }

    @Test
    @DisplayName("엔티티 판정 — null·삭제·취소·거부는 무효, 상태 미기록·대기·완료는 유효")
    void isValid_entity() {
        assertThat(FinancialTransactionValidity.isValid(null)).isFalse();
        assertThat(FinancialTransactionValidity.isValid(tx(TransactionStatus.COMPLETED, true))).isFalse();
        assertThat(FinancialTransactionValidity.isValid(tx(TransactionStatus.CANCELLED, false))).isFalse();
        assertThat(FinancialTransactionValidity.isValid(tx(TransactionStatus.REJECTED, false))).isFalse();
        assertThat(FinancialTransactionValidity.isValid(tx(null, false))).isTrue();
        assertThat(FinancialTransactionValidity.isValid(tx(TransactionStatus.PENDING, false))).isTrue();
        assertThat(FinancialTransactionValidity.isValid(tx(TransactionStatus.COMPLETED, false))).isTrue();
        assertThat(FinancialTransactionValidity.isValidStatusCode(null)).isTrue();
        assertThat(FinancialTransactionValidity.isValidStatusCode(" ")).isTrue();
        assertThat(FinancialTransactionValidity.isCompletedAndValid(tx(TransactionStatus.PENDING, false))).isFalse();
        assertThat(FinancialTransactionValidity.isCompletedAndValid(tx(TransactionStatus.COMPLETED, false))).isTrue();
    }

    private static FinancialTransaction tx(TransactionStatus status, boolean deleted) {
        FinancialTransaction transaction = new FinancialTransaction();
        transaction.setStatus(status);
        transaction.setIsDeleted(deleted);
        return transaction;
    }
}
