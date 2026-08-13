package com.coresolution.consultation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 주간 예약 현황 — 요일별 건수 항목 (ISO: 월=1 … 일=7).
 *
 * @author CoreSolution
 * @since 2026-08-13
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WeeklyReservationDayItemResponse {

    /** ISO day-of-week (1=월요일 … 7=일요일) */
    private int dayOfWeek;

    /** 요일 코드 (MON … SUN) */
    private String dayOfWeekCode;

    /** 해당 요일 예약 건수 */
    private long count;
}
