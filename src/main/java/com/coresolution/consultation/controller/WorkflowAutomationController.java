package com.coresolution.consultation.controller;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import com.coresolution.consultation.service.WorkflowAutomationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 워크플로우 자동화 관리 컨트롤러
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-15
 */
@Slf4j
@RestController
@RequestMapping({"/api/v1/admin/workflow", "/api/admin/workflow"}) // v1 경로 추가, 레거시 경로 유지
@RequiredArgsConstructor
public class WorkflowAutomationController {
    
    private final WorkflowAutomationService workflowAutomationService;
    
    /**
     * 워크플로우 실행 상태 조회
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getWorkflowStatus() {
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
            @RequestParam(required = false) String endDate) {
        
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
    public ResponseEntity<Map<String, Object>> sendReminders() {
        log.info("🔔 예약 리마인더 수동 실행");
        try {
            workflowAutomationService.sendScheduleReminders();
            
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
    public ResponseEntity<Map<String, Object>> sendIncompleteAlerts() {
        log.info("⚠️ 미완료 상담 알림 수동 실행");
        try {
            workflowAutomationService.sendIncompleteConsultationAlerts();
            
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
    public ResponseEntity<Map<String, Object>> sendDailySummary() {
        log.info("📊 일일 성과 요약 수동 실행");
        try {
            workflowAutomationService.sendDailyPerformanceSummary();
            
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
    public ResponseEntity<Map<String, Object>> generateMonthlyReport() {
        log.info("📈 월간 성과 리포트 수동 실행");
        try {
            workflowAutomationService.generateMonthlyPerformanceReport();
            
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
    public ResponseEntity<Map<String, Object>> executeAllWorkflows() {
        log.info("🔄 모든 워크플로우 수동 실행");
        try {
            workflowAutomationService.sendScheduleReminders();
            workflowAutomationService.sendIncompleteConsultationAlerts();
            workflowAutomationService.sendDailyPerformanceSummary();
            
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
