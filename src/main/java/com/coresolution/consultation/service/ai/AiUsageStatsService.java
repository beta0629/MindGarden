package com.coresolution.consultation.service.ai;

import com.coresolution.consultation.entity.AiUsageLog;
import com.coresolution.consultation.repository.AiUsageLogRepository;
import com.coresolution.consultation.service.ai.dto.AiUsageLogDetailResponse;
import com.coresolution.consultation.service.ai.dto.AiUsageLogResponse;
import com.coresolution.consultation.service.ai.dto.AiUsageStatsResponse;
import java.sql.Date;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.YearMonth;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * 어드민 AI 프로바이더 관리 페이지 — 통계·로그 조회 서비스.
 *
 * <p>트랙 B PR-4 (2026-05-24): {@code AiUsageController} 의 비즈니스 로직 담당.
 * 멀티테넌트 격리 — 모든 메서드는 tenantId 필수.</p>
 *
 * <h3>Provider 라벨 (N3 보강, 2026-05-25)</h3>
 * <p>이전에는 {@code model} prefix 로 추정 ({@code inferProviderFromModel}) 했으나 결함 N3
 * (default 'OPENAI' 고정으로 인한 통계 왜곡) 의 본질은 caller 가 {@code effectiveProvider} 를
 * set 하지 않은 점이었다. V20260529_001 에서 caller 정합화 + DB default 제거 + 컬럼 직접 사용
 * 으로 전환했다. provider 집계 / 필터는 모두 {@link AiUsageLog#getAiProvider()} 를 사용한다.</p>
 *
 * @author CoreSolution
 * @since 2026-05-24
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AiUsageStatsService {

    private static final int DAILY_CHART_DAYS = 30;
    private static final String PROVIDER_OPENAI = "OPENAI";
    private static final String PROVIDER_GEMINI = "GEMINI";
    private static final String PROVIDER_CLAUDE = "CLAUDE";
    private static final String PROVIDER_REPLICATE = "REPLICATE";
    private static final String PROVIDER_UNKNOWN = "UNKNOWN";
    private static final List<String> KNOWN_PROVIDERS = List.of(
            PROVIDER_OPENAI, PROVIDER_GEMINI, PROVIDER_CLAUDE, PROVIDER_REPLICATE
    );

    private final AiUsageLogRepository usageLogRepository;

    /** period 미지정 시 기본 echo 라벨. */
    private static final String DEFAULT_PERIOD_LABEL = "month";

    /**
     * 테넌트의 AI 사용 통계를 집계한다.
     *
     * <p>callsToday / callsThisWeek / callsThisMonth 는 period 와 무관하게 항상 반환한다.
     * successRate / failureRate / averageDurationMs / totalTokens / callsByCaller / callsByProvider
     * 는 요청 period(today|week|month) 구간에 맞춰 집계한다.</p>
     *
     * @param tenantId 테넌트 ID (필수)
     * @param period   요청 기간 라벨 (today | week | month — 응답에 echo). null 허용.
     * @return 통계 DTO
     */
    public AiUsageStatsResponse getUsageStats(String tenantId, String period) {
        requireTenantId(tenantId);

        LocalDate today = LocalDate.now();
        LocalDateTime startOfToday = today.atStartOfDay();
        LocalDateTime startOfTomorrow = today.plusDays(1).atStartOfDay();
        LocalDateTime startOfWeek = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)).atStartOfDay();
        LocalDateTime startOfMonth = YearMonth.from(today).atDay(1).atStartOfDay();
        LocalDateTime startOfNextMonth = YearMonth.from(today).plusMonths(1).atDay(1).atStartOfDay();

        long callsToday = usageLogRepository.countByTenantAndPeriod(tenantId, startOfToday, startOfTomorrow);
        long callsThisWeek = usageLogRepository.countByTenantAndPeriod(tenantId, startOfWeek, startOfTomorrow);
        long callsThisMonth = usageLogRepository.countByTenantAndPeriod(tenantId, startOfMonth, startOfNextMonth);

        String echoLabel = resolvePeriodLabel(period);
        LocalDateTime metricsStart;
        LocalDateTime metricsEnd;
        long callsInPeriod;
        switch (echoLabel) {
            case "today" -> {
                metricsStart = startOfToday;
                metricsEnd = startOfTomorrow;
                callsInPeriod = callsToday;
            }
            case "week" -> {
                metricsStart = startOfWeek;
                metricsEnd = startOfTomorrow;
                callsInPeriod = callsThisWeek;
            }
            default -> {
                metricsStart = startOfMonth;
                metricsEnd = startOfNextMonth;
                callsInPeriod = callsThisMonth;
            }
        }

        long successInPeriod = usageLogRepository.countSuccessByTenantAndPeriod(
                tenantId, metricsStart, metricsEnd);
        Long tokensInPeriod = usageLogRepository.sumTokensByTenantAndPeriod(
                tenantId, metricsStart, metricsEnd);
        Double avgDurationInPeriod = usageLogRepository.averageDurationByTenantAndPeriod(
                tenantId, metricsStart, metricsEnd);

        List<Object[]> callerRows = usageLogRepository.countByCallerInPeriod(
                tenantId, metricsStart, metricsEnd);
        Map<String, Long> callsByCaller = new LinkedHashMap<>();
        for (Object[] row : callerRows) {
            String caller = row[0] != null ? row[0].toString() : "unknown";
            long count = toLong(row[1]);
            callsByCaller.put(caller, count);
        }

        List<Object[]> providerRows = usageLogRepository.countByProviderInPeriod(
                tenantId, metricsStart, metricsEnd);
        Map<String, Long> callsByProvider = new LinkedHashMap<>();
        KNOWN_PROVIDERS.forEach(p -> callsByProvider.put(p, 0L));
        callsByProvider.put(PROVIDER_UNKNOWN, 0L);
        for (Object[] row : providerRows) {
            String providerLabel = normalizeProviderLabel(row[0]);
            long count = toLong(row[1]);
            callsByProvider.merge(providerLabel, count, Long::sum);
        }

        double successRate = 0.0;
        double failureRate = 0.0;
        if (callsInPeriod > 0) {
            successRate = (successInPeriod * 100.0) / callsInPeriod;
            failureRate = 100.0 - successRate;
        }

        long averageDurationMs = avgDurationInPeriod != null ? Math.round(avgDurationInPeriod) : 0L;
        long totalTokens = tokensInPeriod != null ? tokensInPeriod : 0L;

        List<AiUsageStatsResponse.DailyCount> dailyCalls30d = buildDailyCalls(tenantId, today);

        return AiUsageStatsResponse.builder()
                .tenantId(tenantId)
                // period 는 deprecated alias — 신규 클라이언트는 requestedPeriod 사용
                .period(echoLabel)
                .requestedPeriod(echoLabel)
                .callsToday(callsToday)
                .callsThisWeek(callsThisWeek)
                .callsThisMonth(callsThisMonth)
                .callsByProvider(callsByProvider)
                .callsByCaller(callsByCaller)
                .successRate(round2(successRate))
                .failureRate(round2(failureRate))
                // 트랙 A 회전 풀 fallback 추적은 별도 P1 핫픽스에서 추가. 현재 미지원 — -1 신호.
                .fallbackUsageRate(-1.0)
                .averageDurationMs(averageDurationMs)
                .totalTokens(totalTokens)
                .dailyCalls30d(dailyCalls30d)
                .build();
    }

    /**
     * period 라벨 정규화. blank/미지원 → month.
     */
    private static String resolvePeriodLabel(String period) {
        if (period == null || period.isBlank()) {
            return DEFAULT_PERIOD_LABEL;
        }
        String normalized = period.trim().toLowerCase(Locale.ROOT);
        return switch (normalized) {
            case "today", "week", "month" -> normalized;
            default -> DEFAULT_PERIOD_LABEL;
        };
    }

    /**
     * 테넌트의 AI 사용 로그를 페이징 조회한다.
     *
     * <p>2026-05-25 N3 보강 (V20260529_001): provider 필터는 {@code ai_provider} 컬럼 직접 매칭으로
     * SQL 수준에서 적용되어 {@code totalElements} 가 정확하다.</p>
     *
     * @param tenantId 테넌트 ID
     * @param provider provider 라벨 (대소문자 무관, 예: openai). null/blank 미지정.
     * @param caller   caller (requestType). null/blank 미지정.
     * @param status   "success" | "failed". null/blank 미지정.
     * @param pageable 페이지 설정
     * @return 페이지 응답
     */
    public Page<AiUsageLogResponse> getUsageLogs(
            String tenantId,
            String provider,
            String caller,
            String status,
            Pageable pageable
    ) {
        requireTenantId(tenantId);

        Boolean isSuccess = null;
        if (StringUtils.hasText(status)) {
            String normalized = status.trim().toLowerCase(Locale.ROOT);
            if ("success".equals(normalized)) {
                isSuccess = Boolean.TRUE;
            } else if ("failed".equals(normalized) || "failure".equals(normalized)) {
                isSuccess = Boolean.FALSE;
            }
        }

        String callerFilter = StringUtils.hasText(caller) ? caller.trim() : null;
        String providerFilter = StringUtils.hasText(provider) ? provider.trim().toUpperCase(Locale.ROOT) : null;

        Page<AiUsageLog> page = usageLogRepository.findPageByTenantWithFilters(
                tenantId, providerFilter, callerFilter, isSuccess, pageable);
        return page.map(AiUsageLogResponse::fromEntity);
    }

    /**
     * 단일 로그 상세 조회.
     */
    public Optional<AiUsageLogDetailResponse> getLogDetail(String tenantId, Long id) {
        requireTenantId(tenantId);
        if (id == null) {
            return Optional.empty();
        }
        return usageLogRepository.findById(id)
                .filter(entity -> tenantId.equals(entity.getTenantId()))
                .map(AiUsageLogDetailResponse::fromEntity);
    }

    /**
     * GROUP BY 결과 row 의 provider 컬럼 값을 정규화한다. null/blank 는 {@code UNKNOWN}.
     */
    private static String normalizeProviderLabel(Object raw) {
        if (raw == null) {
            return PROVIDER_UNKNOWN;
        }
        String text = raw.toString();
        if (text.isBlank()) {
            return PROVIDER_UNKNOWN;
        }
        return text.trim().toUpperCase(Locale.ROOT);
    }

    private List<AiUsageStatsResponse.DailyCount> buildDailyCalls(String tenantId, LocalDate today) {
        LocalDate start = today.minusDays(DAILY_CHART_DAYS - 1L);
        LocalDateTime startTs = start.atStartOfDay();
        LocalDateTime endTs = today.plusDays(1).atStartOfDay();
        List<Object[]> rows = usageLogRepository.countDailyByTenantAndPeriod(tenantId, startTs, endTs);

        Map<LocalDate, Long> countByDate = new LinkedHashMap<>();
        for (Object[] row : rows) {
            LocalDate date = extractDate(row[0]);
            if (date == null) {
                continue;
            }
            countByDate.put(date, toLong(row[1]));
        }

        List<AiUsageStatsResponse.DailyCount> result = new ArrayList<>(DAILY_CHART_DAYS);
        for (int i = 0; i < DAILY_CHART_DAYS; i++) {
            LocalDate d = start.plusDays(i);
            result.add(AiUsageStatsResponse.DailyCount.builder()
                    .date(d)
                    .count(countByDate.getOrDefault(d, 0L))
                    .build());
        }
        return result;
    }

    private static LocalDate extractDate(Object raw) {
        if (raw == null) {
            return null;
        }
        if (raw instanceof LocalDate ld) {
            return ld;
        }
        if (raw instanceof Date sqlDate) {
            return sqlDate.toLocalDate();
        }
        if (raw instanceof LocalDateTime ldt) {
            return ldt.toLocalDate();
        }
        if (raw instanceof java.util.Date jud) {
            return jud.toInstant().atZone(java.time.ZoneId.systemDefault()).toLocalDate();
        }
        if (raw instanceof LocalTime) {
            return null;
        }
        return LocalDate.parse(raw.toString());
    }

    private static long toLong(Object raw) {
        if (raw == null) {
            return 0L;
        }
        if (raw instanceof Number n) {
            return n.longValue();
        }
        try {
            return Long.parseLong(raw.toString());
        } catch (NumberFormatException e) {
            return 0L;
        }
    }

    private static double round2(double v) {
        return Math.round(v * 100.0) / 100.0;
    }

    private static void requireTenantId(String tenantId) {
        if (tenantId == null || tenantId.isBlank()) {
            throw new IllegalArgumentException("tenantId 는 필수입니다 (멀티테넌트 격리).");
        }
    }
}
