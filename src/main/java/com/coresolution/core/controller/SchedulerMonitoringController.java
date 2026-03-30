package com.coresolution.core.controller;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.domain.SchedulerExecutionLog;
import com.coresolution.core.dto.ApiResponse;
import com.coresolution.core.repository.SchedulerExecutionLogRepository;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 스케줄러 모니터링 API 컨트롤러
 * 테넌트별 스케줄러 실행 내역 및 통계 제공
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-12-02
 */
@Slf4j
@RestController
@RequestMapping({"/api/v1/scheduler", "/api/scheduler"})
@RequiredArgsConstructor
public class SchedulerMonitoringController {
    
    private final SchedulerExecutionLogRepository executionLogRepository;
    
    /**
     * 최근 스케줄러 실행 내역 조회 (테넌트별)
     * 
     * @param tenantId 테넌트 ID (선택)
     * @param limit 조회 개수 (기본 20개)
     * @return 최근 실행 내역
     */
    @GetMapping("/execution/recent")
    @PreAuthorize("hasAnyRole('ADMIN', 'HQ_MASTER')")
    public ResponseEntity<ApiResponse<List<SchedulerExecutionLog>>> getRecentExecutions(
            @RequestParam(required = false) String tenantId,
            @RequestParam(defaultValue = "20") int limit
    ) {
        try {
            String targetTenantId = tenantId != null ? tenantId : TenantContextHolder.getTenantId();
            
            log.info("최근 스케줄러 실행 내역 조회: tenantId={}, limit={}", targetTenantId, limit);
            
            LocalDateTime since = LocalDateTime.now().minusHours(24); // 최근 24시간
            
            List<SchedulerExecutionLog> executions;
            if (targetTenantId != null) {
                // 테넌트별 조회
                executions = executionLogRepository
                    .findByTenantIdAndStartedAtAfterOrderByStartedAtDesc(
                        targetTenantId, since
                    );
            } else {
                // 전체 조회 (시스템 관리자)
                executions = executionLogRepository
                    .findByStartedAtAfterOrderByStartedAtDesc(since);
            }
            
            // limit 적용
            if (executions.size() > limit) {
                executions = executions.subList(0, limit);
            }
            
            return ResponseEntity.ok(ApiResponse.success(executions));
            
        } catch (Exception e) {
            log.error("최근 스케줄러 실행 내역 조회 실패", e);
            return ResponseEntity.ok(ApiResponse.error("최근 스케줄러 실행 내역 조회 실패: " + e.getMessage()));
        }
    }
    
    /**
     * 스케줄러 실행 요약 통계 (테넌트별)
     * 
     * @param tenantId 테넌트 ID (선택)
     * @return 실행 요약 통계
     */
    @GetMapping("/execution/summary")
    @PreAuthorize("hasAnyRole('ADMIN', 'HQ_MASTER')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getExecutionSummary(
            @RequestParam(required = false) String tenantId
    ) {
        try {
            String targetTenantId = tenantId != null ? tenantId : TenantContextHolder.getTenantId();
            
            log.info("스케줄러 실행 요약 조회: tenantId={}", targetTenantId);
            
            LocalDateTime todayStart = LocalDate.now().atStartOfDay();
            
            List<SchedulerExecutionLog> todayExecutions;
            if (targetTenantId != null) {
                todayExecutions = executionLogRepository
                    .findByTenantIdAndStartedAtAfter(targetTenantId, todayStart);
            } else {
                todayExecutions = executionLogRepository
                    .findByStartedAtAfterOrderByStartedAtDesc(todayStart);
            }
            
            // 통계 계산
            long totalExecutions = todayExecutions.size();
            long successCount = todayExecutions.stream()
                .filter(e -> "SUCCESS".equals(e.getStatus()))
                .count();
            long failureCount = todayExecutions.stream()
                .filter(e -> "FAILED".equals(e.getStatus()))
                .count();
            long runningCount = todayExecutions.stream()
                .filter(e -> "RUNNING".equals(e.getStatus()))
                .count();
            
            // 평균 실행 시간
            double avgDuration = todayExecutions.stream()
                .filter(e -> e.getDurationMs() != null)
                .mapToLong(SchedulerExecutionLog::getDurationMs)
                .average()
                .orElse(0.0);
            
            Map<String, Object> summary = new HashMap<>();
            summary.put("totalExecutions", totalExecutions);
            summary.put("successCount", successCount);
            summary.put("failureCount", failureCount);
            summary.put("runningCount", runningCount);
            summary.put("avgDuration", Math.round(avgDuration));
            
            return ResponseEntity.ok(ApiResponse.success(summary));
            
        } catch (Exception e) {
            log.error("스케줄러 실행 요약 조회 실패", e);
            return ResponseEntity.ok(ApiResponse.error("스케줄러 실행 요약 조회 실패: " + e.getMessage()));
        }
    }
    
