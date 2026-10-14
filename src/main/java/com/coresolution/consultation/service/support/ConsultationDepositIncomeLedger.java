package com.coresolution.consultation.service.support;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import com.coresolution.consultation.constant.FinancialTransactionConstants;
import com.coresolution.consultation.constant.admin.AdminServiceUserFacingMessages;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.erp.financial.FinancialTransaction;
import com.coresolution.consultation.repository.erp.financial.FinancialTransactionRepository;
import com.coresolution.consultation.service.erp.financial.FinancialTransactionService;
import com.coresolution.consultation.util.FinancialTransactionValidity;

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

    private static final Pattern MERGED_TARGET_MAPPING_ID = Pattern.compile("targetActiveMappingId=(\\d+)");

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
     * 종료 대상 매핑과 그 매핑으로 병합된 추가 패키지 행의 posted INCOME 을 모두 취소한다.
     * 이미 CANCELLED 인 행은 {@code cancelRelatedPostedIncomeTransactions} 가 건너뛰어 멱등이다.
     *
     * @param financialTransactionService 재무 거래 서비스
     * @param target 강제 종료하는 매핑
     * @param pairMappings 같은 상담사·내담자 쌍의 매핑 목록 (null 이면 대상만)
     * @return 취소한 건수 합
     */
    public static int cancelPostedIncomeForTerminatedMapping(
            FinancialTransactionService financialTransactionService,
            ConsultantClientMapping target,
            List<ConsultantClientMapping> pairMappings) {
        if (financialTransactionService == null || target == null || target.getId() == null) {
            return 0;
        }
        int cancelled = 0;
        for (Long mappingId : mappingIdsWhoseIncomeIsReversedOnTermination(target, pairMappings)) {
            cancelled += cancelPostedMappingSlotIncome(financialTransactionService, mappingId);
        }
        return cancelled;
    }

    /**
     * 종료 시 INCOME 을 되돌릴 매핑 ID. 대상 본인과 notes 에 병합 완료 마커와
     * {@code targetActiveMappingId=대상ID} 가 있는 추가 패키지 행.
     *
     * @param target 종료 대상
     * @param pairMappings 같은 쌍의 매핑
     * @return 중복 없는 ID 목록 (대상이 앞)
     */
    public static List<Long> mappingIdsWhoseIncomeIsReversedOnTermination(
            ConsultantClientMapping target, List<ConsultantClientMapping> pairMappings) {
        Set<Long> ids = new LinkedHashSet<>();
        if (target == null || target.getId() == null) {
            return List.of();
        }
        ids.add(target.getId());
        if (pairMappings == null) {
            return new ArrayList<>(ids);
        }
        for (ConsultantClientMapping other : pairMappings) {
            if (other == null || other.getId() == null || target.getId().equals(other.getId())) {
                continue;
            }
            if (isMergedIntoTarget(other, target.getId())) {
                ids.add(other.getId());
            }
        }
        return new ArrayList<>(ids);
    }

    /**
     * 부분 사용 후 종료·부분 환불에서 병합 추가 패키지(B) 수입을 되돌릴지 판정한다.
     * <p>
     * 병합은 B 회기를 타깃(A) 한 행의 총·잔여 회기에 더할 뿐 패키지별 사용을 남기지 않으므로
     * 「기본 회기 먼저 소진」 규칙(사용자 결정 2026-10-07)으로 판정한다. 병합 때 A 로 옮겨온
     * B 일정도 A 사용 회기에 들어 있다.
     * </p>
     * <ul>
     *   <li>대상 B: notes 가 이 타깃을 가리키는 병합 행 중 유효(미삭제 COMPLETED) INCOME 이 남은 행.
     *       이미 취소된 B 는 앞선 환불에서 되돌린 것이므로 넣지 않는다.</li>
     *   <li>B 회기 합: 각 B 행의 {@code totalSessions} (병합 시 바꾸지 않는 컬럼).</li>
     *   <li>B 미사용: {@code 원래 총회기 - 사용 회기 >= B 회기 합} 이고 {@code 잔여 회기 >= B 회기 합}.
     *       뒤 조건은 앞선 부분 환불이 B 회기까지 빼 갔으면 되돌리지 않기 위한 보수 조건이다.</li>
     * </ul>
     * 판정할 수 없으면(B 회기 미기록 등) 되돌리지 않는다. INCOME 이 있었으나 모두 취소된 병합 행(앞선 환불로
     * 되돌린 B)의 회기는 {@link MergedAddonRefund#reversedAddonSessions()} 로 따로 돌려준다.
     *
     * @param repository 재무 거래 저장소
     * @param tenantId 테넌트 ID
     * @param target 종료·환불 대상 A (행 잠금 상태)
     * @param pairMappings 같은 상담사·내담자 쌍의 매핑
     * @param originalTotalSessions 부분 환불 차감 전 A 총회기 (병합 회기 포함)
     * @return 판정 결과 (되돌리지 않으면 {@link MergedAddonRefund#none()})
     */
    public static MergedAddonRefund resolveMergedAddonRefund(FinancialTransactionRepository repository,
            String tenantId, ConsultantClientMapping target, List<ConsultantClientMapping> pairMappings,
            int originalTotalSessions) {
        if (repository == null || tenantId == null || tenantId.isEmpty() || target == null
                || target.getId() == null || pairMappings == null) {
            return MergedAddonRefund.none();
        }
        List<Long> addonIds = new ArrayList<>();
        int addonSessions = 0;
        long addonIncome = 0L;
        int reversedSessions = 0;
        boolean undeterminable = false;
        for (ConsultantClientMapping other : pairMappings) {
            if (other == null || other.getId() == null || target.getId().equals(other.getId())
                    || !isMergedIntoTarget(other, target.getId())) {
                continue;
            }
            if (other.getTenantId() != null && !tenantId.equals(other.getTenantId())) {
                continue;
            }
            List<FinancialTransaction> incomeRows = findMappingSlotIncomeRows(repository, tenantId, other.getId());
            long income = sumValidIncome(incomeRows);
            Integer sessions = other.getTotalSessions();
            boolean sessionsRecorded = sessions != null && sessions >= 1;
            if (income <= 0L) {
                if (!incomeRows.isEmpty() && sessionsRecorded) {
                    reversedSessions += sessions;
                }
                continue;
            }
            if (!sessionsRecorded) {
                undeterminable = true;
                continue;
            }
            addonIds.add(other.getId());
            addonSessions += sessions;
            addonIncome += income;
        }
        if (addonIds.isEmpty() || undeterminable) {
            return MergedAddonRefund.none(reversedSessions);
        }
        int used = target.getUsedSessions() != null ? target.getUsedSessions() : 0;
        int remaining = target.getRemainingSessions() != null ? target.getRemainingSessions() : 0;
        if (!isMergedAddonUnused(originalTotalSessions - reversedSessions, used, remaining, addonSessions)) {
            return MergedAddonRefund.none(reversedSessions);
        }
        return new MergedAddonRefund(true, List.copyOf(addonIds), addonSessions, addonIncome, reversedSessions);
    }

    /**
     * 기본 회기 먼저 소진 규칙에서 병합 B 회기가 전부 남아 있는지.
     *
     * @param originalTotalSessions 부분 환불 차감 전 A 총회기 (병합 회기 포함)
     * @param usedSessions A 사용 회기
     * @param remainingSessions A 잔여 회기
     * @param addonSessions 병합 B 회기 합
     * @return B 미사용이면 true
     */
    public static boolean isMergedAddonUnused(int originalTotalSessions, int usedSessions, int remainingSessions,
            int addonSessions) {
        if (addonSessions < 1) {
            return false;
        }
        return originalTotalSessions - usedSessions >= addonSessions && remainingSessions >= addonSessions;
    }

    /**
     * 판정이 되돌리기로 정한 B 행의 유효 INCOME 을 모두 취소한다. 호출자 트랜잭션 안에서 실행한다.
     *
     * @param financialTransactionService 재무 거래 서비스
     * @param addon 판정 결과
     * @return 취소한 건수
     */
    public static int cancelMergedAddonIncome(FinancialTransactionService financialTransactionService,
            MergedAddonRefund addon) {
        if (financialTransactionService == null || addon == null || !addon.reversible()) {
            return 0;
        }
        int cancelled = 0;
        for (Long addonId : addon.addonMappingIds()) {
            cancelled += cancelPostedMappingSlotIncome(financialTransactionService, addonId);
        }
        return cancelled;
    }

    private static List<FinancialTransaction> findMappingSlotIncomeRows(FinancialTransactionRepository repository,
            String tenantId, Long mappingId) {
        List<FinancialTransaction> incomeRows = new ArrayList<>();
        for (String relatedEntityType : MAPPING_SLOT_RELATED_ENTITY_TYPES) {
            List<FinancialTransaction> rows = repository
                    .findByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndIsDeletedFalse(
                            tenantId, mappingId, relatedEntityType);
            if (rows == null) {
                continue;
            }
            for (FinancialTransaction row : rows) {
                if (row != null && row.getTransactionType() == FinancialTransaction.TransactionType.INCOME) {
                    incomeRows.add(row);
                }
            }
        }
        return incomeRows;
    }

    /**
     * 유효 INCOME 금액 합. 취소 대상({@code cancelRelatedPostedIncomeTransactions})과 같은 조건이다.
     */
    private static long sumValidIncome(List<FinancialTransaction> incomeRows) {
        BigDecimal sum = BigDecimal.ZERO;
        for (FinancialTransaction row : incomeRows) {
            if (FinancialTransactionValidity.isValid(row) && row.getAmount() != null) {
                sum = sum.add(row.getAmount());
            }
        }
        return sum.setScale(0, RoundingMode.DOWN).longValue();
    }

    /**
     * 병합 추가 패키지 되돌리기 판정 결과.
     *
     * @param reversible B 수입을 취소하고 환불에 넣을지
     * @param addonMappingIds 되돌릴 B 매핑 ID
     * @param addonSessions B 회기 합
     * @param addonIncomeAmount 취소할 B 유효 INCOME 금액 합 (환불액에 더하는 B 가격)
     * @param reversedAddonSessions 앞선 환불로 이미 되돌린 B 회기 합 (INCOME 이 있었으나 모두 취소된 병합 행).
     *        A 단가 분모(원래 총회기)에서 뺀다.
     */
    public record MergedAddonRefund(boolean reversible, List<Long> addonMappingIds, int addonSessions,
            long addonIncomeAmount, int reversedAddonSessions) {

        /**
         * 되돌리지 않음.
         *
         * @return 빈 결과
         */
        public static MergedAddonRefund none() {
            return none(0);
        }

        /**
         * 되돌리지 않음. 이미 되돌린 B 회기만 기록한다.
         *
         * @param reversedAddonSessions 이미 되돌린 B 회기 합
         * @return 결과
         */
        public static MergedAddonRefund none(int reversedAddonSessions) {
            return new MergedAddonRefund(false, List.of(), 0, 0L, Math.max(0, reversedAddonSessions));
        }
    }

    /**
     * 추가 패키지가 이 타깃으로 병합되었는지.
     *
     * @param source 추가 패키지 매핑
     * @param targetMappingId 타깃 ACTIVE 매핑 ID
     * @return 병합 완료 notes 가 타깃을 가리키면 true
     */
    public static boolean isMergedIntoTarget(ConsultantClientMapping source, Long targetMappingId) {
        if (source == null || targetMappingId == null) {
            return false;
        }
        String notes = source.getNotes();
        if (notes == null || !notes.contains(AdminServiceUserFacingMessages.NOTES_ADDITIONAL_MAPPING_MERGED_MARKER)) {
            return false;
        }
        Matcher matcher = MERGED_TARGET_MAPPING_ID.matcher(notes);
        return matcher.find() && targetMappingId.equals(Long.parseLong(matcher.group(1)));
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
