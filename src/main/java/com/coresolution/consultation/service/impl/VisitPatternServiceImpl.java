package com.coresolution.consultation.service.impl;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.constant.VisitPredictionConstants;
import com.coresolution.consultation.dto.prediction.VisitPatternResult;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.service.VisitPatternService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 내담자 방문 패턴 분석 서비스 구현체
 *
 * @author MindGarden
 * @version 1.0.0
 * @since 2026-08-13
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class VisitPatternServiceImpl implements VisitPatternService {

    private final ScheduleRepository scheduleRepository;

    @Override
    public Optional<VisitPatternResult> calculatePattern(String tenantId, Long consultantId, Long clientId) {
        log.debug("방문 패턴 계산 시작: tenantId={}, consultantId={}, clientId={}", tenantId, consultantId, clientId);

        List<Schedule> completedSchedules = scheduleRepository
                .findByTenantIdAndConsultantIdAndClientIdAndStatusAndIsDeletedFalse(
                        tenantId, consultantId, clientId, ScheduleStatus.COMPLETED);

        if (completedSchedules.size() < VisitPredictionConstants.MIN_COMPLETED_SESSIONS_FOR_PATTERN) {
            log.debug("게이트 미통과: completedCount={}, 최소 필요={}",
                    completedSchedules.size(), VisitPredictionConstants.MIN_COMPLETED_SESSIONS_FOR_PATTERN);
            return Optional.empty();
        }

        List<LocalDate> sortedDates = completedSchedules.stream()
                .map(Schedule::getDate)
                .sorted()
                .collect(Collectors.toList());

        long[] intervals = calculateIntervals(sortedDates);
        int intervalMedian = calculateMedian(intervals);
        DayOfWeek preferredDow = calculatePreferredDayOfWeek(sortedDates);
        double confidence = calculateConfidence(intervals);
        LocalDate lastCompletedDate = sortedDates.get(sortedDates.size() - 1);

        VisitPatternResult result = VisitPatternResult.builder()
                .intervalDays(intervalMedian)
                .preferredDayOfWeek(preferredDow)
                .confidence(confidence)
                .completedCount(completedSchedules.size())
                .lastCompletedDate(lastCompletedDate)
                .build();

        log.debug("방문 패턴 계산 완료: clientId={}, interval={}일, dow={}, confidence={}",
                clientId, intervalMedian, preferredDow, confidence);

        return Optional.of(result);
    }

    /**
     * 최근 N개 일정 간의 간격(일) 배열 산출
     */
    private long[] calculateIntervals(List<LocalDate> sortedDates) {
        int startIdx = Math.max(0, sortedDates.size() - VisitPredictionConstants.RECENT_SESSIONS_FOR_INTERVAL - 1);
        List<LocalDate> recentDates = sortedDates.subList(startIdx, sortedDates.size());

        long[] intervals = new long[recentDates.size() - 1];
        for (int i = 0; i < intervals.length; i++) {
            intervals[i] = ChronoUnit.DAYS.between(recentDates.get(i), recentDates.get(i + 1));
        }
        return intervals;
    }

    /**
     * 중앙값 계산
     */
    private int calculateMedian(long[] intervals) {
        if (intervals.length == 0) {
            return 0;
        }
        long[] sorted = Arrays.copyOf(intervals, intervals.length);
        Arrays.sort(sorted);
        int mid = sorted.length / 2;
        if (sorted.length % 2 == 0) {
            return (int) ((sorted[mid - 1] + sorted[mid]) / 2);
        }
        return (int) sorted[mid];
    }

    /**
     * 선호 요일 (최빈값) 계산
     */
    private DayOfWeek calculatePreferredDayOfWeek(List<LocalDate> sortedDates) {
        int startIdx = Math.max(0, sortedDates.size() - VisitPredictionConstants.RECENT_SESSIONS_FOR_INTERVAL);
        List<LocalDate> recentDates = sortedDates.subList(startIdx, sortedDates.size());

        Map<DayOfWeek, Long> dayOfWeekCounts = recentDates.stream()
                .map(LocalDate::getDayOfWeek)
                .collect(Collectors.groupingBy(d -> d, Collectors.counting()));

        return dayOfWeekCounts.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse(DayOfWeek.MONDAY);
    }

    /**
     * 신뢰도 계산: confidence = 1 - (표준편차 / 평균), 0~1 클램프
     */
    private double calculateConfidence(long[] intervals) {
        if (intervals.length == 0) {
            return VisitPredictionConstants.CONFIDENCE_MIN;
        }

        double mean = Arrays.stream(intervals).average().orElse(0.0);
        if (mean == 0.0) {
            return VisitPredictionConstants.CONFIDENCE_MIN;
        }

        double variance = Arrays.stream(intervals)
                .mapToDouble(v -> Math.pow(v - mean, 2))
                .average()
                .orElse(0.0);
        double stdDev = Math.sqrt(variance);

        double confidence = 1.0 - (stdDev / mean);
        return Math.max(VisitPredictionConstants.CONFIDENCE_MIN,
                Math.min(VisitPredictionConstants.CONFIDENCE_MAX, confidence));
    }
}
