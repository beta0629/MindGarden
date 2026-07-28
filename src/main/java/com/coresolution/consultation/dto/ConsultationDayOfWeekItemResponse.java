package com.coresolution.consultation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 요일별 상담 건수 집계 항목 (ISO: 월=1 … 일=7).
 *
 * @author CoreSolution
 * @since 2026-07-28
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConsultationDayOfWeekItemResponse {

    /** ISO day-of-week (1=월요일 … 7=일요일) */
    private int dayOfWeek;

    /** 표시 라벨 (예: 월요일) */
    private String label;

    /** 해당 요일 상담 건수 */
    private long count;
}
