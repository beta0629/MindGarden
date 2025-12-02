package com.coresolution.core.controller;

import com.coresolution.core.domain.AiAnomalyDetection;
import com.coresolution.core.domain.SecurityThreatDetection;
import com.coresolution.core.domain.SystemMetric;
import com.coresolution.core.repository.AiAnomalyDetectionRepository;
import com.coresolution.core.repository.SecurityThreatDetectionRepository;
import com.coresolution.core.repository.SystemMetricRepository;
import com.coresolution.core.service.AnomalyDetectionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * AI 모니터링 API 컨트롤러
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-12-02
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/monitoring")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class MonitoringController {
    
    private final SystemMetricRepository systemMetricRepository;
    private final AiAnomalyDetectionRepository anomalyDetectionRepository;
    private final SecurityThreatDetectionRepository threatDetectionRepository;
    private final AnomalyDetectionService anomalyDetectionService;
    
    /**
     * 시스템 메트릭 조회
     */
    @GetMapping("/metrics")
    public ResponseEntity<Map<String, Object>> getSystemMetrics(
        @RequestParam(required = false) String metricType,
        @RequestParam(defaultValue = "60") int minutes
    ) {
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
}

