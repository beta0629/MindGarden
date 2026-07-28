package com.coresolution.consultation.dto;

import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 월별 신규 내담자 유입 통계 응답.
 *
 * @author CoreSolution
 * @since 2026-07-28
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NewClientsStatisticsResponse {

    /** 월별 항목 (과거→현재) */
    @Builder.Default
    private List<NewClientMonthlyItemResponse> items = new ArrayList<>();

    /**
     * 최신 월의 전월 대비 증감률(%). items 마지막 항목의 growthRate와 동일.
     */
    private Double growthRate;
}
