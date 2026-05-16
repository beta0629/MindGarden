package com.coresolution.consultation.service.impl;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import com.coresolution.consultation.constant.ConsultantSessionStatisticsConstants;
import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.constant.SessionStatisticsGranularity;
import com.coresolution.consultation.dto.response.ConsultantSessionStatisticsBucketResponse;
import com.coresolution.consultation.dto.response.ConsultantSessionStatisticsResponse;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.service.ConsultantCompletedSessionStatisticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * {@link ScheduleRepository} 기반 완료 회기 집계. 일자별 1회 그룹 쿼리 후 서버에서 버킷 합산.
 *
 * @author CoreSolution
 * @since 2026-05-16
 */
@Service
@RequiredArgsConstructor
public class ConsultantCompletedSessionStatisticsServiceImpl implements ConsultantCompletedSessionStatisticsService {

    private final ScheduleRepository scheduleRepository;

    @Override
    @Transactional(readOnly = true)
    public ConsultantSessionStatisticsResponse aggregateCompletedSessions(
            String tenantId,
            Long consultantId,
            LocalDate startDate,
            LocalDate endDate,
            SessionStatisticsGranularity granularity) {

        Objects.requireNonNull(tenantId, "tenantId");
        Objects.requireNonNull(consultantId, "consultantId");
        Objects.requireNonNull(startDate, "startDate");
        Objects.requireNonNull(endDate, "endDate");
        Objects.requireNonNull(granularity, "granularity");

        if (tenantId.isBlank()) {
            throw new IllegalArgumentException("tenantId가 비어 있습니다.");
        }
        if (startDate.isAfter(endDate)) {
            throw new IllegalArgumentException("startDate는 endDate보다 늦을 수 없습니다.");
        }

        long inclusiveDays = ChronoUnit.DAYS.between(startDate, endDate) + 1;
        if (inclusiveDays > ConsultantSessionStatisticsConstants.MAX_QUERY_RANGE_DAYS_INCLUSIVE) {
            throw new IllegalArgumentException(
                    "조회 기간은 최대 " + ConsultantSessionStatisticsConstants.MAX_QUERY_RANGE_DAYS_INCLUSIVE
                            + "일까지 허용됩니다.");
        }

        long totalCompleted = scheduleRepository.countByStatusAndDateBetweenAndConsultantId(
                tenantId,
                ScheduleStatus.COMPLETED,
                startDate,
                endDate,
                consultantId);

        Map<LocalDate, Long> countsByDay = loadCountsByDay(tenantId, consultantId, startDate, endDate);

        List<ConsultantSessionStatisticsBucketResponse> buckets =
                buildBuckets(startDate, endDate, granularity, countsByDay);

        Long previousPeriodTotal = computePreviousPeriodTotal(
                tenantId, consultantId, startDate, inclusiveDays);

        return ConsultantSessionStatisticsResponse.builder()
                .totalCompleted(totalCompleted)
                .buckets(buckets)
                .previousPeriodTotal(previousPeriodTotal)
                .build();
    }

    private Map<LocalDate, Long> loadCountsByDay(
            String tenantId,
            Long consultantId,
            LocalDate startDate,
            LocalDate endDate) {

        List<Object[]> rows = scheduleRepository.countByTenantConsultantStatusAndDateBetweenGroupedByDate(
                tenantId, consultantId, ScheduleStatus.COMPLETED, startDate, endDate);
        Map<LocalDate, Long> map = new LinkedHashMap<>();
        for (Object[] row : rows) {
            if (row == null || row.length < 2 || row[0] == null || row[1] == null) {
                continue;
            }
            LocalDate d = toLocalDate(row[0]);
            long c = ((Number) row[1]).longValue();
            map.put(d, c);
        }
        return map;
    }

    private Long computePreviousPeriodTotal(
            String tenantId,
            Long consultantId,
            LocalDate startDate,
            long inclusiveDays) {

        LocalDate previousEnd = startDate.minusDays(1);
        LocalDate previousStart = previousEnd.minusDays(inclusiveDays - 1);
        if (previousStart.isAfter(previousEnd)) {
            return null;
        }
        return scheduleRepository.countByStatusAndDateBetweenAndConsultantId(
                tenantId,
                ScheduleStatus.COMPLETED,
                previousStart,
                previousEnd,
                consultantId);
    }

