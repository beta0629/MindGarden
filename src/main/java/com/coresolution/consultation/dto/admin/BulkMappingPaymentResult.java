package com.coresolution.consultation.dto.admin;

import java.util.List;
import java.util.stream.Collectors;

import lombok.Builder;
import lombok.Getter;

/**
 * 일괄 매칭 결제 확인·취소 처리 결과 (요청 순서대로 매칭마다 1건).
 *
 * <p>사전 검증(역할·형식·테넌트·상태)을 모두 통과한 뒤에만 처리를 시작한다. 처리는 매칭마다 독립 트랜잭션
 * (그 매칭의 결제·회기·ERP 는 전부 반영 아니면 전부 롤백)이고, 한 매칭이 실패해도 앞서 커밋된 매칭은 유지되며
 * 나머지 매칭도 계속 처리한다. 여러 매칭을 하나의 트랜잭션으로 묶지 않는다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-04
 */
@Getter
@Builder
public class BulkMappingPaymentResult {

    /** 매칭별 처리 상태 */
    public enum ItemStatus {
        /** 이번 요청으로 처리·커밋됨 */
        SUCCEEDED,
        /** 처리 실패 — 그 매칭의 변경은 모두 롤백됨 */
        FAILED,
        /** 사전 검증 뒤 다른 요청이 먼저 처리해 건너뜀 (재처리·재환불 없음) */
        SKIPPED
    }

    /**
     * 매칭 1건의 처리 결과.
     *
     * <p>{@code code}·{@code message} 는 실패·건너뜀일 때만 채운다. 관리자에게 보여 줄 표준 코드·안내 문구만 담고
     * 예외 메시지·스택은 담지 않는다.</p>
     */
    @Getter
    @Builder
    public static class Item {

        private final Long mappingId;

        private final ItemStatus status;

        private final String code;

        private final String message;
    }

    /** 요청 순서대로의 매칭별 결과 */
    private final List<Item> items;

    /**
     * 이번 요청으로 처리(커밋)된 매칭 ID.
     *
     * @return 처리된 매칭 ID 목록
     */
    public List<Long> getProcessedMappingIds() {
        return idsOf(ItemStatus.SUCCEEDED);
    }

    /**
     * 다른 요청이 먼저 처리해 건너뛴 매칭 ID.
     *
     * @return 건너뛴 매칭 ID 목록
     */
    public List<Long> getSkippedMappingIds() {
        return idsOf(ItemStatus.SKIPPED);
    }

    /**
     * 처리에 실패해 롤백된 매칭 ID.
     *
     * @return 실패한 매칭 ID 목록
     */
    public List<Long> getFailedMappingIds() {
        return idsOf(ItemStatus.FAILED);
    }

    /**
     * 실패한 매칭이 하나도 없는지 여부.
     *
     * @return 실패가 없으면 true
     */
    public boolean isAllSucceededOrSkipped() {
        return getFailedMappingIds().isEmpty();
    }

    private List<Long> idsOf(ItemStatus status) {
        return items.stream()
                .filter(item -> item.getStatus() == status)
                .map(Item::getMappingId)
                .collect(Collectors.toList());
    }
}
