package com.coresolution.consultation.dto.response;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 상담사 본인 완료(COMPLETED) 회기 집계 응답.
 *
 * @author CoreSolution
 * @since 2026-05-16
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConsultantSessionStatisticsResponse {

    /** {@code startDate}~{@code endDate} 구간 합계 */
    private long totalCompleted;

    /** granularity에 맞춘 버킷 목록(시간순) */
    private List<ConsultantSessionStatisticsBucketResponse> buckets;

    /**
     * 동일 일수만큼 바로 이전 기간의 완료 합계(증감 카드용). 이전 기간이 유효하지 않으면 null.
     */
    private Long previousPeriodTotal;
}
