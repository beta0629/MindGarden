package com.coresolution.consultation.util;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * {@link DashboardTrendPeriodUtils} rolling 월 범위 회귀 테스트.
 *
 * @author CoreSolution
 * @since 2026-07-02
 */
class DashboardTrendPeriodUtilsTest {

    @Test
    @DisplayName("7월 기준 rolling 6개월은 2~7월을 포함한다 (연초 고정 아님)")
    void rollingMonthStarts_july_includesFebThroughJul() {
        LocalDate today = LocalDate.of(2026, 7, 2);
        List<String> periods = DashboardTrendPeriodUtils.rollingMonthStarts(6, today).stream()
                .map(d -> d.format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM")))
                .collect(Collectors.toList());

        assertThat(periods).containsExactly(
                "2026-02", "2026-03", "2026-04", "2026-05", "2026-06", "2026-07");
    }

    @Test
    @DisplayName("6월 기준 rolling 6개월은 1~6월을 포함한다")
    void rollingMonthStarts_june_includesJanThroughJun() {
        LocalDate today = LocalDate.of(2026, 6, 30);
        List<String> periods = DashboardTrendPeriodUtils.rollingMonthStarts(6, today).stream()
                .map(d -> d.format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM")))
                .collect(Collectors.toList());

        assertThat(periods).containsExactly(
                "2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06");
    }

    @Test
    @DisplayName("3월 기준 rolling 6개월은 전년 10월부터 당월까지 포함한다")
    void rollingMonthStarts_march_crossesYearBoundary() {
        LocalDate today = LocalDate.of(2026, 3, 15);
        List<String> periods = DashboardTrendPeriodUtils.rollingMonthStarts(6, today).stream()
                .map(d -> d.format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM")))
                .collect(Collectors.toList());

        assertThat(periods).containsExactly(
                "2025-10", "2025-11", "2025-12", "2026-01", "2026-02", "2026-03");
    }
}
