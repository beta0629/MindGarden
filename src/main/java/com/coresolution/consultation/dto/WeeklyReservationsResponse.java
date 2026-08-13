package com.coresolution.consultation.dto;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 주간 예약 현황 통계 응답 (월~일 캘린더 주).
 *
 * <p>dayOfWeek는 ISO 기준 1=월요일 … 7=일요일.
 * weekOffset 0=이번 주, -1=지난주. previousWeekTotalCount는 선택 주의 바로 전 주 총량.</p>
 *
 * @author CoreSolution
 * @since 2026-08-13
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WeeklyReservationsResponse {

    /** 선택 주 시작일 (월요일, YYYY-MM-DD) */
    private LocalDate weekStart;

    /** 선택 주 종료일 (일요일, YYYY-MM-DD) */
    private LocalDate weekEnd;

    /** 0=이번 주, -1=지난주 */
    private int weekOffset;

    /** 선택 주 총 예약 건수 */
    private long totalCount;

    /** 선택 주 직전 주 총 예약 건수 */
    private long previousWeekTotalCount;

    /** totalCount - previousWeekTotalCount */
    private long changeAbs;

    /**
     * 전주 대비 증감률(%). previousWeekTotalCount가 0이면 null.
     */
    private Double changePercent;

    /** 월~일 7항목 (항상 고정 길이) */
    @Builder.Default
    private List<WeeklyReservationDayItemResponse> byDayOfWeek = new ArrayList<>();

    /** BOOKED / CONFIRMED / COMPLETED / CANCELLED 4항목 */
    @Builder.Default
    private List<WeeklyReservationStatusItemResponse> byStatus = new ArrayList<>();
}
