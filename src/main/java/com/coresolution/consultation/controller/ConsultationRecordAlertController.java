package com.coresolution.consultation.controller;

import java.time.LocalDate;
import java.util.Map;
import com.coresolution.consultation.scheduler.ConsultationRecordAlertScheduler;
import com.coresolution.consultation.service.PlSqlConsultationRecordAlertService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import lombok.extern.slf4j.Slf4j;

/**
 * 상담일지 미작성 알림 API 컨트롤러
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-11
 */
@Slf4j
@RestController
@RequestMapping({"/api/v1/admin/consultation-record-alerts", "/api/admin/consultation-record-alerts"}) // v1 경로 추가, 레거시 경로 유지
public class ConsultationRecordAlertController {
    
    @Autowired
    private PlSqlConsultationRecordAlertService consultationRecordAlertService;
    
    @Autowired
    private ConsultationRecordAlertScheduler consultationRecordAlertScheduler;
    
    /**
     * 상담일지 미작성 확인 및 알림 생성
     */
    @PostMapping("/check-missing")
    public ResponseEntity<Map<String, Object>> checkMissingRecords(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkDate,
            @RequestParam(required = false) String branchCode) {
        
        log.info("📝 상담일지 미작성 확인 API 호출: 날짜={}, 지점={}", checkDate, branchCode);
        
        try {
            Map<String, Object> result = consultationRecordAlertService.checkMissingConsultationRecords(checkDate, branchCode);
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("❌ 상담일지 미작성 확인 API 오류: {}", e.getMessage(), e);
            
            Map<String, Object> errorResponse = Map.of(
                "success", false,
                "message", "상담일지 미작성 확인 중 오류가 발생했습니다: " + e.getMessage(),
                "missingCount", 0,
                "alertsCreated", 0
            );
            
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }
    
    /**
     * 상담일지 미작성 알림 조회
     */
    @GetMapping("/missing-alerts")
    public ResponseEntity<Map<String, Object>> getMissingAlerts(
            @RequestParam(required = false) String branchCode,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        log.info("📝 상담일지 미작성 알림 조회 API 호출: 지점={}, 기간={}~{}", branchCode, startDate, endDate);
        
        try {
            Map<String, Object> result = consultationRecordAlertService.getMissingConsultationRecordAlerts(
                branchCode, startDate, endDate);
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("❌ 상담일지 미작성 알림 조회 API 오류: {}", e.getMessage(), e);
            
            Map<String, Object> errorResponse = Map.of(
                "success", false,
                "message", "상담일지 미작성 알림 조회 중 오류가 발생했습니다: " + e.getMessage(),
                "alerts", new Object[0],
                "totalCount", 0
            );
            
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }
    
    /**
     * 상담일지 작성 완료시 알림 해제
     */
    @PostMapping("/resolve-alert")
    public ResponseEntity<Map<String, Object>> resolveAlert(
            @RequestParam Long consultationId,
            @RequestParam String resolvedBy) {
        
        log.info("📝 상담일지 알림 해제 API 호출: 상담ID={}, 해제자={}", consultationId, resolvedBy);
        
        try {
            Map<String, Object> result = consultationRecordAlertService.resolveConsultationRecordAlert(
                consultationId, resolvedBy);
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("❌ 상담일지 알림 해제 API 오류: {}", e.getMessage(), e);
            
            Map<String, Object> errorResponse = Map.of(
                "success", false,
                "message", "상담일지 알림 해제 중 오류가 발생했습니다: " + e.getMessage()
            );
            
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }
    
    /**
     * 상담일지 미작성 통계 조회
     */
    @GetMapping("/statistics")
    public ResponseEntity<Map<String, Object>> getStatistics(
            @RequestParam(required = false) String branchCode,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        log.info("📊 상담일지 미작성 통계 조회 API 호출: 지점={}, 기간={}~{}", branchCode, startDate, endDate);
        
        try {
            Map<String, Object> result = consultationRecordAlertService.getConsultationRecordMissingStatistics(
                branchCode, startDate, endDate);
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("❌ 상담일지 미작성 통계 조회 API 오류: {}", e.getMessage(), e);
            
            Map<String, Object> errorResponse = Map.of(
                "success", false,
                "message", "상담일지 미작성 통계 조회 중 오류가 발생했습니다: " + e.getMessage(),
                "totalConsultations", 0,
                "missingRecords", 0,
                "completionRate", 0.0,
                "consultantBreakdown", Map.of()
            );
            
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }
    
    /**
     * 상담사별 상담일지 미작성 현황 조회
     */
    @GetMapping("/consultant-missing")
    public ResponseEntity<Map<String, Object>> getConsultantMissingRecords(
            @RequestParam Long consultantId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        log.info("👤 상담사별 상담일지 미작성 현황 조회 API 호출: 상담사ID={}, 기간={}~{}", 
                consultantId, startDate, endDate);
        
        try {
            Map<String, Object> result = consultationRecordAlertService.getConsultantMissingRecords(
                consultantId, startDate, endDate);
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("❌ 상담사별 상담일지 미작성 현황 조회 API 오류: {}", e.getMessage(), e);
            
            Map<String, Object> errorResponse = Map.of(
                "success", false,
                "message", "상담사별 상담일지 미작성 현황 조회 중 오류가 발생했습니다: " + e.getMessage(),
                "records", new Object[0],
                "totalCount", 0,
                "missingCount", 0,
                "completionRate", 0
            );
            
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }
    
    /**
     * 상담일지 알림 일괄 해제
     */
    @PostMapping("/resolve-all-alerts")
    public ResponseEntity<Map<String, Object>> resolveAllAlerts(
            @RequestParam(required = false) Long consultantId,
            @RequestParam String resolvedBy) {
        
        log.info("📝 상담일지 알림 일괄 해제 API 호출: 상담사ID={}, 해제자={}", consultantId, resolvedBy);
        
        try {
            Map<String, Object> result = consultationRecordAlertService.resolveAllConsultationRecordAlerts(
                consultantId, resolvedBy);
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("❌ 상담일지 알림 일괄 해제 API 오류: {}", e.getMessage(), e);
            
            Map<String, Object> errorResponse = Map.of(
                "success", false,
                "message", "상담일지 알림 일괄 해제 중 오류가 발생했습니다: " + e.getMessage(),
                "updatedCount", 0
            );
            
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }
    
    /**
     * 수동 상담일지 미작성 확인 실행 (관리자용)
     */
    @PostMapping("/manual-check")
    public ResponseEntity<Map<String, Object>> manualCheck(
            @RequestParam(defaultValue = "1") int daysBack) {
        
        log.info("🔧 수동 상담일지 미작성 확인 API 호출: {}일 전까지", daysBack);
        
        try {
            Map<String, Object> result = consultationRecordAlertScheduler.manualCheckMissingRecords(daysBack);
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("❌ 수동 상담일지 미작성 확인 API 오류: {}", e.getMessage(), e);
            
            Map<String, Object> errorResponse = Map.of(
                "success", false,
                "message", "수동 상담일지 미작성 확인 중 오류가 발생했습니다: " + e.getMessage(),
                "processedDays", 0,
                "totalAlertsCreated", 0
            );
            
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }
    
    /**
     * 상담일지 알림 시스템 상태 확인
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getSystemStatus() {
        log.info("🔍 상담일지 알림 시스템 상태 확인 API 호출");
        
        try {
            // 최근 7일간의 통계 조회
            LocalDate endDate = LocalDate.now().minusDays(1);
            LocalDate startDate = endDate.minusDays(6);
            
            Map<String, Object> statistics = consultationRecordAlertService.getConsultationRecordMissingStatistics(
                null, startDate, endDate);
            
            Map<String, Object> status = Map.of(
                "success", true,
                "message", "상담일지 알림 시스템이 정상 작동 중입니다",
                "systemStatus", "ACTIVE",
                "lastCheckDate", endDate.toString(),
                "statistics", statistics
            );
            
            return ResponseEntity.ok(status);
            
        } catch (Exception e) {
            log.error("❌ 상담일지 알림 시스템 상태 확인 API 오류: {}", e.getMessage(), e);
            
            Map<String, Object> errorStatus = Map.of(
                "success", false,
                "message", "상담일지 알림 시스템 상태 확인 중 오류가 발생했습니다: " + e.getMessage(),
                "systemStatus", "ERROR",
                "lastCheckDate", null,
                "statistics", Map.of()
            );
            
            return ResponseEntity.internalServerError().body(errorStatus);
        }
    }
}
