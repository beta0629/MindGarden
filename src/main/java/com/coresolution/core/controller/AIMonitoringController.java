package com.coresolution.core.controller;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.coresolution.consultation.repository.AiUsageLogRepository;
import com.coresolution.core.constant.OpsTenantConstants;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.domain.AiAnomalyDetection;
import com.coresolution.core.domain.SecurityThreatDetection;
import com.coresolution.core.dto.ApiResponse;
import com.coresolution.core.repository.AiAnomalyDetectionRepository;
import com.coresolution.core.repository.SecurityThreatDetectionRepository;
import com.coresolution.core.util.LogSanitizer;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * AI 모니터링 API 컨트롤러 — Ops Portal 전용 (본사 운영팀).
 * 테넌트별 AI 이상 탐지 및 보안 위협 모니터링 데이터 제공.
 *
 * <h3>권한 가드 — 옵션 3+1 하이브리드 (Defense in Depth)</h3>
 * <ol>
 *   <li>클래스 레벨 {@code @PreAuthorize("hasRole('OPS')")} — Ops Portal 운영자만 호출 가능
 *       ({@code SecurityRoleConstants.ROLE_OPS} Authority).</li>
 *   <li>메서드별 진입부 {@link OpsTenantConstants#isHqTenant(String)} 자체 검증 —
 *       외부 테넌트가 어떤 경로로든 컨텍스트를 위조해 진입해도 차단.</li>
 * </ol>
 *
 * <p>표준 정합:
 * {@code docs/standards/ROLE_STANDARD.md} §3.2 (테넌트 가드 병행 패턴) +
 * {@code docs/project-management/OPS_PORTAL_MIGRATION_PLAN.md} §4.3, §5 (Phase 2 — 옵션 3+1).
 * 레거시 {@code @PreAuthorize("hasAnyRole('ADMIN', 'HQ_MASTER')")} 매핑은 본 Phase 2 에서
 * {@code OPS} + HQ 테넌트 가드로 전환 — 외부 테넌트 ADMIN 의 본사 모니터링 호출 가능성
 * (Defense in Depth 위반) 차단.</p>
 *
 * @author CoreSolution
 * @since 2025-12-02
 */
@Slf4j
@RestController
@RequestMapping({"/api/v1/monitoring", "/api/monitoring"})
@RequiredArgsConstructor
@PreAuthorize("hasRole('OPS')")
public class AIMonitoringController {

    private static final String HQ_GUARD_DENY_MESSAGE =
        "AI 모니터링은 본사(Ops) 테넌트만 호출 가능 — 외부 테넌트 차단";

    private final AiAnomalyDetectionRepository anomalyDetectionRepository;
    private final SecurityThreatDetectionRepository threatDetectionRepository;
    private final AiUsageLogRepository usageLogRepository;
    private final OpsTenantConstants opsTenantConstants;
    
    /**
     * 최근 이상 탐지 목록 조회 (테넌트별)
     * 
     * @param tenantId 테넌트 ID (선택)
     * @param limit 조회 개수 (기본 10개)
     * @return 최근 이상 탐지 목록
     */
    @GetMapping("/anomaly-detection/recent")
    public ResponseEntity<ApiResponse<List<AiAnomalyDetection>>> getRecentAnomalies(
            @RequestParam(required = false) String tenantId,
            @RequestParam(defaultValue = "10") int limit
    ) {
        assertHqTenant();
        try {
            String targetTenantId = tenantId != null ? tenantId : TenantContextHolder.getTenantId();
            
            log.info("최근 이상 탐지 조회: tenantId={}, limit={}", targetTenantId, limit);
            
            LocalDateTime since = LocalDateTime.now().minusHours(24); // 최근 24시간
            
            List<AiAnomalyDetection> anomalies;
            if (targetTenantId != null) {
                // 테넌트별 조회
                anomalies = anomalyDetectionRepository
                    .findByTenantIdAndDetectedAtAfterOrderByDetectedAtDesc(
                        targetTenantId, since
                    );
            } else {
                // 전체 조회 (시스템 관리자)
                anomalies = anomalyDetectionRepository
                    .findByDetectedAtAfterOrderByDetectedAtDesc(since);
            }
            
            // limit 적용
            if (anomalies.size() > limit) {
                anomalies = anomalies.subList(0, limit);
            }
            
            return ResponseEntity.ok(ApiResponse.success(anomalies));
            
        } catch (Exception e) {
            log.error("최근 이상 탐지 조회 실패", e);
            return ResponseEntity.ok(ApiResponse.error("최근 이상 탐지 조회 실패: " + e.getMessage()));
        }
    }
    
    /**
     * 최근 보안 위협 목록 조회 (테넌트별)
     * 
     * @param tenantId 테넌트 ID (선택)
     * @param limit 조회 개수 (기본 10개)
     * @return 최근 보안 위협 목록
     */
    @GetMapping("/security-threats/recent")
    public ResponseEntity<ApiResponse<List<SecurityThreatDetection>>> getRecentThreats(
            @RequestParam(required = false) String tenantId,
            @RequestParam(defaultValue = "10") int limit
    ) {
        assertHqTenant();
        try {
            String targetTenantId = tenantId != null ? tenantId : TenantContextHolder.getTenantId();
            
            log.info("최근 보안 위협 조회: tenantId={}, limit={}", targetTenantId, limit);
            
            LocalDateTime since = LocalDateTime.now().minusHours(24); // 최근 24시간
            
            List<SecurityThreatDetection> threats;
            if (targetTenantId != null) {
                // 테넌트별 조회
                threats = threatDetectionRepository
                    .findByTenantIdAndDetectedAtAfterOrderByDetectedAtDesc(
                        targetTenantId, since
                    );
            } else {
                // 전체 조회 (시스템 관리자)
                threats = threatDetectionRepository
                    .findByDetectedAtAfterOrderByDetectedAtDesc(since);
            }
            
            // limit 적용
            if (threats.size() > limit) {
                threats = threats.subList(0, limit);
            }
            
            return ResponseEntity.ok(ApiResponse.success(threats));
            
        } catch (Exception e) {
            log.error("최근 보안 위협 조회 실패", e);
            return ResponseEntity.ok(ApiResponse.error("최근 보안 위협 조회 실패: " + e.getMessage()));
        }
    }
    
    /**
     * AI 사용량 요약 조회 (테넌트별)
     * 
     * @param tenantId 테넌트 ID (선택)
     * @return AI 사용량 요약
     */
    @GetMapping("/ai-usage/summary")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAIUsageSummary(
            @RequestParam(required = false) String tenantId
    ) {
        assertHqTenant();
        try {
            String targetTenantId = tenantId != null ? tenantId : TenantContextHolder.getTenantId();
            
            log.info("AI 사용량 요약 조회: tenantId={}", targetTenantId);
            
            LocalDateTime todayStart = LocalDate.now().atStartOfDay();
            LocalDateTime monthStart = LocalDate.now().withDayOfMonth(1).atStartOfDay();
            
            // 오늘 AI 호출 횟수
            long todayCalls = usageLogRepository.countByCreatedAtAfter(todayStart);
            
            // 이번 달 AI 호출 횟수
            long monthCalls = usageLogRepository.countByCreatedAtAfter(monthStart);
            
            // 이번 달 총 비용
            Double monthCost = usageLogRepository.sumEstimatedCostByCreatedAtAfter(monthStart);
            if (monthCost == null) {
                monthCost = 0.0;
            }
            
            // 월 예산 (설정값, 기본 50 USD)
            double monthlyBudget = 50.0;
            double budgetUsage = monthCost / monthlyBudget;
            
            Map<String, Object> summary = new HashMap<>();
            summary.put("todayCalls", todayCalls);
            summary.put("monthCalls", monthCalls);
            summary.put("monthCost", monthCost);
            summary.put("monthlyBudget", monthlyBudget);
            summary.put("monthlyBudgetUsage", budgetUsage);
            
            return ResponseEntity.ok(ApiResponse.success(summary));
            
        } catch (Exception e) {
            log.error("AI 사용량 요약 조회 실패", e);
            return ResponseEntity.ok(ApiResponse.error("AI 사용량 요약 조회 실패: " + e.getMessage()));
        }
    }
    
    /**
     * AI 사용량 상세 조회 (위젯용)
     * 
     * @return AI 사용량 상세
     */
    @GetMapping("/ai-usage/detailed")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAIUsageDetailed() {
        assertHqTenant();
        try {
            log.info("AI 사용량 상세 조회");
            
            LocalDateTime todayStart = LocalDate.now().atStartOfDay();
            LocalDateTime monthStart = LocalDate.now().withDayOfMonth(1).atStartOfDay();
            
            // 오늘 통계
            long todayCalls = usageLogRepository.countByCreatedAtAfter(todayStart);
            Double todayCost = usageLogRepository.sumEstimatedCostByCreatedAtAfter(todayStart);
            if (todayCost == null) todayCost = 0.0;
            
            // 이번 달 통계
            long monthCalls = usageLogRepository.countByCreatedAtAfter(monthStart);
            Double monthCost = usageLogRepository.sumEstimatedCostByCreatedAtAfter(monthStart);
            if (monthCost == null) monthCost = 0.0;
            
            // 타입별 사용 내역
            List<Object[]> usageStats = usageLogRepository.getUsageStatsByType(monthStart, LocalDateTime.now());
            Map<String, Long> usageByType = new HashMap<>();
            for (Object[] stat : usageStats) {
                String type = (String) stat[0];
                Long count = (Long) stat[1];
                usageByType.put(type, count);
            }
            
            // 설정값
            double monthlyBudget = 50.0;
            int dailyLimit = 100;
            
            Map<String, Object> detailed = new HashMap<>();
            detailed.put("todayCalls", todayCalls);
            detailed.put("todayCost", todayCost);
            detailed.put("monthCalls", monthCalls);
            detailed.put("monthCost", monthCost);
            detailed.put("monthlyBudget", monthlyBudget);
            detailed.put("dailyLimit", dailyLimit);
            detailed.put("usageByType", usageByType);
            
            return ResponseEntity.ok(ApiResponse.success(detailed));
            
        } catch (Exception e) {
            log.error("AI 사용량 상세 조회 실패", e);
            return ResponseEntity.ok(ApiResponse.error("AI 사용량 상세 조회 실패: " + e.getMessage()));
        }
    }
    
    /**
     * 이상 탐지 통계 조회 (테넌트별)
     * 
     * @param tenantId 테넌트 ID (선택)
     * @param startDate 시작일 (기본 7일 전)
     * @param endDate 종료일 (기본 오늘)
     * @return 이상 탐지 통계
     */
    @GetMapping("/anomaly-detection/statistics")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAnomalyStatistics(
            @RequestParam(required = false) String tenantId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        assertHqTenant();
        try {
            String targetTenantId = tenantId != null ? tenantId : TenantContextHolder.getTenantId();

            LocalDateTime start = (startDate != null ? startDate : LocalDate.now().minusDays(7)).atStartOfDay();
            LocalDateTime end = (endDate != null ? endDate : LocalDate.now()).atTime(23, 59, 59);

            log.info("이상 탐지 통계 조회: tenantId={}, start={}, end={}", targetTenantId, start, end);
            
            List<AiAnomalyDetection> anomalies;
            if (targetTenantId != null) {
                anomalies = anomalyDetectionRepository
                    .findByTenantIdAndDetectedAtBetween(targetTenantId, start, end);
            } else {
                anomalies = anomalyDetectionRepository
                    .findByDetectedAtBetween(start, end);
            }
            
            // 통계 계산
            long totalCount = anomalies.size();
            long criticalCount = anomalies.stream().filter(a -> "CRITICAL".equals(a.getSeverity())).count();
            long highCount = anomalies.stream().filter(a -> "HIGH".equals(a.getSeverity())).count();
            long mediumCount = anomalies.stream().filter(a -> "MEDIUM".equals(a.getSeverity())).count();
            long lowCount = anomalies.stream().filter(a -> "LOW".equals(a.getSeverity())).count();
            long aiAnalyzedCount = anomalies.stream().filter(a -> "HYBRID_AI".equals(a.getModelUsed())).count();
            
            Map<String, Object> statistics = new HashMap<>();
            statistics.put("totalCount", totalCount);
            statistics.put("criticalCount", criticalCount);
            statistics.put("highCount", highCount);
            statistics.put("mediumCount", mediumCount);
            statistics.put("lowCount", lowCount);
            statistics.put("aiAnalyzedCount", aiAnalyzedCount);
            statistics.put("startDate", start);
            statistics.put("endDate", end);
            
            return ResponseEntity.ok(ApiResponse.success(statistics));
            
        } catch (Exception e) {
            log.error("이상 탐지 통계 조회 실패", e);
            return ResponseEntity.ok(ApiResponse.error("이상 탐지 통계 조회 실패: " + e.getMessage()));
        }
    }
    
    /**
     * 보안 위협 통계 조회 (테넌트별)
     * 
     * @param tenantId 테넌트 ID (선택)
     * @param startDate 시작일 (기본 7일 전)
     * @param endDate 종료일 (기본 오늘)
     * @return 보안 위협 통계
     */
    @GetMapping("/security-threats/statistics")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getThreatStatistics(
            @RequestParam(required = false) String tenantId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        assertHqTenant();
        try {
            String targetTenantId = tenantId != null ? tenantId : TenantContextHolder.getTenantId();

            LocalDateTime start = (startDate != null ? startDate : LocalDate.now().minusDays(7)).atStartOfDay();
            LocalDateTime end = (endDate != null ? endDate : LocalDate.now()).atTime(23, 59, 59);

            log.info("보안 위협 통계 조회: tenantId={}, start={}, end={}", targetTenantId, start, end);
            
            List<SecurityThreatDetection> threats;
            if (targetTenantId != null) {
                threats = threatDetectionRepository
                    .findByTenantIdAndDetectedAtBetween(targetTenantId, start, end);
            } else {
                threats = threatDetectionRepository
                    .findByDetectedAtBetween(start, end);
            }
            
            // 통계 계산
            long totalCount = threats.size();
            long criticalCount = threats.stream().filter(t -> "CRITICAL".equals(t.getSeverity())).count();
            long highCount = threats.stream().filter(t -> "HIGH".equals(t.getSeverity())).count();
            long mediumCount = threats.stream().filter(t -> "MEDIUM".equals(t.getSeverity())).count();
            long lowCount = threats.stream().filter(t -> "LOW".equals(t.getSeverity())).count();
            long blockedCount = threats.stream().filter(t -> Boolean.TRUE.equals(t.getBlocked())).count();
            long aiAnalyzedCount = threats.stream().filter(t -> "HYBRID_AI".equals(t.getModelUsed())).count();
            
            Map<String, Object> statistics = new HashMap<>();
            statistics.put("totalCount", totalCount);
            statistics.put("criticalCount", criticalCount);
            statistics.put("highCount", highCount);
            statistics.put("mediumCount", mediumCount);
            statistics.put("lowCount", lowCount);
            statistics.put("blockedCount", blockedCount);
            statistics.put("aiAnalyzedCount", aiAnalyzedCount);
            statistics.put("startDate", start);
            statistics.put("endDate", end);
            
            return ResponseEntity.ok(ApiResponse.success(statistics));
            
        } catch (Exception e) {
            log.error("보안 위협 통계 조회 실패", e);
            return ResponseEntity.ok(ApiResponse.error("보안 위협 통계 조회 실패: " + e.getMessage()));
        }
    }

    // ------------------------------------------------------------------
    // Internal — HQ 테넌트 가드 (옵션 3+1 하이브리드, Defense in Depth)
    // ------------------------------------------------------------------

    /**
     * 현재 요청 테넌트가 본사(HQ) 인지 검증한다.
     *
     * <p>{@code @PreAuthorize("hasRole('OPS')")} 가 1차 차단 후에도, 외부 테넌트가
     * {@code ROLE_OPS} Authority 를 보유한 채 진입하더라도 본 가드가 차단한다
     * (Ops 권한이 향후 HQ 외 테넌트로 확장될 가능성에 대한 Defense in Depth).</p>
     *
     * @throws AccessDeniedException 본사 테넌트가 아닌 경우
     */
    private void assertHqTenant() {
        String currentTenant = TenantContextHolder.getRequiredTenantId();
        if (!opsTenantConstants.isHqTenant(currentTenant)) {
            log.warn("[OPS] AI 모니터링 외부 테넌트 차단 — currentTenant={} (HQ 가드)",
                LogSanitizer.forLog(currentTenant));
            throw new AccessDeniedException(HQ_GUARD_DENY_MESSAGE);
        }
    }
}

