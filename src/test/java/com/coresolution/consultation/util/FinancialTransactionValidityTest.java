package com.coresolution.consultation.util;

import static org.assertj.core.api.Assertions.assertThat;

import com.coresolution.consultation.entity.erp.financial.FinancialTransaction;
import com.coresolution.consultation.entity.erp.financial.FinancialTransaction.TransactionStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;

/**
 * {@link FinancialTransactionValidity} — 유효 거래는 미삭제 COMPLETED 만.
 *
 * @author CoreSolution
 * @since 2026-10-06
 */
@DisplayName("재무 유효 거래 조건 SSOT")
class FinancialTransactionValidityTest {

    @Test
    @DisplayName("제외 상태는 COMPLETED 가 아닌 모든 상태")
    void excludedStatuses_areNonCompleted() {
        assertThat(FinancialTransactionValidity.EXCLUDED_STATUSES)
                .containsExactlyInAnyOrder(
                        TransactionStatus.PENDING,
                        TransactionStatus.APPROVED,
                        TransactionStatus.CANCELLED,
                        TransactionStatus.REJECTED);
        assertThat(FinancialTransactionValidity.EXCLUDED_STATUSES)
                .doesNotContain(TransactionStatus.COMPLETED);
    }

    @ParameterizedTest(name = "{0}")
    @EnumSource(TransactionStatus.class)
    @DisplayName("JPQL·네이티브·판정이 COMPLETED 만 유효")
    void conditionStrings_includeOnlyCompleted(TransactionStatus status) {
        boolean completed = status == TransactionStatus.COMPLETED;
        String jpql = FinancialTransactionValidity.JPQL_VALID_CONDITION_F;
        assertThat(jpql).contains("COMPLETED");
        assertThat(jpql).doesNotContain("PENDING");
        assertThat(FinancialTransactionValidity.nativeValidCondition("ft"))
                .contains("status = 'COMPLETED'");
        assertThat(FinancialTransactionValidity.nativeValidCondition("ft"))
                .doesNotContain("PENDING");
        assertThat(FinancialTransactionValidity.isValidStatus(status)).isEqualTo(completed);
        assertThat(FinancialTransactionValidity.isValidStatusCode(status.name().toLowerCase()))
                .isEqualTo(completed);
    }

    @Test
    @DisplayName("JPQL·네이티브 유효 조건은 미삭제 COMPLETED")
    void jpqlCondition_isDeletedFalseAndCompleted() {
        assertThat(FinancialTransactionValidity.JPQL_VALID_CONDITION_F)
                .isEqualTo(FinancialTransactionValidity.JPQL_COMPLETED_AND_VALID_CONDITION_F);
        assertThat(FinancialTransactionValidity.JPQL_VALID_CONDITION_F).startsWith("f.isDeleted = false AND ");
        assertThat(FinancialTransactionValidity.JPQL_VALID_CONDITION_F).contains("COMPLETED");
        assertThat(FinancialTransactionValidity.nativeValidCondition("ft"))
                .isEqualTo("ft.is_deleted = FALSE AND ft.status = 'COMPLETED'");
        assertThat(FinancialTransactionValidity.nativeValidCondition(null))
                .isEqualTo("is_deleted = FALSE AND status = 'COMPLETED'");
        assertThat(FinancialTransactionValidity.nativeValidCondition(" ")).isEqualTo(
                "is_deleted = FALSE AND status = 'COMPLETED'");
    }

    @Test
    @DisplayName("엔티티 판정 — COMPLETED 미삭제만 유효")
    void isValid_entity() {
        assertThat(FinancialTransactionValidity.isValid(null)).isFalse();
        assertThat(FinancialTransactionValidity.isValid(tx(TransactionStatus.COMPLETED, true))).isFalse();
        assertThat(FinancialTransactionValidity.isValid(tx(TransactionStatus.CANCELLED, false))).isFalse();
        assertThat(FinancialTransactionValidity.isValid(tx(TransactionStatus.REJECTED, false))).isFalse();
        assertThat(FinancialTransactionValidity.isValid(tx(null, false))).isFalse();
        assertThat(FinancialTransactionValidity.isValid(tx(TransactionStatus.PENDING, false))).isFalse();
        assertThat(FinancialTransactionValidity.isValid(tx(TransactionStatus.APPROVED, false))).isFalse();
        assertThat(FinancialTransactionValidity.isValid(tx(TransactionStatus.COMPLETED, false))).isTrue();
        assertThat(FinancialTransactionValidity.isValidStatusCode(null)).isFalse();
        assertThat(FinancialTransactionValidity.isValidStatusCode(" ")).isFalse();
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
