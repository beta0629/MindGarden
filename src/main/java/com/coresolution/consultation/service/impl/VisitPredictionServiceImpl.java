package com.coresolution.consultation.service.impl;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.constant.VisitPredictionConstants;
import com.coresolution.consultation.dto.prediction.DismissExpectedVisitRequest;
import com.coresolution.consultation.dto.prediction.UnbookedExpectedClientResponse;
import com.coresolution.consultation.dto.prediction.VisitPatternResult;
import com.coresolution.consultation.dto.prediction.VisitPredictionSettingsUpdateRequest;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;
import com.coresolution.consultation.entity.VisitPredictionSettings;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.repository.VisitPredictionSettingsRepository;
import com.coresolution.consultation.service.VisitPatternService;
import com.coresolution.consultation.service.VisitPredictionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 방문 예측 서비스 구현체
 *
 * <p>ACTIVE 매핑의 내담자별 방문 패턴을 기반으로
 * 예상 방문일에 예약이 없는 내담자 목록을 실시간 산출한다.</p>
 *
 * @author MindGarden
 * @version 1.0.0
 * @since 2026-08-13
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class VisitPredictionServiceImpl implements VisitPredictionService {

    private final VisitPatternService visitPatternService;
    private final ConsultantClientMappingRepository mappingRepository;
    private final ScheduleRepository scheduleRepository;
    private final VisitPredictionSettingsRepository settingsRepository;

    private static final List<ScheduleStatus> OCCUPYING_STATUSES = Arrays.asList(
            ScheduleStatus.BOOKED,
            ScheduleStatus.CONFIRMED,
            ScheduleStatus.IN_PROGRESS
    );

    @Override
    @Transactional(readOnly = true)
    public Page<UnbookedExpectedClientResponse> findUnbookedExpectedClients(
            String tenantId, LocalDate startDate, LocalDate endDate, Long consultantId, Pageable pageable) {

        log.info("미예약 예상 방문 조회: tenantId={}, startDate={}, endDate={}, consultantId={}",
                tenantId, startDate, endDate, consultantId);

        List<ConsultantClientMapping> activeMappings = fetchActiveMappings(tenantId, consultantId);
        if (activeMappings.isEmpty()) {
            return new PageImpl<>(List.of(), pageable, 0);
        }

        Set<Long> disabledMappingIds = new HashSet<>(settingsRepository.findDisabledMappingIds(tenantId));

        List<Long> mappingIds = activeMappings.stream()
                .map(ConsultantClientMapping::getId)
                .collect(Collectors.toList());
        List<VisitPredictionSettings> allSettings = settingsRepository
                .findByTenantIdAndMappingIdIn(tenantId, mappingIds);
        Set<Long> dismissedMappingIds = allSettings.stream()
                .filter(s -> s.getDismissedUntilDate() != null && !s.getDismissedUntilDate().isBefore(startDate))
                .map(VisitPredictionSettings::getMappingId)
                .collect(Collectors.toSet());

        Set<String> bookedPairs = fetchBookedPairs(tenantId, startDate, endDate);

        List<UnbookedExpectedClientResponse> results = new ArrayList<>();

        for (ConsultantClientMapping mapping : activeMappings) {
            if (disabledMappingIds.contains(mapping.getId())) {
                continue;
            }
            if (dismissedMappingIds.contains(mapping.getId())) {
                continue;
            }

            Long mappingConsultantId = mapping.getConsultant().getId();
            Long clientId = mapping.getClient().getId();

            Optional<VisitPatternResult> patternOpt =
                    visitPatternService.calculatePattern(tenantId, mappingConsultantId, clientId);

            if (patternOpt.isEmpty()) {
                continue;
            }

            VisitPatternResult pattern = patternOpt.get();
            LocalDate nextExpectedDate = calculateNextExpectedDate(pattern);

            if (nextExpectedDate.isBefore(startDate) || nextExpectedDate.isAfter(endDate)) {
                continue;
            }

            String pairKey = mappingConsultantId + ":" + clientId;
            if (bookedPairs.contains(pairKey)) {
                continue;
            }

            results.add(UnbookedExpectedClientResponse.builder()
                    .clientId(clientId)
                    .clientName(maskName(mapping.getClient().getName()))
                    .consultantId(mappingConsultantId)
                    .consultantName(mapping.getConsultant().getName())
                    .mappingId(mapping.getId())
                    .expectedDate(nextExpectedDate)
                    .intervalDays(pattern.getIntervalDays())
                    .preferredDayOfWeek(pattern.getPreferredDayOfWeek())
                    .patternSummary(buildPatternSummary(pattern.getIntervalDays(), pattern.getPreferredDayOfWeek()))
                    .confidence(pattern.getConfidence())
                    .confidenceLevel(pattern.getConfidenceLevel())
                    .lastVisitDate(pattern.getLastCompletedDate())
                    .build());
        }

        results.sort((a, b) -> {
            int cmp = a.getExpectedDate().compareTo(b.getExpectedDate());
            if (cmp != 0) return cmp;
            return Double.compare(b.getConfidence(), a.getConfidence());
        });

        int total = results.size();
        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), total);
        List<UnbookedExpectedClientResponse> pageContent = start >= total
                ? List.of()
                : results.subList(start, end);

        log.info("미예약 예상 방문 조회 완료: total={}", total);
        return new PageImpl<>(pageContent, pageable, total);
    }

    @Override
    public void dismissExpectedVisit(String tenantId, DismissExpectedVisitRequest request) {
        log.info("예상 방문 무시: tenantId={}, mappingId={}, expectedDate={}",
                tenantId, request.getMappingId(), request.getExpectedDate());

        VisitPredictionSettings settings = settingsRepository
                .findByTenantIdAndMappingId(tenantId, request.getMappingId())
                .orElseGet(() -> {
                    VisitPredictionSettings newSettings = VisitPredictionSettings.builder()
                            .mappingId(request.getMappingId())
                            .predictionEnabled(true)
                            .build();
                    newSettings.setTenantId(tenantId);
                    return newSettings;
                });

        settings.setDismissedUntilDate(request.getExpectedDate());
        settingsRepository.save(settings);
        log.info("예상 방문 무시 설정 완료: mappingId={}, dismissedUntil={}",
                request.getMappingId(), request.getExpectedDate());
    }

    @Override
    public void updatePredictionSettings(String tenantId, Long mappingId, VisitPredictionSettingsUpdateRequest request) {
        log.info("예측 설정 변경: tenantId={}, mappingId={}, predictionEnabled={}",
                tenantId, mappingId, request.getPredictionEnabled());

        VisitPredictionSettings settings = settingsRepository
                .findByTenantIdAndMappingId(tenantId, mappingId)
                .orElseGet(() -> {
                    VisitPredictionSettings newSettings = VisitPredictionSettings.builder()
                            .mappingId(mappingId)
                            .predictionEnabled(true)
                            .build();
                    newSettings.setTenantId(tenantId);
                    return newSettings;
                });

        settings.setPredictionEnabled(request.getPredictionEnabled());
        settingsRepository.save(settings);
        log.info("예측 설정 변경 완료: mappingId={}, predictionEnabled={}",
                mappingId, request.getPredictionEnabled());
    }

    /**
     * ACTIVE 매핑 목록 조회 (remainingSessions > 0 필터링 포함)
     */
    private List<ConsultantClientMapping> fetchActiveMappings(String tenantId, Long consultantId) {
        List<ConsultantClientMapping> mappings;
        if (consultantId != null) {
            mappings = mappingRepository.findByConsultantIdAndStatus(
                    tenantId, consultantId, MappingStatus.ACTIVE);
        } else {
            mappings = mappingRepository.findActiveMappingsWithDetailsByTenantId(tenantId);
        }
        return mappings.stream()
                .filter(m -> m.getRemainingSessions() != null && m.getRemainingSessions() > 0)
                .collect(Collectors.toList());
    }

    /**
     * 해당 기간에 이미 예약이 있는 (consultantId:clientId) 쌍을 Set으로 반환
     */
    private Set<String> fetchBookedPairs(String tenantId, LocalDate startDate, LocalDate endDate) {
        List<Object[]> pairs = scheduleRepository.findBookedConsultantClientPairsInDateRange(
                tenantId, startDate, endDate, OCCUPYING_STATUSES);
        Set<String> result = new HashSet<>();
        for (Object[] row : pairs) {
            Long cId = (Long) row[0];
            Long clId = (Long) row[1];
            result.add(cId + ":" + clId);
        }
        return result;
    }

    /**
     * 패턴 기반 다음 예상 방문일 계산
     *
     * <p>lastCompletedDate + intervalMedian 후, preferredDayOfWeek로 가장 가까운 날로 보정한다.</p>
     */
    private LocalDate calculateNextExpectedDate(VisitPatternResult pattern) {
        LocalDate rawExpected = pattern.getLastCompletedDate().plusDays(pattern.getIntervalDays());
        DayOfWeek preferredDow = pattern.getPreferredDayOfWeek();

        if (rawExpected.getDayOfWeek() == preferredDow) {
            return rawExpected;
        }

        LocalDate nextPreferred = rawExpected.with(TemporalAdjusters.nextOrSame(preferredDow));
        LocalDate prevPreferred = rawExpected.with(TemporalAdjusters.previousOrSame(preferredDow));

        long daysToNext = Math.abs(rawExpected.until(nextPreferred).getDays());
        long daysToPrev = Math.abs(rawExpected.until(prevPreferred).getDays());

        return daysToNext <= daysToPrev ? nextPreferred : prevPreferred;
    }

    /**
     * intervalDays + preferredDayOfWeek를 결합하여 사용자 표시용 패턴 요약 문자열 생성
     *
     * <p>예: 7일 + TUESDAY → "주1회 화요일", 14일 + THURSDAY → "격주 목요일"</p>
     *
     * @param intervalDays       방문 간격 (일)
     * @param preferredDayOfWeek 선호 요일
     * @return 패턴 요약 문자열
     */
    private String buildPatternSummary(int intervalDays, DayOfWeek preferredDayOfWeek) {
        String dayKorean = VisitPredictionConstants.DAY_OF_WEEK_KOREAN
                .getOrDefault(preferredDayOfWeek, preferredDayOfWeek.name());

        if (intervalDays == VisitPredictionConstants.INTERVAL_WEEKLY) {
            return "주1회 " + dayKorean;
        }
        if (intervalDays == VisitPredictionConstants.INTERVAL_BIWEEKLY) {
            return "격주 " + dayKorean;
        }
        return intervalDays + "일 주기 " + dayKorean;
    }

    /**
     * 내담자명 마스킹 (safeDisplay): 2글자면 첫 글자+*, 3글자 이상이면 첫+마지막 글자만 노출
     */
    private String maskName(String name) {
        if (name == null || name.isEmpty()) {
            return "";
        }
        if (name.length() == 1) {
            return name;
        }
        if (name.length() == 2) {
            return name.charAt(0) + "*";
        }
        StringBuilder masked = new StringBuilder();
        masked.append(name.charAt(0));
        for (int i = 1; i < name.length() - 1; i++) {
            masked.append('*');
        }
        masked.append(name.charAt(name.length() - 1));
        return masked.toString();
    }
}
