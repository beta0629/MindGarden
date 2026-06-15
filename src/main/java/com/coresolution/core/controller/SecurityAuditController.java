package com.coresolution.core.controller;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.coresolution.core.constant.OpsTenantConstants;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.domain.SecurityAuditLog;
import com.coresolution.core.dto.ApiResponse;
import com.coresolution.core.repository.SecurityAuditLogRepository;
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
 * 보안 감사 로그 API 컨트롤러 — Ops Portal 전용 (본사 운영팀).
 * 테넌트별 보안 감사 로그 및 통계 제공.
 *
 * <h3>권한 가드 — 옵션 3+1 하이브리드 (Defense in Depth)</h3>
 * <ol>
 *   <li>클래스 레벨 {@code @PreAuthorize("hasRole('OPS')")} — Ops Portal 운영자만 호출 가능.</li>
 *   <li>메서드별 진입부 {@link OpsTenantConstants#isHqTenant(String)} 자체 검증.</li>
 * </ol>
 *
 * <p>표준 정합:
 * {@code docs/standards/ROLE_STANDARD.md} §3.2 +
 * {@code docs/project-management/OPS_PORTAL_MIGRATION_PLAN.md} §4.4, §5 (Phase 3).</p>
 *
 * @author CoreSolution
 * @since 2025-12-02
 */
@Slf4j
@RestController
@RequestMapping({"/api/v1/security/audit", "/api/security/audit"})
@RequiredArgsConstructor
@PreAuthorize("hasRole('OPS')")
public class SecurityAuditController {

    private static final String HQ_GUARD_DENY_MESSAGE =
        "보안 감사 로그는 본사(Ops) 테넌트만 호출 가능 — 외부 테넌트 차단";

    private final SecurityAuditLogRepository auditLogRepository;
    private final OpsTenantConstants opsTenantConstants;
    
    /**
     * 최근 보안 감사 로그 조회 (테넌트별)
     * 
     * @param tenantId 테넌트 ID (선택)
     * @param limit 조회 개수 (기본 20개)
     * @return 최근 감사 로그
     */
    @GetMapping("/recent")
    public ResponseEntity<ApiResponse<List<SecurityAuditLog>>> getRecentAuditLogs(
            @RequestParam(required = false) String tenantId,
            @RequestParam(defaultValue = "20") int limit
    ) {
        assertHqTenant();
        try {
            String targetTenantId = tenantId != null ? tenantId : TenantContextHolder.getTenantId();
            
            log.info("최근 보안 감사 로그 조회: tenantId={}, limit={}", targetTenantId, limit);
            
            LocalDateTime since = LocalDateTime.now().minusHours(24); // 최근 24시간
            
            List<SecurityAuditLog> audits;
            if (targetTenantId != null) {
                // 테넌트별 조회
                audits = auditLogRepository
                    .findByTenantIdAndCreatedAtAfterOrderByCreatedAtDesc(
                        targetTenantId, since
                    );
            } else {
                // 전체 조회 (시스템 관리자)
                audits = auditLogRepository
                    .findByCreatedAtAfterOrderByCreatedAtDesc(since);
            }
            
            // limit 적용
            if (audits.size() > limit) {
                audits = audits.subList(0, limit);
            }
            
            return ResponseEntity.ok(ApiResponse.success(audits));
            
        } catch (Exception e) {
            log.error("최근 보안 감사 로그 조회 실패", e);
            return ResponseEntity.ok(ApiResponse.error("최근 보안 감사 로그 조회 실패: " + e.getMessage()));
        }
    }
    
    /**
     * 보안 감사 로그 요약 통계 (테넌트별)
     * 
     * @param tenantId 테넌트 ID (선택)
     * @return 요약 통계
     */
    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAuditSummary(
            @RequestParam(required = false) String tenantId
    ) {
        assertHqTenant();
        try {
            String targetTenantId = tenantId != null ? tenantId : TenantContextHolder.getTenantId();
            
            log.info("보안 감사 로그 요약 조회: tenantId={}", targetTenantId);
            
            LocalDateTime todayStart = LocalDate.now().atStartOfDay();
            
            List<SecurityAuditLog> todayAudits;
            if (targetTenantId != null) {
                todayAudits = auditLogRepository
                    .findByTenantIdAndCreatedAtAfter(targetTenantId, todayStart);
            } else {
                todayAudits = auditLogRepository
                    .findByCreatedAtAfterOrderByCreatedAtDesc(todayStart);
            }
            
            // 통계 계산
            long totalEvents = todayAudits.size();
            
            long loginAttempts = todayAudits.stream()
                .filter(a -> "LOGIN_SUCCESS".equals(a.getEventType()) || 
                            "LOGIN_FAILED".equals(a.getEventType()))
                .count();
            
            long failedLogins = todayAudits.stream()
                .filter(a -> "LOGIN_FAILED".equals(a.getEventType()))
                .count();
            
            long suspiciousActivities = todayAudits.stream()
                .filter(a -> "SUSPICIOUS_ACTIVITY".equals(a.getEventType()))
                .count();
            
            long dataModifications = todayAudits.stream()
                .filter(a -> "DATA_MODIFIED".equals(a.getEventType()))
                .count();
            
            long permissionChanges = todayAudits.stream()
                .filter(a -> "PERMISSION_CHANGED".equals(a.getEventType()))
                .count();
            
            Map<String, Object> summary = new HashMap<>();
            summary.put("totalEvents", totalEvents);
            summary.put("loginAttempts", loginAttempts);
            summary.put("failedLogins", failedLogins);
            summary.put("suspiciousActivities", suspiciousActivities);
            summary.put("dataModifications", dataModifications);
            summary.put("permissionChanges", permissionChanges);
            
            return ResponseEntity.ok(ApiResponse.success(summary));
            
        } catch (Exception e) {
            log.error("보안 감사 로그 요약 조회 실패", e);
            return ResponseEntity.ok(ApiResponse.error("보안 감사 로그 요약 조회 실패: " + e.getMessage()));
        }
    }
    
    /**
     * 보안 감사 로그 통계 (테넌트별, 기간별)
     * 
     * @param tenantId 테넌트 ID (선택)
     * @param startDate 시작일 (기본 7일 전)
     * @param endDate 종료일 (기본 오늘)
     * @return 감사 로그 통계
     */
    @GetMapping("/statistics")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAuditStatistics(
            @RequestParam(required = false) String tenantId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        assertHqTenant();
        try {
            String targetTenantId = tenantId != null ? tenantId : TenantContextHolder.getTenantId();
            
            LocalDateTime start = (startDate != null ? startDate : LocalDate.now().minusDays(7)).atStartOfDay();
            LocalDateTime end = (endDate != null ? endDate : LocalDate.now()).atTime(23, 59, 59);
            
            log.info("보안 감사 로그 통계 조회: tenantId={}, start={}, end={}", targetTenantId, start, end);
            
            List<SecurityAuditLog> audits;
            if (targetTenantId != null) {
                audits = auditLogRepository
                    .findByTenantIdAndCreatedAtBetween(targetTenantId, start, end);
            } else {
                audits = auditLogRepository
                    .findByCreatedAtBetween(start, end);
            }
            
            // 통계 계산
            long totalCount = audits.size();
            
            // 이벤트 타입별 통계
            Map<String, Long> eventTypeStats = new HashMap<>();
            audits.forEach(a -> {
                String eventType = a.getEventType();
                eventTypeStats.put(eventType, eventTypeStats.getOrDefault(eventType, 0L) + 1);
            });
            
            // 결과별 통계
            Map<String, Long> resultStats = new HashMap<>();
            audits.forEach(a -> {
                String result = a.getResult();
                if (result != null) {
                    resultStats.put(result, resultStats.getOrDefault(result, 0L) + 1);
                }
            });
            
            // 사용자별 활동 통계
            Map<String, Long> userActivityStats = new HashMap<>();
            audits.forEach(a -> {
                String userEmail = a.getUserEmail();
                if (userEmail != null) {
                    userActivityStats.put(userEmail, userActivityStats.getOrDefault(userEmail, 0L) + 1);
                }
            });
            
            Map<String, Object> statistics = new HashMap<>();
            statistics.put("totalCount", totalCount);
            statistics.put("eventTypeStats", eventTypeStats);
            statistics.put("resultStats", resultStats);
            statistics.put("userActivityStats", userActivityStats);
            statistics.put("startDate", start);
            statistics.put("endDate", end);
            
            return ResponseEntity.ok(ApiResponse.success(statistics));
            
        } catch (Exception e) {
            log.error("보안 감사 로그 통계 조회 실패", e);
            return ResponseEntity.ok(ApiResponse.error("보안 감사 로그 통계 조회 실패: " + e.getMessage()));
        }
    }
    
    /**
     * 이벤트 타입별 감사 로그 조회 (테넌트별)
     * 
     * @param tenantId 테넌트 ID (선택)
     * @param eventType 이벤트 타입
     * @param limit 조회 개수 (기본 10개)
     * @return 이벤트 타입별 감사 로그
     */
    @GetMapping("/by-event-type")
    public ResponseEntity<ApiResponse<List<SecurityAuditLog>>> getAuditLogsByEventType(
            @RequestParam(required = false) String tenantId,
            @RequestParam String eventType,
            @RequestParam(defaultValue = "10") int limit
    ) {
        assertHqTenant();
        try {
            String targetTenantId = tenantId != null ? tenantId : TenantContextHolder.getTenantId();
            
            log.info("이벤트 타입별 보안 감사 로그 조회: tenantId={}, eventType={}, limit={}", 
                targetTenantId, eventType, limit);
            
            List<SecurityAuditLog> audits;
            if (targetTenantId != null) {
                audits = auditLogRepository
                    .findByTenantIdAndEventTypeOrderByCreatedAtDesc(targetTenantId, eventType);
            } else {
                audits = auditLogRepository
                    .findByEventTypeOrderByCreatedAtDesc(eventType);
            }
            
            // limit 적용
            if (audits.size() > limit) {
                audits = audits.subList(0, limit);
            }
            
            return ResponseEntity.ok(ApiResponse.success(audits));
            
        } catch (Exception e) {
            log.error("이벤트 타입별 보안 감사 로그 조회 실패", e);
            return ResponseEntity.ok(ApiResponse.error("이벤트 타입별 보안 감사 로그 조회 실패: " + e.getMessage()));
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
            log.warn("[OPS] 보안 감사 로그 외부 테넌트 차단 — currentTenant={} (HQ 가드)",
                LogSanitizer.forLog(currentTenant));
            throw new AccessDeniedException(HQ_GUARD_DENY_MESSAGE);
        }
    }
}

