package com.coresolution.consultation.dto;

import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 요일별 상담 건수 통계 응답.
 *
 * @author CoreSolution
 * @since 2026-07-28
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConsultationsByDayOfWeekResponse {

    /** 월~일 7개 항목 (항상 고정 길이) */
    @Builder.Default
    private List<ConsultationDayOfWeekItemResponse> items = new ArrayList<>();

    /**
     * 최다 요일 ISO day-of-week. 전부 0이면 null.
     */
    private Integer peakDayOfWeek;

    /** 최다 요일 건수. 전부 0이면 null. */
    private Long peakCount;
}
