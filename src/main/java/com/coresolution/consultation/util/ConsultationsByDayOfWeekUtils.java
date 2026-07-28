package com.coresolution.consultation.util;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

import com.coresolution.consultation.constant.admin.AdminServiceUserFacingMessages;
import com.coresolution.consultation.dto.ConsultationDayOfWeekItemResponse;
import com.coresolution.consultation.dto.ConsultationsByDayOfWeekResponse;

/**
 * 일자별 건수를 요일(월~일) 버킷으로 집계하고 피크 요일을 산출한다.
 *
 * @author CoreSolution
 * @since 2026-07-28
 */
public final class ConsultationsByDayOfWeekUtils {

    private ConsultationsByDayOfWeekUtils() {
    }

    /**
     * 일자별 (date, count) 행을 ISO 요일 버킷으로 합산한다.
     *
     * @param dateCountRows Object[]{LocalDate date, Number count} 목록 (null/빈 허용)
     * @return 월~일 7항목 + peakDayOfWeek/peakCount
     */
    public static ConsultationsByDayOfWeekResponse aggregateFromDateCounts(List<Object[]> dateCountRows) {
        Map<DayOfWeek, Long> counts = new EnumMap<>(DayOfWeek.class);
        for (DayOfWeek dow : DayOfWeek.values()) {
            counts.put(dow, 0L);
        }
        if (dateCountRows != null) {
            for (Object[] row : dateCountRows) {
                if (row == null || row.length < 2 || !(row[0] instanceof LocalDate)) {
                    continue;
                }
                LocalDate date = (LocalDate) row[0];
                long count = row[1] instanceof Number ? ((Number) row[1]).longValue() : 0L;
                if (count <= 0L) {
                    continue;
                }
                DayOfWeek dow = date.getDayOfWeek();
                counts.put(dow, counts.get(dow) + count);
            }
        }
        return buildResponse(counts);
    }

    /**
     * 요일별 count 맵으로 응답을 만든다.
     *
     * @param counts DayOfWeek → count (누락 요일은 0)
     * @return 응답 DTO
     */
    public static ConsultationsByDayOfWeekResponse buildResponse(Map<DayOfWeek, Long> counts) {
        List<ConsultationDayOfWeekItemResponse> items = new ArrayList<>(7);
        long peakCount = -1L;
        Integer peakDayOfWeek = null;
        for (DayOfWeek dow : DayOfWeek.values()) {
            long count = counts != null && counts.get(dow) != null ? counts.get(dow) : 0L;
            int iso = dow.getValue();
            items.add(ConsultationDayOfWeekItemResponse.builder()
                    .dayOfWeek(iso)
                    .label(labelForIsoDay(iso))
                    .count(count)
                    .build());
            if (count > peakCount) {
                peakCount = count;
                peakDayOfWeek = iso;
            }
        }
        boolean allZero = peakCount <= 0L;
        return ConsultationsByDayOfWeekResponse.builder()
                .items(items)
                .peakDayOfWeek(allZero ? null : peakDayOfWeek)
                .peakCount(allZero ? null : peakCount)
                .build();
    }

    /**
     * ISO day-of-week(1–7) → 한글 요일 라벨.
     *
     * @param isoDay 1=월 … 7=일
     * @return 라벨 (범위 밖이면 빈 문자열)
     */
    public static String labelForIsoDay(int isoDay) {
        switch (isoDay) {
            case 1:
                return AdminServiceUserFacingMessages.DAY_OF_WEEK_MON;
            case 2:
                return AdminServiceUserFacingMessages.DAY_OF_WEEK_TUE;
            case 3:
                return AdminServiceUserFacingMessages.DAY_OF_WEEK_WED;
            case 4:
                return AdminServiceUserFacingMessages.DAY_OF_WEEK_THU;
            case 5:
                return AdminServiceUserFacingMessages.DAY_OF_WEEK_FRI;
            case 6:
                return AdminServiceUserFacingMessages.DAY_OF_WEEK_SAT;
            case 7:
                return AdminServiceUserFacingMessages.DAY_OF_WEEK_SUN;
            default:
                return "";
        }
    }

    /**
     * 전월 대비 증감률(%). 전월 0이면 null (FE fromZero 배지용).
     *
     * @param current  당월 건수
     * @param previous 전월 건수
     * @return 소수 첫째자리 반올림 증감률 또는 null
     */
    public static Double calcGrowthRatePercent(long current, long previous) {
        if (previous <= 0L) {
            return null;
        }
        return Math.round(((double) current - (double) previous) / (double) previous * 1000.0) / 10.0;
    }
}
