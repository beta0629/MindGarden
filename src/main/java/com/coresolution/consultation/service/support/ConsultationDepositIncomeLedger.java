package com.coresolution.consultation.service.support;

import java.math.BigDecimal;
import java.util.List;

import com.coresolution.consultation.constant.FinancialTransactionConstants;
import com.coresolution.consultation.entity.erp.financial.FinancialTransaction;
import com.coresolution.consultation.repository.erp.financial.FinancialTransactionRepository;
import com.coresolution.consultation.service.erp.financial.FinancialTransactionService;

/**
 * 매핑 상담료 INCOME 의 중복 판정·취소 기준.
 * <p>
 * 기록 자체는 입금 확인 트랜잭션 한 곳({@code AdminServiceImpl#confirmDeposit})에서만 한다.
 * 결제 확인·원샷·추가 패키지가 각자 전표를 넣지 않도록, 이미 있는 행을 알아보는 키와
 * 미사용 전액 무효 때 지우는 슬롯은 이 클래스만 안다.
 * </p>
 * <p>
 * 중복 키는 {@code (tenantId, relatedEntityId=매핑 ID, relatedEntityType, INCOME, isDeleted=false)}
 * 이고, 슬롯은 본전표·추가 회기 둘이다. 카테고리·세부카테고리·금액은 키가 아니다.
 * 결제 확인 시점에 남은 옛 행(카테고리 {@code CONSULTATION}·{@code 상담료}·결제수단명 등)도
 * posted 이면 같은 수입으로 보고 두 번째 전표를 만들지 않는다.
 * 주문 스코프({@code SHOP_ORDER_CONSULTATION}, relatedEntityId=주문 PK)는 여기 넣지 않는다.
 * </p>
 *
 * @author CoreSolution
 * @since 2026-10-06
 */
public final class ConsultationDepositIncomeLedger {

    /**
     * 매핑 ID 에 묶는 입금 INCOME 슬롯. 순서대로 본전표, 추가 회기.
     */
    public static final List<String> MAPPING_SLOT_RELATED_ENTITY_TYPES = List.of(
            FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING,
            FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING_ADDITIONAL);

    private ConsultationDepositIncomeLedger() {
    }

    /**
     * 두 슬롯 중 하나에 posted(비 CANCELLED·REJECTED, 금액 &gt; 0) INCOME 이 있는지.
     * 카테고리·금액이 달라도 같은 매핑의 옛 행이면 true.
     *
     * @param repository 재무 거래 저장소
     * @param tenantId 테넌트 ID
     * @param mappingId 매핑 ID
     * @return posted 입금 INCOME 이 있으면 true
     */
    public static boolean hasPostedMappingSlotIncome(
            FinancialTransactionRepository repository, String tenantId, Long mappingId) {
        if (repository == null || tenantId == null || tenantId.isEmpty() || mappingId == null) {
            return false;
        }
        for (String relatedEntityType : MAPPING_SLOT_RELATED_ENTITY_TYPES) {
            List<FinancialTransaction> rows = repository
                    .findByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndIsDeletedFalse(
                            tenantId, mappingId, relatedEntityType);
            if (rows == null) {
                continue;
            }
            for (FinancialTransaction row : rows) {
                if (isPostedMappingSlotIncome(row)) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * 미사용 전액 무효 — 두 슬롯의 posted INCOME 을 모두 CANCELLED 로 전이한다.
     *
     * @param financialTransactionService 재무 거래 서비스
     * @param mappingId 매핑 ID
     * @return 취소한 건수
     */
    public static int cancelPostedMappingSlotIncome(
            FinancialTransactionService financialTransactionService, Long mappingId) {
        if (financialTransactionService == null || mappingId == null) {
            return 0;
        }
        int cancelled = 0;
        for (String relatedEntityType : MAPPING_SLOT_RELATED_ENTITY_TYPES) {
            cancelled += financialTransactionService.cancelRelatedPostedIncomeTransactions(
                    mappingId, relatedEntityType);
        }
        return cancelled;
    }

    /**
     * 매핑 슬롯 posted INCOME 인지. 카테고리로 걸러내지 않는다.
     *
     * @param transaction 재무 거래
     * @return 중복 판정에 넣을 행이면 true
     */
    static boolean isPostedMappingSlotIncome(FinancialTransaction transaction) {
        if (transaction == null || Boolean.TRUE.equals(transaction.getIsDeleted())) {
            return false;
        }
        if (transaction.getTransactionType() != FinancialTransaction.TransactionType.INCOME) {
            return false;
        }
        if (!MAPPING_SLOT_RELATED_ENTITY_TYPES.contains(transaction.getRelatedEntityType())) {
            return false;
        }
        if (!isPosted(transaction)) {
            return false;
        }
        BigDecimal amount = transaction.getAmount();
        return amount != null && amount.compareTo(BigDecimal.ZERO) > 0;
    }

    private static boolean isPosted(FinancialTransaction transaction) {
        FinancialTransaction.TransactionStatus status = transaction.getStatus();
        if (status == null) {
            return true;
        }
        return status != FinancialTransaction.TransactionStatus.CANCELLED
                && status != FinancialTransaction.TransactionStatus.REJECTED;
    }
}
