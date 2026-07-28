package com.coresolution.consultation.util;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.coresolution.consultation.dto.ConsultationDayOfWeekItemResponse;
import com.coresolution.consultation.dto.ConsultationsByDayOfWeekResponse;

/**
 * ConsultationsByDayOfWeekUtils 단위 테스트.
 *
 * @author CoreSolution
 * @since 2026-07-28
 */
class ConsultationsByDayOfWeekUtilsTest {

    @Test
    @DisplayName("일자별 건수를 월~일 버킷으로 합산하고 피크 요일을 산출한다")
    void aggregateFromDateCounts_sumsByIsoDayAndFindsPeak() {
        // 2026-07-27 = Monday, 2026-07-29 = Wednesday
        List<Object[]> rows = Arrays.asList(
                new Object[] { LocalDate.of(2026, 7, 27), 10L },
                new Object[] { LocalDate.of(2026, 7, 28), 5L },
                new Object[] { LocalDate.of(2026, 7, 29), 20L },
                new Object[] { LocalDate.of(2026, 8, 5), 12L } // Wednesday
        );

        ConsultationsByDayOfWeekResponse response =
                ConsultationsByDayOfWeekUtils.aggregateFromDateCounts(rows);

        assertEquals(7, response.getItems().size());
        assertEquals(3, response.getPeakDayOfWeek());
        assertEquals(32L, response.getPeakCount());

        ConsultationDayOfWeekItemResponse wed = response.getItems().get(2);
        assertEquals(3, wed.getDayOfWeek());
        assertEquals(32L, wed.getCount());
    }

    @Test
    @DisplayName("전부 0이면 peakDayOfWeek·peakCount는 null")
    void buildResponse_allZero_peakIsNull() {
        ConsultationsByDayOfWeekResponse response =
                ConsultationsByDayOfWeekUtils.aggregateFromDateCounts(Collections.emptyList());

        assertEquals(7, response.getItems().size());
        assertNull(response.getPeakDayOfWeek());
        assertNull(response.getPeakCount());
        assertEquals(0L, response.getItems().get(0).getCount());
    }

    @Test
    @DisplayName("전월 0이면 증감률은 null")
    void calcGrowthRatePercent_previousZero_returnsNull() {
        assertNull(ConsultationsByDayOfWeekUtils.calcGrowthRatePercent(10L, 0L));
        assertEquals(25.0, ConsultationsByDayOfWeekUtils.calcGrowthRatePercent(25L, 20L));
    }
}
