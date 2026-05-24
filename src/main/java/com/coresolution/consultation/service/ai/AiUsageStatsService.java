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
import org.springframework.data.domain.PageImpl;
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
 * <h3>Provider 라벨 추정 규칙</h3>
 * <p>현재 {@link AiUsageLog} 엔티티는 {@code aiProvider} 컬럼이 없으므로 (트랙 B PR-2 보존),
 * {@code model} 컬럼의 prefix 로 provider 라벨을 추정한다.</p>
 * <ul>
 *   <li>{@code gpt-*} / {@code o1-*} / {@code text-*} → {@code OPENAI}</li>
 *   <li>{@code gemini-*} → {@code GEMINI}</li>
 *   <li>{@code claude-*} → {@code CLAUDE}</li>
 *   <li>{@code stability-*} / {@code black-forest-*} / {@code meta/} → {@code REPLICATE}</li>
 *   <li>그 외 / null → {@code UNKNOWN}</li>
 * </ul>
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

    /**
     * 테넌트의 AI 사용 통계를 집계한다.
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
        long successThisMonth = usageLogRepository.countSuccessByTenantAndPeriod(tenantId, startOfMonth, startOfNextMonth);
        Long tokensThisMonth = usageLogRepository.sumTokensByTenantAndPeriod(tenantId, startOfMonth, startOfNextMonth);
        Double avgDurationThisMonth = usageLogRepository.averageDurationByTenantAndPeriod(tenantId, startOfMonth, startOfNextMonth);

        List<Object[]> callerRows = usageLogRepository.countByCallerInPeriod(tenantId, startOfMonth, startOfNextMonth);
        Map<String, Long> callsByCaller = new LinkedHashMap<>();
        for (Object[] row : callerRows) {
            String caller = row[0] != null ? row[0].toString() : "unknown";
            long count = toLong(row[1]);
            callsByCaller.put(caller, count);
        }

        List<Object[]> modelRows = usageLogRepository.countByModelInPeriod(tenantId, startOfMonth, startOfNextMonth);
        Map<String, Long> callsByProvider = new LinkedHashMap<>();
        KNOWN_PROVIDERS.forEach(p -> callsByProvider.put(p, 0L));
        callsByProvider.put(PROVIDER_UNKNOWN, 0L);
        for (Object[] row : modelRows) {
            String model = row[0] != null ? row[0].toString() : null;
            long count = toLong(row[1]);
            String provider = inferProviderFromModel(model);
            callsByProvider.merge(provider, count, Long::sum);
        }

        double successRate = 0.0;
        double failureRate = 0.0;
        if (callsThisMonth > 0) {
            successRate = (successThisMonth * 100.0) / callsThisMonth;
            failureRate = 100.0 - successRate;
        }

        long averageDurationMs = avgDurationThisMonth != null ? Math.round(avgDurationThisMonth) : 0L;
        long totalTokens = tokensThisMonth != null ? tokensThisMonth : 0L;

        List<AiUsageStatsResponse.DailyCount> dailyCalls30d = buildDailyCalls(tenantId, today);

        return AiUsageStatsResponse.builder()
                .tenantId(tenantId)
                .period(period != null ? period : "month")
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
     * 테넌트의 AI 사용 로그를 페이징 조회한다.
     *
     * <p>provider 필터는 model prefix 기반이라 SQL 수준 필터링이 어려워 결과 후처리로 적용한다.</p>
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
        Page<AiUsageLog> page = usageLogRepository.findPageByTenantWithFilters(tenantId, callerFilter, isSuccess, pageable);

        String providerFilter = StringUtils.hasText(provider) ? provider.trim().toUpperCase(Locale.ROOT) : null;

        List<AiUsageLogResponse> mapped = new ArrayList<>(page.getContent().size());
        for (AiUsageLog entity : page.getContent()) {
            String inferred = inferProviderFromModel(entity.getModel());
            if (providerFilter != null && !providerFilter.equals(inferred)) {
                continue;
            }
            mapped.add(AiUsageLogResponse.fromEntity(entity, inferred));
        }
        // provider 필터가 적용된 경우 totalElements 는 근사값(현재 페이지 기준)이 됨.
        // 정확한 totalElements 가 필요하면 entity 에 aiProvider 컬럼 추가가 우선되어야 한다.
        long totalElements = providerFilter == null ? page.getTotalElements() : mapped.size();
        return new PageImpl<>(mapped, pageable, totalElements);
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
                .map(entity -> AiUsageLogDetailResponse.fromEntity(entity, inferProviderFromModel(entity.getModel())));
    }

    /**
     * model 문자열에서 provider 라벨을 추정한다.
     *
     * @param model 모델 명 (nullable)
     * @return provider 라벨 (대문자). 미식별 시 {@code UNKNOWN}.
     */
    public static String inferProviderFromModel(String model) {
        if (model == null || model.isBlank()) {
            return PROVIDER_UNKNOWN;
        }
        String m = model.trim().toLowerCase(Locale.ROOT);
        if (m.startsWith("gpt-") || m.startsWith("o1-") || m.startsWith("text-") || m.startsWith("openai")) {
            return PROVIDER_OPENAI;
        }
        if (m.startsWith("gemini")) {
            return PROVIDER_GEMINI;
        }
        if (m.startsWith("claude")) {
            return PROVIDER_CLAUDE;
        }
        if (m.startsWith("stability") || m.startsWith("black-forest") || m.startsWith("meta/")
                || m.startsWith("flux") || m.contains("/")) {
            return PROVIDER_REPLICATE;
        }
        return PROVIDER_UNKNOWN;
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
