package com.coresolution.consultation.util;

import java.util.Collections;
import java.util.EnumSet;
import java.util.Set;
import java.util.stream.Collectors;

import com.coresolution.consultation.entity.erp.financial.FinancialTransaction;
import com.coresolution.consultation.entity.erp.financial.FinancialTransaction.TransactionStatus;

/**
 * 재무 집계에서 취소·거부·삭제 거래를 빼는 제외 조건 SSOT.
 *
 * <p>유효(제외 대상이 아님) = 미삭제({@code is_deleted = false}) 이면서 상태가
 * 취소({@link TransactionStatus#CANCELLED})·거부({@link TransactionStatus#REJECTED})가 아닌 거래.
 * 대기·승인·완료와 상태 미기록(null)은 이 판정만으로는 포함된다.</p>
 *
 * <p>이 판정은 COMPLETED 전용 합계를 대체하지 않는다. 원래 {@code status = COMPLETED} 이던
 * 대시보드 SUM({@code sumIncomeByDateRange} 등)은 {@link #JPQL_COMPLETED_AND_VALID_CONDITION_F} 를
 * 쓴다. 일·월·연 리포트와 결산({@code sumAmountForCloseByType})처럼 원래 상태 제한이 없던
 * 경로는 {@link #isValid} / {@link #JPQL_VALID_CONDITION_F} 만 추가한다.</p>
 *
 * <p>JPQL {@code @Query} 는 컴파일 상수가 필요해 아래 문자열을 이어 붙이고,
 * 네이티브 SQL 은 {@link #nativeValidCondition(String)} 로 만든다. 제외 상태를 바꾸면 세 곳이 함께 바뀐다
 * ({@code FinancialTransactionValidityTest} 가 상수와 {@link #EXCLUDED_STATUSES} 일치를 검사).</p>
 *
 * @author CoreSolution
 * @since 2026-10-06
 */
public final class FinancialTransactionValidity {

    /** 집계에서 제외하는 거래 상태. */
    public static final Set<TransactionStatus> EXCLUDED_STATUSES = Collections.unmodifiableSet(
            EnumSet.of(TransactionStatus.CANCELLED, TransactionStatus.REJECTED));

    private static final String STATUS_ENUM_PREFIX =
            "com.coresolution.consultation.entity.erp.financial.FinancialTransaction$TransactionStatus.";

    /**
     * JPQL 유효 거래 조건 (엔티티 별칭 {@code f}). {@link #EXCLUDED_STATUSES} 와 같은 상태를 제외한다.
     * COMPLETED 제한은 넣지 않는다.
     */
    public static final String JPQL_VALID_CONDITION_F = "f.isDeleted = false AND (f.status IS NULL OR f.status NOT IN ("
            + STATUS_ENUM_PREFIX + "CANCELLED, "
            + STATUS_ENUM_PREFIX + "REJECTED))";

    /**
     * 원래 COMPLETED 만 합산하던 대시보드 쿼리용. COMPLETED 를 유지하고 취소·거부·삭제를 명시적으로 제외한다.
     */
    public static final String JPQL_COMPLETED_AND_VALID_CONDITION_F =
            "f.status = " + STATUS_ENUM_PREFIX + "COMPLETED AND " + JPQL_VALID_CONDITION_F;

    private FinancialTransactionValidity() {
    }

    /**
     * 집계에 넣을 유효 거래인지 (취소·거부·삭제 제외). COMPLETED 여부는 보지 않는다.
     *
     * @param transaction 거래 (null 이면 false)
     * @return 미삭제이고 취소·거부가 아니면 true
     */
    public static boolean isValid(FinancialTransaction transaction) {
        if (transaction == null || Boolean.TRUE.equals(transaction.getIsDeleted())) {
            return false;
        }
        return isValidStatus(transaction.getStatus());
    }

    /**
     * 대시보드 COMPLETED 합계에 넣을 거래인지.
     *
     * @param transaction 거래
     * @return 유효하고 상태가 COMPLETED 이면 true
     */
    public static boolean isCompletedAndValid(FinancialTransaction transaction) {
        return isValid(transaction) && transaction.getStatus() == TransactionStatus.COMPLETED;
    }

    /**
     * 집계에 넣을 상태인지.
     *
     * @param status 거래 상태 (null 이면 상태 미기록으로 보고 포함)
     * @return 취소·거부가 아니면 true
     */
    public static boolean isValidStatus(TransactionStatus status) {
        return status == null || !EXCLUDED_STATUSES.contains(status);
    }

    /**
     * 응답 DTO 의 상태 코드 문자열로 집계 포함 여부를 판정한다.
     *
     * @param statusCode 상태 코드 ({@link TransactionStatus#name()}); 비어 있으면 포함
     * @return 취소·거부 코드가 아니면 true
     */
    public static boolean isValidStatusCode(String statusCode) {
        if (statusCode == null || statusCode.isBlank()) {
            return true;
        }
        String normalized = statusCode.trim();
        return EXCLUDED_STATUSES.stream().noneMatch(s -> s.name().equalsIgnoreCase(normalized));
    }

    /**
     * 네이티브 SQL 유효 거래 조건. COMPLETED 제한은 넣지 않는다.
     *
     * @param alias {@code financial_transactions} 별칭. 비어 있으면 별칭 없이 컬럼명만 쓴다
     * @return {@code is_deleted = FALSE AND (status IS NULL OR status NOT IN (...))}
     */
    public static String nativeValidCondition(String alias) {
        String prefix = alias == null || alias.isBlank() ? "" : alias.trim() + ".";
        String excluded = EXCLUDED_STATUSES.stream()
                .map(s -> "'" + s.name() + "'")
                .sorted()
                .collect(Collectors.joining(", "));
        return prefix + "is_deleted = FALSE AND (" + prefix + "status IS NULL OR " + prefix + "status NOT IN ("
                + excluded + "))";
    }
}
