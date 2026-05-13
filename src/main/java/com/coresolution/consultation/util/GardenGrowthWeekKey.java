package com.coresolution.consultation.util;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.ZoneId;

/**
 * Expo {@code getGardenWeekKey} 와 동일한 월요일 00:00 기준 주 키(YYYY-MM-DD).
 *
 * @author MindGarden
 * @since 2026-05-13
 */
public final class GardenGrowthWeekKey {

    private GardenGrowthWeekKey() {
    }

    /**
     * 주어진 존의 '오늘'에 해당하는 정원 주 키를 반환한다.
     *
     * @param zone 타임존
     * @return 해당 주의 월요일 날짜 문자열
     */
    public static String currentWeekKey(ZoneId zone) {
        LocalDate today = LocalDate.now(zone);
        DayOfWeek dow = today.getDayOfWeek();
        int daysFromMonday = (dow.getValue() + 6) % 7;
        LocalDate monday = today.minusDays(daysFromMonday);
        return monday.toString();
    }
}
