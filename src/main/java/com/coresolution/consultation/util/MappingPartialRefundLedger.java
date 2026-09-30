package com.coresolution.consultation.util;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import com.coresolution.consultation.constant.FinancialTransactionConstants;
import com.coresolution.consultation.entity.erp.financial.FinancialTransaction;

/**
 * 매핑 부분 환불 EXPENSE 장부 집계 — 기본 슬롯({@code _PARTIAL_REFUND}) + 순번 슬롯({@code _PARTIAL_REFUND_n}).
 *
 * <p>매핑 측 부분 환불과 PG(쇼핑 주문) 환불이 같은 결제액을 이중으로 돌려주지 않도록
 * 기환불액 SSOT 로 사용한다. CANCELLED·REJECTED·삭제 행은 제외한다.</p>
 *
 * @author MindGarden
 * @since 2026-09-30
 */
public final class MappingPartialRefundLedger {

    private static final String PARTIAL_REFUND_TYPE =
            FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING_PARTIAL_REFUND;

    private static final String PARTIAL_REFUND_SEQ_PREFIX =
            FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING_PARTIAL_REFUND_SEQ_PREFIX;

    private MappingPartialRefundLedger() {
    }

    /**
     * 부분 환불 relatedEntityType(기본 또는 순번 슬롯) 여부.
     *
     * @param relatedEntityType relatedEntityType
     * @return 기본 타입 또는 {@code 기본_숫자} 형식이면 true
     */
    public static boolean isPartialRefundRelatedEntityType(String relatedEntityType) {
        if (PARTIAL_REFUND_TYPE.equals(relatedEntityType)) {
            return true;
        }
        if (relatedEntityType == null || !relatedEntityType.startsWith(PARTIAL_REFUND_SEQ_PREFIX)) {
            return false;
        }
        String seq = relatedEntityType.substring(PARTIAL_REFUND_SEQ_PREFIX.length());
        return !seq.isEmpty() && seq.chars().allMatch(Character::isDigit);
    }

    /**
     * 활성 부분 환불 EXPENSE 여부 (EXPENSE + 부분 환불 슬롯 + CANCELLED·REJECTED·삭제 아님).
     *
     * @param ft 재무 거래
     * @return 활성 부분 환불이면 true
     */
    public static boolean isActivePartialRefundExpense(FinancialTransaction ft) {
        return ft != null
                && !Boolean.TRUE.equals(ft.getIsDeleted())
                && FinancialTransaction.TransactionType.EXPENSE.equals(ft.getTransactionType())
                && isPartialRefundRelatedEntityType(ft.getRelatedEntityType())
                && ft.getStatus() != FinancialTransaction.TransactionStatus.CANCELLED
                && ft.getStatus() != FinancialTransaction.TransactionStatus.REJECTED;
    }

    /**
     * 활성 부분 환불 EXPENSE 금액 합.
     *
     * @param rows      매핑의 부분 환불 슬롯 조회 결과
     * @param notBefore 이 시각 이전에 생성된 환불은 제외 (null 이면 전체) — 해당 결제 승인 이전 환불은
     *                  그 결제의 환불일 수 없다
     * @return 기환불액 (0 이상)
     */
    public static long sumActivePartialRefundAmount(List<FinancialTransaction> rows, LocalDateTime notBefore) {
        if (rows == null || rows.isEmpty()) {
            return 0L;
        }
        return rows.stream()
                .filter(MappingPartialRefundLedger::isActivePartialRefundExpense)
                .filter(ft -> notBefore == null || ft.getCreatedAt() == null
                        || !ft.getCreatedAt().isBefore(notBefore))
                .map(FinancialTransaction::getAmount)
                .filter(Objects::nonNull)
                .mapToLong(BigDecimal::longValue)
                .filter(amount -> amount > 0L)
                .sum();
    }
}
