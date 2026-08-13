package com.coresolution.consultation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 주간 예약 현황 — 상태별 건수 항목.
 *
 * @author CoreSolution
 * @since 2026-08-13
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WeeklyReservationStatusItemResponse {

    /** ScheduleStatus name (BOOKED, CONFIRMED, COMPLETED, CANCELLED) */
    private String status;

    /** 해당 상태 건수 */
    private long count;
}