    /**
     * 스케줄러 실행 통계 (테넌트별, 기간별)
     * 
     * @param tenantId 테넌트 ID (선택)
     * @param startDate 시작일 (기본 7일 전)
     * @param endDate 종료일 (기본 오늘)
     * @return 실행 통계
     */
    @GetMapping("/execution/statistics")
    @PreAuthorize("hasAnyRole('ADMIN', 'HQ_MASTER')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getExecutionStatistics(
            @RequestParam(required = false) String tenantId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        try {
            String targetTenantId = tenantId != null ? tenantId : TenantContextHolder.getTenantId();
            
            LocalDateTime start = (startDate != null ? startDate : LocalDate.now().minusDays(7)).atStartOfDay();
            LocalDateTime end = (endDate != null ? endDate : LocalDate.now()).atTime(23, 59, 59);
            
            log.info("스케줄러 실행 통계 조회: tenantId={}, start={}, end={}", targetTenantId, start, end);
            
            List<SchedulerExecutionLog> executions;
            if (targetTenantId != null) {
                executions = executionLogRepository
                    .findByTenantIdAndStartedAtBetween(targetTenantId, start, end);
            } else {
                executions = executionLogRepository
                    .findByStartedAtBetween(start, end);
            }
            
            // 통계 계산
            long totalCount = executions.size();
            long successCount = executions.stream().filter(e -> "SUCCESS".equals(e.getStatus())).count();
            long failureCount = executions.stream().filter(e -> "FAILED".equals(e.getStatus())).count();
            
            // 작업별 통계
            Map<String, Long> jobStats = new HashMap<>();
            executions.forEach(e -> {
                String jobName = e.getJobName();
                jobStats.put(jobName, jobStats.getOrDefault(jobName, 0L) + 1);
            });
            
            // 평균 실행 시간
            double avgDuration = executions.stream()
                .filter(e -> e.getDurationMs() != null)
                .mapToLong(SchedulerExecutionLog::getDurationMs)
                .average()
                .orElse(0.0);
            
            // 가장 느린 실행
            SchedulerExecutionLog slowest = executions.stream()
                .filter(e -> e.getDurationMs() != null)
                .max((e1, e2) -> Long.compare(e1.getDurationMs(), e2.getDurationMs()))
                .orElse(null);
            
            Map<String, Object> statistics = new HashMap<>();
            statistics.put("totalCount", totalCount);
            statistics.put("successCount", successCount);
            statistics.put("failureCount", failureCount);
            statistics.put("successRate", totalCount > 0 ? (double) successCount / totalCount * 100 : 0);
            statistics.put("avgDuration", Math.round(avgDuration));
            statistics.put("jobStats", jobStats);
            statistics.put("slowestExecution", slowest != null ? Map.of(
                "jobName", slowest.getJobName(),
                "duration", slowest.getDurationMs(),
                "executedAt", slowest.getExecutedAt()
            ) : null);
            statistics.put("startDate", start);
            statistics.put("endDate", end);
            
            return ResponseEntity.ok(ApiResponse.success(statistics));
            
        } catch (Exception e) {
            log.error("스케줄러 실행 통계 조회 실패", e);
            return ResponseEntity.ok(ApiResponse.error("스케줄러 실행 통계 조회 실패: " + e.getMessage()));
        }
    }
    
    /**
     * 실패한 스케줄러 실행 내역 조회 (테넌트별)
     * 
     * @param tenantId 테넌트 ID (선택)
     * @param limit 조회 개수 (기본 10개)
     * @return 실패 내역
     */
    @GetMapping("/execution/failures")
    @PreAuthorize("hasAnyRole('ADMIN', 'HQ_MASTER')")
    public ResponseEntity<ApiResponse<List<SchedulerExecutionLog>>> getFailedExecutions(
            @RequestParam(required = false) String tenantId,
            @RequestParam(defaultValue = "10") int limit
    ) {
        try {
            String targetTenantId = tenantId != null ? tenantId : TenantContextHolder.getTenantId();
            
            log.info("실패한 스케줄러 실행 내역 조회: tenantId={}, limit={}", targetTenantId, limit);
            
            List<SchedulerExecutionLog> failures;
            if (targetTenantId != null) {
                failures = executionLogRepository
                    .findByTenantIdAndStatusOrderByStartedAtDesc(targetTenantId, "FAILED");
            } else {
                failures = executionLogRepository
                    .findByStatusOrderByStartedAtDesc("FAILED");
            }
            
            // limit 적용
            if (failures.size() > limit) {
                failures = failures.subList(0, limit);
            }
            
            return ResponseEntity.ok(ApiResponse.success(failures));
            
        } catch (Exception e) {
            log.error("실패한 스케줄러 실행 내역 조회 실패", e);
            return ResponseEntity.ok(ApiResponse.error("실패한 스케줄러 실행 내역 조회 실패: " + e.getMessage()));
        }
    }
}

