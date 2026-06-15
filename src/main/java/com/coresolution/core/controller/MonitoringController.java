package com.coresolution.core.controller;

import com.coresolution.core.constant.OpsTenantConstants;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.domain.AiAnomalyDetection;
import com.coresolution.core.domain.SecurityThreatDetection;
import com.coresolution.core.domain.SystemMetric;
import com.coresolution.core.repository.AiAnomalyDetectionRepository;
import com.coresolution.core.repository.SecurityThreatDetectionRepository;
import com.coresolution.core.repository.SystemMetricRepository;
import com.coresolution.core.service.AnomalyDetectionService;
import com.coresolution.core.util.LogSanitizer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 일반 모니터링 API 컨트롤러 — Ops Portal 전용 (본사 운영팀).
 * 시스템 메트릭·이상 탐지·보안 위협·대시보드 통계 통합 제공.
 *
 * <h3>권한 가드 — 옵션 3+1 하이브리드 (Defense in Depth)</h3>
 * <ol>
 *   <li>클래스 레벨 {@code @PreAuthorize("hasRole('OPS')")} — Ops Portal 운영자만 호출 가능.</li>
 *   <li>메서드별 진입부 {@link OpsTenantConstants#isHqTenant(String)} 자체 검증.</li>
 * </ol>
 *
 * <p>표준 정합:
 * {@code docs/standards/ROLE_STANDARD.md} §3.2 +
 * {@code docs/project-management/OPS_PORTAL_MIGRATION_PLAN.md} §4.3 (Phase 2).
 * 레거시 {@code @PreAuthorize("hasRole('ADMIN')")} 매핑은 본 Phase 2 에서
 * {@code OPS} + HQ 테넌트 가드로 전환된다.</p>
 *
 * @author CoreSolution
 * @since 2025-12-02
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/monitoring")
@RequiredArgsConstructor
@PreAuthorize("hasRole('OPS')")
public class MonitoringController {

    private static final String HQ_GUARD_DENY_MESSAGE =
        "모니터링은 본사(Ops) 테넌트만 호출 가능 — 외부 테넌트 차단";

    private final SystemMetricRepository systemMetricRepository;
    private final AiAnomalyDetectionRepository anomalyDetectionRepository;
    private final SecurityThreatDetectionRepository threatDetectionRepository;
    private final AnomalyDetectionService anomalyDetectionService;
    private final OpsTenantConstants opsTenantConstants;
    
    /**
     * 시스템 메트릭 조회
     */
    @GetMapping("/metrics")
    public ResponseEntity<Map<String, Object>> getSystemMetrics(
        @RequestParam(required = false) String metricType,
        @RequestParam(defaultValue = "60") int minutes
    ) {
        assertHqTenant();
        try {
            LocalDateTime since = LocalDateTime.now().minusMinutes(minutes);
            
            List<SystemMetric> metrics;
            if (metricType != null) {
                metrics = systemMetricRepository
                    .findByMetricTypeAndCollectedAtAfterOrderByCollectedAtDesc(metricType, since);
            } else {
                metrics = systemMetricRepository.findAll();
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("metrics", metrics);
            response.put("count", metrics.size());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("메트릭 조회 실패", e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }
    
    /**
     * 이상 탐지 결과 조회
     */
    @GetMapping("/anomalies")
    public ResponseEntity<Map<String, Object>> getAnomalies(
        @RequestParam(required = false) String severity,
        @RequestParam(defaultValue = "false") boolean resolvedOnly
    ) {
        assertHqTenant();
        try {
            List<AiAnomalyDetection> anomalies;
            
            if (severity != null) {
                anomalies = anomalyDetectionRepository
                    .findBySeverityAndResolvedAtIsNullOrderByDetectedAtDesc(severity);
            } else if (resolvedOnly) {
                LocalDateTime since = LocalDateTime.now().minusDays(7);
                anomalies = anomalyDetectionRepository
                    .findByDetectedAtAfterOrderByDetectedAtDesc(since);
            } else {
                anomalies = anomalyDetectionRepository
                    .findBySeverityAndResolvedAtIsNullOrderByDetectedAtDesc("CRITICAL");
                anomalies.addAll(anomalyDetectionRepository
                    .findBySeverityAndResolvedAtIsNullOrderByDetectedAtDesc("HIGH"));
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("anomalies", anomalies);
            response.put("count", anomalies.size());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("이상 탐지 조회 실패", e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }
    
    /**
     * 이상 해결 처리
     */
    @PostMapping("/anomalies/{anomalyId}/resolve")
    public ResponseEntity<Map<String, Object>> resolveAnomaly(@PathVariable Long anomalyId) {
        assertHqTenant();
        try {
            anomalyDetectionService.resolveAnomaly(anomalyId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "이상이 해결되었습니다.");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("이상 해결 실패", e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }
    
    /**
     * 보안 위협 조회
     */
    @GetMapping("/threats")
    public ResponseEntity<Map<String, Object>> getThreats(
        @RequestParam(required = false) String threatType,
        @RequestParam(defaultValue = "24") int hours
    ) {
        assertHqTenant();
        try {
            LocalDateTime since = LocalDateTime.now().minusHours(hours);
            List<SecurityThreatDetection> threats = threatDetectionRepository
                .findByDetectedAtAfterOrderByDetectedAtDesc(since);
            
            if (threatType != null) {
                threats = threats.stream()
                    .filter(t -> t.getThreatType().equals(threatType))
                    .toList();
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("threats", threats);
            response.put("count", threats.size());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("보안 위협 조회 실패", e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }
    
    /**
     * 대시보드 통계
     */
    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboard() {
        assertHqTenant();
        try {
            LocalDateTime last24Hours = LocalDateTime.now().minusHours(24);
            
            // 미해결 이상 수
            long unresolvedAnomalies = anomalyDetectionRepository
                .findBySeverityAndResolvedAtIsNullOrderByDetectedAtDesc("CRITICAL").size() +
                anomalyDetectionRepository
                .findBySeverityAndResolvedAtIsNullOrderByDetectedAtDesc("HIGH").size();
            
            // 최근 24시간 위협 수
            long recentThreats = threatDetectionRepository
                .findByDetectedAtAfterOrderByDetectedAtDesc(last24Hours).size();
            
            // 차단된 IP 수
            long blockedIps = threatDetectionRepository.findByBlockedTrueOrderByDetectedAtDesc().size();
            
            Map<String, Object> dashboard = new HashMap<>();
            dashboard.put("unresolvedAnomalies", unresolvedAnomalies);
            dashboard.put("recentThreats", recentThreats);
            dashboard.put("blockedIps", blockedIps);
            dashboard.put("systemStatus", unresolvedAnomalies == 0 ? "HEALTHY" : "WARNING");
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("dashboard", dashboard);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("대시보드 조회 실패", e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    // ------------------------------------------------------------------
    // Internal — HQ 테넌트 가드 (옵션 3+1 하이브리드, Defense in Depth)
    // ------------------------------------------------------------------

    /**
     * 현재 요청 테넌트가 본사(HQ) 인지 검증한다.
     *
     * @throws AccessDeniedException 본사 테넌트가 아닌 경우
     */
    private void assertHqTenant() {
        String currentTenant = TenantContextHolder.getRequiredTenantId();
        if (!opsTenantConstants.isHqTenant(currentTenant)) {
            log.warn("[OPS] 모니터링 외부 테넌트 차단 — currentTenant={} (HQ 가드)",
                LogSanitizer.forLog(currentTenant));
            throw new AccessDeniedException(HQ_GUARD_DENY_MESSAGE);
        }
    }
}