    private static List<ConsultantSessionStatisticsBucketResponse> buildBuckets(
            LocalDate startDate,
            LocalDate endDate,
            SessionStatisticsGranularity granularity,
            Map<LocalDate, Long> countsByDay) {

        return switch (granularity) {
            case DAY -> buildDayBuckets(startDate, endDate, countsByDay);
            case WEEK -> buildWeekBuckets(startDate, endDate, countsByDay);
            case MONTH -> buildMonthBuckets(startDate, endDate, countsByDay);
        };
    }

    private static List<ConsultantSessionStatisticsBucketResponse> buildDayBuckets(
            LocalDate startDate,
            LocalDate endDate,
            Map<LocalDate, Long> countsByDay) {

        List<ConsultantSessionStatisticsBucketResponse> out = new ArrayList<>();
        for (LocalDate d = startDate; !d.isAfter(endDate); d = d.plusDays(1)) {
            long c = countsByDay.getOrDefault(d, 0L);
            out.add(ConsultantSessionStatisticsBucketResponse.builder()
                    .label(d.toString())
                    .count(c)
                    .build());
        }
        return out;
    }

    private static List<ConsultantSessionStatisticsBucketResponse> buildWeekBuckets(
            LocalDate startDate,
            LocalDate endDate,
            Map<LocalDate, Long> countsByDay) {

        LocalDate firstMonday = startDate.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate lastMonday = endDate.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));

        List<ConsultantSessionStatisticsBucketResponse> out = new ArrayList<>();
        for (LocalDate weekMonday = firstMonday;
                !weekMonday.isAfter(lastMonday);
                weekMonday = weekMonday.plusWeeks(1)) {

            LocalDate from = weekMonday.isBefore(startDate) ? startDate : weekMonday;
            LocalDate weekEnd = weekMonday.plusDays(6);
            LocalDate to = weekEnd.isAfter(endDate) ? endDate : weekEnd;

            long sum = 0L;
            for (LocalDate d = from; !d.isAfter(to); d = d.plusDays(1)) {
                sum += countsByDay.getOrDefault(d, 0L);
            }
            out.add(ConsultantSessionStatisticsBucketResponse.builder()
                    .label(weekMonday.toString())
                    .count(sum)
                    .build());
        }
        return out;
    }

    private static List<ConsultantSessionStatisticsBucketResponse> buildMonthBuckets(
            LocalDate startDate,
            LocalDate endDate,
            Map<LocalDate, Long> countsByDay) {

        YearMonth ymStart = YearMonth.from(startDate);
        YearMonth ymEnd = YearMonth.from(endDate);

        List<ConsultantSessionStatisticsBucketResponse> out = new ArrayList<>();
        for (YearMonth ym = ymStart; !ym.isAfter(ymEnd); ym = ym.plusMonths(1)) {
            LocalDate monthFirst = ym.atDay(1);
            LocalDate monthLast = ym.atEndOfMonth();
            LocalDate from = monthFirst.isBefore(startDate) ? startDate : monthFirst;
            LocalDate to = monthLast.isAfter(endDate) ? endDate : monthLast;

            long sum = 0L;
            for (LocalDate d = from; !d.isAfter(to); d = d.plusDays(1)) {
                sum += countsByDay.getOrDefault(d, 0L);
            }
            out.add(ConsultantSessionStatisticsBucketResponse.builder()
                    .label(monthFirst.toString())
                    .count(sum)
                    .build());
        }
        return out;
    }

    private static LocalDate toLocalDate(Object value) {
        if (value instanceof LocalDate localDate) {
            return localDate;
        }
        if (value instanceof java.sql.Date sqlDate) {
            return sqlDate.toLocalDate();
        }
        throw new IllegalStateException("Unsupported date type in query result: " + value.getClass().getName());
    }
}
