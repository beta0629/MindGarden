package com.coresolution.consultation.dto.admin;

import java.util.List;

import lombok.Builder;
import lombok.Getter;

/**
 * 일괄 매칭 결제 확인·취소 처리 결과.
 *
 * <p>사전 검증(형식·테넌트·상태)을 모두 통과한 뒤에만 처리를 시작한다. 처리는 매칭마다 독립 트랜잭션이며,
 * 한 매칭이 실패하면 그 매칭부터 나머지는 처리하지 않는다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-04
 */
@Getter
@Builder
public class BulkMappingPaymentResult {

    /** 이번 요청으로 처리(커밋)된 매칭 ID */
    private final List<Long> processedMappingIds;

    /** 사전 검증 뒤 다른 요청이 먼저 처리해 건너뛴 매칭 ID (재처리·재환불 없음) */
    private final List<Long> skippedMappingIds;

    /** 처리 중 실패한 매칭 ID (없으면 null) */
    private final Long failedMappingId;

    /** 실패로 중단되어 처리하지 않은 매칭 ID */
    private final List<Long> notProcessedMappingIds;

    /**
     * 모든 매칭을 처리했는지(실패 없이 끝났는지) 여부.
     *
     * @return 실패한 매칭이 없으면 true
     */
    public boolean isCompleted() {
        return failedMappingId == null;
    }
}
