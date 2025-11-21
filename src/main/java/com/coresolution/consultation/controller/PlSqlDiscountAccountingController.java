package com.coresolution.consultation.controller;

import java.math.BigDecimal;
import java.util.Map;
import com.coresolution.consultation.service.PlSqlDiscountAccountingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * PL/SQL 할인 회계 처리 컨트롤러
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-24
 */
@Slf4j
@RestController
@RequestMapping({"/api/v1/admin/plsql-discount-accounting", "/api/admin/plsql-discount-accounting"}) // v1 경로 추가, 레거시 경로 유지
@RequiredArgsConstructor
public class PlSqlDiscountAccountingController {
    
    private final PlSqlDiscountAccountingService plSqlDiscountAccountingService;
    
    /**
     * PL/SQL 프로시저 사용 가능 여부 확인
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getPlSqlStatus() {
        log.info("🔍 PL/SQL 할인 회계 프로시저 상태 확인");
        
        try {
            boolean isAvailable = plSqlDiscountAccountingService.isProcedureAvailable();
            
            Map<String, Object> response = Map.of(
                "success", true,
                "plsqlAvailable", isAvailable,
                "message", isAvailable ? "PL/SQL 프로시저 사용 가능" : "PL/SQL 프로시저 사용 불가",
                "timestamp", System.currentTimeMillis()
            );
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ PL/SQL 상태 확인 실패: {}", e.getMessage(), e);
            
            Map<String, Object> response = Map.of(
                "success", false,
                "plsqlAvailable", false,
                "message", "PL/SQL 상태 확인 실패: " + e.getMessage()
            );
            
            return ResponseEntity.ok(response);
        }
    }
    
    /**
     * PL/SQL 할인 적용
     */
    @PostMapping("/apply")
    public ResponseEntity<Map<String, Object>> applyDiscount(
            @RequestBody Map<String, Object> request) {
        
        Long mappingId = ((Number) request.get("mappingId")).longValue();
        String discountCode = (String) request.get("discountCode");
        BigDecimal originalAmount = new BigDecimal(request.get("originalAmount").toString());
        BigDecimal discountAmount = new BigDecimal(request.get("discountAmount").toString());
        BigDecimal finalAmount = new BigDecimal(request.get("finalAmount").toString());
        String branchCode = (String) request.get("branchCode");
        String appliedBy = (String) request.get("appliedBy");
        
        log.info("💰 PL/SQL 할인 적용: MappingID={}, DiscountCode={}", mappingId, discountCode);
        
        try {
            Map<String, Object> result = plSqlDiscountAccountingService.applyDiscountAccounting(
                mappingId, discountCode, originalAmount, discountAmount, finalAmount, branchCode, appliedBy
            );
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("❌ PL/SQL 할인 적용 실패: MappingID={}, 오류={}", mappingId, e.getMessage(), e);
            
            Map<String, Object> response = Map.of(
                "success", false,
                "message", "PL/SQL 할인 적용 실패: " + e.getMessage()
            );
            
            return ResponseEntity.ok(response);
        }
    }
    
    /**
     * PL/SQL 할인 환불 처리
     */
    @PostMapping("/refund")
    public ResponseEntity<Map<String, Object>> processRefund(
            @RequestBody Map<String, Object> request) {
        
        Long mappingId = ((Number) request.get("mappingId")).longValue();
        BigDecimal refundAmount = new BigDecimal(request.get("refundAmount").toString());
        String refundReason = (String) request.get("refundReason");
        String processedBy = (String) request.get("processedBy");
        
        log.info("💰 PL/SQL 할인 환불 처리: MappingID={}, RefundAmount={}", mappingId, refundAmount);
        
        try {
            Map<String, Object> result = plSqlDiscountAccountingService.processDiscountRefund(
                mappingId, refundAmount, refundReason, processedBy
            );
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("❌ PL/SQL 할인 환불 처리 실패: MappingID={}, 오류={}", mappingId, e.getMessage(), e);
            
            Map<String, Object> response = Map.of(
                "success", false,
                "message", "PL/SQL 할인 환불 처리 실패: " + e.getMessage()
            );
            
            return ResponseEntity.ok(response);
        }
    }
    
    /**
     * PL/SQL 할인 상태 업데이트
     */
    @PostMapping("/update-status")
    public ResponseEntity<Map<String, Object>> updateStatus(
            @RequestBody Map<String, Object> request) {
        
        Long mappingId = ((Number) request.get("mappingId")).longValue();
        String newStatus = (String) request.get("newStatus");
        String updatedBy = (String) request.get("updatedBy");
        String reason = (String) request.get("reason");
        
        log.info("🔄 PL/SQL 할인 상태 업데이트: MappingID={}, NewStatus={}", mappingId, newStatus);
        
        try {
            Map<String, Object> result = plSqlDiscountAccountingService.updateDiscountStatus(
                mappingId, newStatus, updatedBy, reason
            );
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("❌ PL/SQL 할인 상태 업데이트 실패: MappingID={}, 오류={}", mappingId, e.getMessage(), e);
            
            Map<String, Object> response = Map.of(
                "success", false,
                "message", "PL/SQL 할인 상태 업데이트 실패: " + e.getMessage()
            );
            
            return ResponseEntity.ok(response);
        }
    }
    
    /**
     * PL/SQL 할인 통계 조회
     */
    @GetMapping("/statistics")
    public ResponseEntity<Map<String, Object>> getStatistics(
            @RequestParam String branchCode,
            @RequestParam String startDate,
            @RequestParam String endDate) {
        
        log.info("📊 PL/SQL 할인 통계 조회: BranchCode={}, Period={} ~ {}", branchCode, startDate, endDate);
        
        try {
            Map<String, Object> result = plSqlDiscountAccountingService.getDiscountStatistics(
                branchCode, startDate, endDate
            );
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("❌ PL/SQL 할인 통계 조회 실패: BranchCode={}, 오류={}", branchCode, e.getMessage(), e);
            
            Map<String, Object> response = Map.of(
                "success", false,
                "message", "PL/SQL 할인 통계 조회 실패: " + e.getMessage()
            );
            
            return ResponseEntity.ok(response);
        }
    }
    
    /**
     * PL/SQL 할인 무결성 검증
     */
    @GetMapping("/validate-integrity")
    public ResponseEntity<Map<String, Object>> validateIntegrity(
            @RequestParam String branchCode) {
        
        log.info("🔍 PL/SQL 할인 무결성 검증: BranchCode={}", branchCode);
        
        try {
            Map<String, Object> result = plSqlDiscountAccountingService.validateDiscountIntegrity(branchCode);
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("❌ PL/SQL 할인 무결성 검증 실패: BranchCode={}, 오류={}", branchCode, e.getMessage(), e);
            
            Map<String, Object> response = Map.of(
                "success", false,
                "message", "PL/SQL 할인 무결성 검증 실패: " + e.getMessage()
            );
            
            return ResponseEntity.ok(response);
        }
    }
}
