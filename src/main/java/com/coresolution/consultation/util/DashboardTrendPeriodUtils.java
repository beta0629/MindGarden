package com.coresolution.consultation.util;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * 관리자 대시보드 차트용 rolling 기간 계산 (KST 기준).
 *
 * @author CoreSolution
 * @since 2026-07-02
 */
public final class DashboardTrendPeriodUtils {

    public static final ZoneId TREND_ZONE = ZoneId.of("Asia/Seoul");

    private DashboardTrendPeriodUtils() {
    }

    /**
     * KST 기준 오늘 날짜.
     *
     * @return Asia/Seoul {@link LocalDate}
     */
    public static LocalDate todayInTrendZone() {
        return LocalDate.now(TREND_ZONE);
    }

    /**
     * 현재 월 포함 rolling 최근 {@code lastMonths}개월의 각 월 1일 목록(오름차순).
     *
     * @param lastMonths 포함할 개월 수 (0 이하이면 1)
     * @param today      기준일 (보통 KST 오늘)
     * @return 월 시작일 목록
     */
    public static List<LocalDate> rollingMonthStarts(int lastMonths, LocalDate today) {
        if (today == null) {
            return Collections.emptyList();
        }
        int months = lastMonths > 0 ? lastMonths : 1;
        LocalDate currentMonthStart = today.withDayOfMonth(1);
        List<LocalDate> result = new ArrayList<>(months);
        for (int i = months - 1; i >= 0; i--) {
            result.add(currentMonthStart.minusMonths(i));
        }
        return result;
    }

    /**
     * 오늘 포함 rolling 최근 {@code lastDays}일의 각 일자 목록(오름차순).
     *
     * @param lastDays 포함할 일수 (0 이하이면 1)
     * @param today    기준일 (보통 KST 오늘)
     * @return 일자 목록
     */
    public static List<LocalDate> rollingDays(int lastDays, LocalDate today) {
        if (today == null) {
            return Collections.emptyList();
        }
        int days = lastDays > 0 ? lastDays : 1;
        List<LocalDate> result = new ArrayList<>(days);
        for (int i = days - 1; i >= 0; i--) {
            result.add(today.minusDays(i));
        }
        return result;
    }

    /**
     * 현재 연도 포함 rolling 최근 {@code lastYears}년의 각 연도 1월 1일 목록(오름차순).
     *
     * @param lastYears 포함할 연수 (0 이하이면 1)
     * @param today     기준일 (보통 KST 오늘)
     * @return 연도 시작일 목록
     */
    public static List<LocalDate> rollingYearStarts(int lastYears, LocalDate today) {
        if (today == null) {
            return Collections.emptyList();
        }
        int years = lastYears > 0 ? lastYears : 1;
        LocalDate currentYearStart = today.withDayOfYear(1);
        List<LocalDate> result = new ArrayList<>(years);
        for (int i = years - 1; i >= 0; i--) {
            result.add(currentYearStart.minusYears(i));
        }
        return result;
    }
}
