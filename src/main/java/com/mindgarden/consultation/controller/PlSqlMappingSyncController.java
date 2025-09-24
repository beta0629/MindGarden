package com.mindgarden.consultation.controller;

import java.util.Map;
import com.mindgarden.consultation.service.PlSqlMappingSyncService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * PL/SQL 매핑-회기 동기화 REST API 컨트롤러
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-24
 */
@Slf4j
@RestController
@RequestMapping("/api/admin/plsql-mapping-sync")
@RequiredArgsConstructor
public class PlSqlMappingSyncController {
    
    private final PlSqlMappingSyncService plSqlMappingSyncService;
    
    /**
     * PL/SQL 프로시저 사용 가능 여부 확인
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getStatus() {
        log.info("🔍 PL/SQL 매핑-회기 동기화 상태 확인");
        
        boolean isAvailable = plSqlMappingSyncService.isProcedureAvailable();
        
        Map<String, Object> response = Map.of(
            "plsqlAvailable", isAvailable,
            "message", isAvailable ? "PL/SQL 프로시저 사용 가능" : "PL/SQL 프로시저 사용 불가",
            "success", true,
            "timestamp", System.currentTimeMillis()
        );
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * 회기 사용 처리 (스케줄 생성 시)
     */
    @PostMapping("/use-session")
    public ResponseEntity<Map<String, Object>> useSessionForMapping(
            @RequestParam Long consultantId,
            @RequestParam Long clientId,
            @RequestParam Long scheduleId,
            @RequestParam String sessionType) {
        
        log.info("🔄 회기 사용 처리 요청: ConsultantID={}, ClientID={}, ScheduleID={}, Type={}", 
                 consultantId, clientId, scheduleId, sessionType);
        
        Map<String, Object> result = plSqlMappingSyncService.useSessionForMapping(
            consultantId, clientId, scheduleId, sessionType
        );
        
        return ResponseEntity.ok(result);
    }
    
    /**
     * 회기 추가 처리 (연장 요청 시)
     */
    @PostMapping("/add-sessions")
    public ResponseEntity<Map<String, Object>> addSessionsToMapping(
            @RequestParam Long mappingId,
            @RequestParam Integer additionalSessions,
            @RequestParam String packageName,
            @RequestParam Long packagePrice,
            @RequestParam String extensionReason) {
        
        log.info("🔄 회기 추가 처리 요청: MappingID={}, AdditionalSessions={}, PackageName={}", 
                 mappingId, additionalSessions, packageName);
        
        Map<String, Object> result = plSqlMappingSyncService.addSessionsToMapping(
            mappingId, additionalSessions, packageName, packagePrice, extensionReason
        );
        
        return ResponseEntity.ok(result);
    }
    
    /**
     * 매핑 데이터 무결성 검증
     */
    @GetMapping("/validate/{mappingId}")
    public ResponseEntity<Map<String, Object>> validateMappingIntegrity(@PathVariable Long mappingId) {
        log.info("🔍 매핑 무결성 검증 요청: MappingID={}", mappingId);
        
        Map<String, Object> result = plSqlMappingSyncService.validateMappingIntegrity(mappingId);
        
        return ResponseEntity.ok(result);
    }
    
    /**
     * 전체 시스템 매핑 동기화
     */
    @PostMapping("/sync-all")
    public ResponseEntity<Map<String, Object>> syncAllMappings() {
        log.info("🔄 전체 매핑 동기화 요청");
        
        Map<String, Object> result = plSqlMappingSyncService.syncAllMappings();
        
        return ResponseEntity.ok(result);
    }
    
    /**
     * 환불 시 회기 수 조절 처리
     */
    @PostMapping("/refund")
    public ResponseEntity<Map<String, Object>> processRefundWithSessionAdjustment(
            @RequestParam Long mappingId,
            @RequestParam Long refundAmount,
            @RequestParam Integer refundSessions,
            @RequestParam String refundReason,
            @RequestParam String processedBy) {
        
        log.info("💰 환불 처리 요청: MappingID={}, RefundAmount={}, RefundSessions={}", 
                 mappingId, refundAmount, refundSessions);
        
        Map<String, Object> result = plSqlMappingSyncService.processRefundWithSessionAdjustment(
            mappingId, refundAmount, refundSessions, refundReason, processedBy
        );
        
        return ResponseEntity.ok(result);
    }
    
    /**
     * 부분 환불 처리 (최근 회기만 환불)
     */
    @PostMapping("/partial-refund")
    public ResponseEntity<Map<String, Object>> processPartialRefund(
            @RequestParam Long mappingId,
            @RequestParam Long refundAmount,
            @RequestParam Integer refundSessions,
            @RequestParam String refundReason,
            @RequestParam String processedBy) {
        
        log.info("💰 부분 환불 처리 요청: MappingID={}, RefundAmount={}, RefundSessions={}", 
                 mappingId, refundAmount, refundSessions);
        
        Map<String, Object> result = plSqlMappingSyncService.processPartialRefund(
            mappingId, refundAmount, refundSessions, refundReason, processedBy
        );
        
        return ResponseEntity.ok(result);
    }
    
    /**
     * 환불 가능 회기 수 조회
     */
    @GetMapping("/refundable-sessions/{mappingId}")
    public ResponseEntity<Map<String, Object>> getRefundableSessions(@PathVariable Long mappingId) {
        log.info("🔍 환불 가능 회기 조회 요청: MappingID={}", mappingId);
        
        Map<String, Object> result = plSqlMappingSyncService.getRefundableSessions(mappingId);
        
        return ResponseEntity.ok(result);
    }
    
    /**
     * 환불 통계 조회
     */
    @GetMapping("/refund-statistics")
    public ResponseEntity<Map<String, Object>> getRefundStatistics(
            @RequestParam(required = false) String branchCode,
            @RequestParam String startDate,
            @RequestParam String endDate) {
        
        log.info("📊 환불 통계 조회 요청: BranchCode={}, Period={} ~ {}", branchCode, startDate, endDate);
        
        Map<String, Object> result = plSqlMappingSyncService.getRefundStatistics(
            branchCode, startDate, endDate
        );
        
        return ResponseEntity.ok(result);
    }
}
