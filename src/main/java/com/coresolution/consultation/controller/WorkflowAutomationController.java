package com.coresolution.consultation.controller;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import com.coresolution.consultation.service.WorkflowAutomationService;
import com.coresolution.consultation.service.support.ClientPathAccessGuard;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 워크플로우 자동화 관리 컨트롤러.
 *
 * <p>2026-10-05 (#1407·#1408 검증 FAIL 보완): {@code /api/v1/admin/workflow/**} 전 엔드포인트가
 * 인증·권한 검증 없이 열려 있어 내담자·상담사도 리마인더 발송·전체 워크플로 실행을 트리거할 수
 * 있었다. {@code auto-complete-with-reminder} 와 같은 공용 가드
 * ({@link ClientPathAccessGuard#requireTenantManager})를 모든 엔드포인트에 적용한다.</p>
 *
 * @author MindGarden
 * @version 1.1.0
 * @since 2025-01-15
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/admin/workflow") // 표준화 2025-12-05: 레거시 경로 제거
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class WorkflowAutomationController {
    
    private final WorkflowAutomationService workflowAutomationService;
    private final ClientPathAccessGuard clientPathAccessGuard;

    /**
     * 같은 테넌트 관리자·사무원만 허용하고 테넌트 범위를 확정한다 (미인증 401, 그 외 403).
     *
     * @param session HTTP 세션
     * @return 호출자 테넌트 ID (수동 실행은 이 테넌트만 처리한다)
     */
    private String requireTenantManager(HttpSession session) {
        return clientPathAccessGuard.requireCallerTenantId(clientPathAccessGuard.requireTenantManager(session));
    }
    
    /**
     * 워크플로우 실행 상태 조회
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getWorkflowStatus(HttpSession session) {
        requireTenantManager(session);
        log.info("📊 워크플로우 실행 상태 조회");
        try {
            Map<String, Object> status = workflowAutomationService.getWorkflowStatus();
            return ResponseEntity.ok(status);
        } catch (Exception e) {
            log.error("❌ 워크플로우 상태 조회 실패", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * 워크플로우 실행 로그 조회
     */
    @GetMapping("/logs")
    public ResponseEntity<List<Map<String, Object>>> getWorkflowLogs(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            HttpSession session) {

        requireTenantManager(session);
        log.info("📋 워크플로우 실행 로그 조회: startDate={}, endDate={}", startDate, endDate);
        
        try {
            LocalDateTime start = startDate != null ? 
                LocalDateTime.parse(startDate) : LocalDateTime.now().minusDays(7);
            LocalDateTime end = endDate != null ? 
                LocalDateTime.parse(endDate) : LocalDateTime.now();
            
            List<Map<String, Object>> logs = workflowAutomationService.getWorkflowExecutionLogs(start, end);
            return ResponseEntity.ok(logs);
        } catch (Exception e) {
            log.error("❌ 워크플로우 로그 조회 실패", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * 예약 리마인더 수동 실행
     */
    @PostMapping("/reminders/send")
    public ResponseEntity<Map<String, Object>> sendReminders(HttpSession session) {
        String tenantId = requireTenantManager(session);
        log.info("🔔 예약 리마인더 수동 실행");
        try {
            workflowAutomationService.sendScheduleRemindersForTenant(tenantId);
            
            Map<String, Object> response = Map.of(
                "status", "success",
                "message", "예약 리마인더 발송 완료",
                "timestamp", LocalDateTime.now()
            );
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("❌ 예약 리마인더 발송 실패", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * 미완료 상담 알림 수동 실행
     */
    @PostMapping("/alerts/send")
    public ResponseEntity<Map<String, Object>> sendIncompleteAlerts(HttpSession session) {
        String tenantId = requireTenantManager(session);
        log.info("⚠️ 미완료 상담 알림 수동 실행");
        try {
            workflowAutomationService.sendIncompleteConsultationAlertsForTenant(tenantId);
            
            Map<String, Object> response = Map.of(
                "status", "success",
                "message", "미완료 상담 알림 발송 완료",
                "timestamp", LocalDateTime.now()
            );
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("❌ 미완료 상담 알림 발송 실패", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * 일일 성과 요약 수동 실행
     */
    @PostMapping("/summary/daily")
    public ResponseEntity<Map<String, Object>> sendDailySummary(HttpSession session) {
        String tenantId = requireTenantManager(session);
        log.info("📊 일일 성과 요약 수동 실행");
        try {
            workflowAutomationService.sendDailyPerformanceSummaryForTenant(tenantId);
            
            Map<String, Object> response = Map.of(
                "status", "success",
                "message", "일일 성과 요약 발송 완료",
                "timestamp", LocalDateTime.now()
            );
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("❌ 일일 성과 요약 발송 실패", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * 월간 성과 리포트 수동 실행
     */
    @PostMapping("/report/monthly")
    public ResponseEntity<Map<String, Object>> generateMonthlyReport(HttpSession session) {
        String tenantId = requireTenantManager(session);
        log.info("📈 월간 성과 리포트 수동 실행");
        try {
            workflowAutomationService.generateMonthlyPerformanceReportForTenant(tenantId);
            
            Map<String, Object> response = Map.of(
                "status", "success",
                "message", "월간 성과 리포트 생성 완료",
                "timestamp", LocalDateTime.now()
            );
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("❌ 월간 성과 리포트 생성 실패", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * 모든 워크플로우 수동 실행
     */
    @PostMapping("/execute-all")
    public ResponseEntity<Map<String, Object>> executeAllWorkflows(HttpSession session) {
        String tenantId = requireTenantManager(session);
        log.info("🔄 모든 워크플로우 수동 실행");
        try {
            workflowAutomationService.sendScheduleRemindersForTenant(tenantId);
            workflowAutomationService.sendIncompleteConsultationAlertsForTenant(tenantId);
            workflowAutomationService.sendDailyPerformanceSummaryForTenant(tenantId);
            
            Map<String, Object> response = Map.of(
                "status", "success",
                "message", "모든 워크플로우 실행 완료",
                "timestamp", LocalDateTime.now(),
                "executedWorkflows", List.of(
                    "sendScheduleReminders",
                    "sendIncompleteConsultationAlerts", 
                    "sendDailyPerformanceSummary"
                )
            );
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("❌ 워크플로우 전체 실행 실패", e);
            return ResponseEntity.internalServerError().build();
        }
    }
}
