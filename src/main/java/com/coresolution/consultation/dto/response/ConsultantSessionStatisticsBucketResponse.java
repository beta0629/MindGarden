package com.coresolution.consultation.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 완료 회기 통계 버킷 한 구간(라벨 + 건수).
 *
 * @author CoreSolution
 * @since 2026-05-16
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConsultantSessionStatisticsBucketResponse {

    /**
     * 구간 식별 라벨. DAY: {@code YYYY-MM-DD}, WEEK: 해당 주의 월요일 {@code YYYY-MM-DD},
     * MONTH: 해당 월 1일 {@code YYYY-MM-DD}.
     */
    private String label;

    /** 해당 구간의 완료(COMPLETED) 회기 수 */
    private long count;
}
