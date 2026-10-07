package com.coresolution.consultation.util;

import java.util.Collections;
import java.util.EnumSet;
import java.util.Set;

import com.coresolution.consultation.entity.erp.financial.FinancialTransaction;
import com.coresolution.consultation.entity.erp.financial.FinancialTransaction.TransactionStatus;

/**
 * 재무 집계의 유효 거래 조건 SSOT (대시보드 표준).
 *
 * <p>유효 = 미삭제({@code is_deleted = false}) 이면서 상태가
 * {@link TransactionStatus#COMPLETED} 인 거래만. 대기·승인·취소·거부·상태 미기록(null)·삭제 행은
 * 대시보드·일/월/연 리포트·결산·지점/실시간/레거시 장부·PL/SQL 네이티브 합계·세금·할인 회계가
 * 같은 판정을 쓴다.</p>
 *
 * <p>JPQL {@code @Query} 는 컴파일 상수가 필요해 {@link #JPQL_VALID_CONDITION_F} 를 이어 붙이고,
 * 네이티브 SQL 은 {@link #nativeValidCondition(String)} 로 만든다.
 * {@link #JPQL_COMPLETED_AND_VALID_CONDITION_F} 는 같은 문자열 별칭이다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-06
 */
public final class FinancialTransactionValidity {

    /** 집계에서 제외하는 거래 상태 (COMPLETED 가 아닌 모든 상태). */
    public static final Set<TransactionStatus> EXCLUDED_STATUSES = Collections.unmodifiableSet(
            EnumSet.complementOf(EnumSet.of(TransactionStatus.COMPLETED)));

    private static final String STATUS_ENUM_PREFIX =
            "com.coresolution.consultation.entity.erp.financial.FinancialTransaction$TransactionStatus.";

    /**
     * JPQL 유효 거래 조건 (엔티티 별칭 {@code f}). 미삭제 COMPLETED 만.
     */
    public static final String JPQL_VALID_CONDITION_F =
            "f.isDeleted = false AND f.status = " + STATUS_ENUM_PREFIX + "COMPLETED";

    /**
     * {@link #JPQL_VALID_CONDITION_F} 와 같다. 기존 대시보드 쿼리 식별자 호환용 별칭.
     */
    public static final String JPQL_COMPLETED_AND_VALID_CONDITION_F = JPQL_VALID_CONDITION_F;

    private FinancialTransactionValidity() {
    }

    /**
     * 집계에 넣을 유효 거래인지 (미삭제 COMPLETED).
     *
     * @param transaction 거래 (null 이면 false)
     * @return 미삭제이고 상태가 COMPLETED 이면 true
     */
    public static boolean isValid(FinancialTransaction transaction) {
        if (transaction == null || Boolean.TRUE.equals(transaction.getIsDeleted())) {
            return false;
        }
        return isValidStatus(transaction.getStatus());
    }

    /**
     * {@link #isValid(FinancialTransaction)} 와 같다. 기존 대시보드 판정 식별자 호환용.
     *
     * @param transaction 거래
     * @return 유효 거래이면 true
     */
    public static boolean isCompletedAndValid(FinancialTransaction transaction) {
        return isValid(transaction);
    }

    /**
     * 집계에 넣을 상태인지.
     *
     * @param status 거래 상태 (null 이면 미완료로 보고 제외)
     * @return COMPLETED 이면 true
     */
    public static boolean isValidStatus(TransactionStatus status) {
        return status == TransactionStatus.COMPLETED;
    }

    /**
     * 응답 DTO 의 상태 코드 문자열로 집계 포함 여부를 판정한다.
     *
     * @param statusCode 상태 코드 ({@link TransactionStatus#name()}); 비어 있으면 제외
     * @return COMPLETED 코드이면 true
     */
    public static boolean isValidStatusCode(String statusCode) {
        if (statusCode == null || statusCode.isBlank()) {
            return false;
        }
        return TransactionStatus.COMPLETED.name().equalsIgnoreCase(statusCode.trim());
    }

    /**
     * 네이티브 SQL 유효 거래 조건. 미삭제 COMPLETED 만.
     *
     * @param alias {@code financial_transactions} 별칭. 비어 있으면 별칭 없이 컬럼명만 쓴다
     * @return {@code is_deleted = FALSE AND status = 'COMPLETED'}
     */
    public static String nativeValidCondition(String alias) {
        String prefix = alias == null || alias.isBlank() ? "" : alias.trim() + ".";
        return prefix + "is_deleted = FALSE AND " + prefix + "status = 'COMPLETED'";
    }
}
