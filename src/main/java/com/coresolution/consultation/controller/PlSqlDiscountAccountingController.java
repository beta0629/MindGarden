package com.coresolution.consultation.controller;

import java.math.BigDecimal;
import java.util.Map;
import com.coresolution.consultation.constant.ProcedureUserFacingMessages;
import com.coresolution.consultation.service.PlSqlDiscountAccountingService;
import com.coresolution.consultation.service.support.ResourceOwnerAccessGuard;
import com.coresolution.consultation.util.ProcedureResults;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * PL/SQL 할인 회계 처리 컨트롤러
 *
 * <p>할인 적용·환불·상태 변경은 세션 테넌트 관리자만, 본문 {@code mappingId} 가 세션 테넌트 매핑일 때만 허용한다
 * ({@link ResourceOwnerAccessGuard#requireMappingAdminAccess}).</p>
 *
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-24
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/admin/plsql-discount-accounting") // 표준화 2025-12-05: 레거시 경로 제거
@RequiredArgsConstructor
public class PlSqlDiscountAccountingController {
    
    private final PlSqlDiscountAccountingService plSqlDiscountAccountingService;
    private final ResourceOwnerAccessGuard resourceOwnerAccessGuard;
    
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
            @RequestBody Map<String, Object> request, HttpSession session) {
        
        Long mappingId = requireAdminMapping(request, session);
        String discountCode = (String) request.get("discountCode");
        BigDecimal originalAmount = new BigDecimal(request.get("originalAmount").toString());
        BigDecimal discountAmount = new BigDecimal(request.get("discountAmount").toString());
        BigDecimal finalAmount = new BigDecimal(request.get("finalAmount").toString());
        String branchCode = (String) request.get("branchCode");
        String appliedBy = (String) request.get("appliedBy");
        
        log.info("💰 PL/SQL 할인 적용: MappingID={}, DiscountCode={}", mappingId, discountCode);
        
        return ResponseEntity.ok(ProcedureResults.callRequiringSuccess(
                ProcedureUserFacingMessages.PROC_APPLY_DISCOUNT_ACCOUNTING,
                ProcedureUserFacingMessages.DISCOUNT_APPLY_FAILED,
                () -> plSqlDiscountAccountingService.applyDiscountAccounting(mappingId, discountCode,
                        originalAmount, discountAmount, finalAmount, branchCode, appliedBy)));
    }
    
    /**
     * PL/SQL 할인 환불 처리
     */
    @PostMapping("/refund")
    public ResponseEntity<Map<String, Object>> processRefund(
            @RequestBody Map<String, Object> request, HttpSession session) {
        
        Long mappingId = requireAdminMapping(request, session);
        BigDecimal refundAmount = new BigDecimal(request.get("refundAmount").toString());
        String refundReason = (String) request.get("refundReason");
        String processedBy = (String) request.get("processedBy");
        
        log.info("💰 PL/SQL 할인 환불 처리: MappingID={}, RefundAmount={}", mappingId, refundAmount);
        
        return ResponseEntity.ok(ProcedureResults.callRequiringSuccess(
                ProcedureUserFacingMessages.PROC_PROCESS_DISCOUNT_REFUND,
                ProcedureUserFacingMessages.DISCOUNT_REFUND_FAILED,
                () -> plSqlDiscountAccountingService.processDiscountRefund(
                        mappingId, refundAmount, refundReason, processedBy)));
    }
    
    /**
     * PL/SQL 할인 상태 업데이트
     */
    @PostMapping("/update-status")
    public ResponseEntity<Map<String, Object>> updateStatus(
            @RequestBody Map<String, Object> request, HttpSession session) {
        
        Long mappingId = requireAdminMapping(request, session);
        String newStatus = (String) request.get("newStatus");
        String updatedBy = (String) request.get("updatedBy");
        String reason = (String) request.get("reason");
        
        log.info("🔄 PL/SQL 할인 상태 업데이트: MappingID={}, NewStatus={}", mappingId, newStatus);
        
        return ResponseEntity.ok(ProcedureResults.callRequiringSuccess(
                ProcedureUserFacingMessages.PROC_UPDATE_DISCOUNT_STATUS,
                ProcedureUserFacingMessages.DISCOUNT_STATUS_FAILED,
                () -> plSqlDiscountAccountingService.updateDiscountStatus(
                        mappingId, newStatus, updatedBy, reason)));
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
        
        return ResponseEntity.ok(ProcedureResults.callRequiringSuccess(
                ProcedureUserFacingMessages.PROC_GET_DISCOUNT_STATISTICS,
                ProcedureUserFacingMessages.DISCOUNT_STATISTICS_FAILED,
                () -> plSqlDiscountAccountingService.getDiscountStatistics(branchCode, startDate, endDate)));
    }
    
    /**
     * PL/SQL 할인 무결성 검증
     */
    @GetMapping("/validate-integrity")
    public ResponseEntity<Map<String, Object>> validateIntegrity(
            @RequestParam String branchCode) {
        
        log.info("🔍 PL/SQL 할인 무결성 검증: BranchCode={}", branchCode);
        
        return ResponseEntity.ok(ProcedureResults.callRequiringSuccess(
                ProcedureUserFacingMessages.PROC_VALIDATE_DISCOUNT_INTEGRITY,
                ProcedureUserFacingMessages.DISCOUNT_INTEGRITY_FAILED,
                () -> plSqlDiscountAccountingService.validateDiscountIntegrity(branchCode)));
    }

    /**
     * 본문 {@code mappingId} 를 관리자·세션 테넌트 기준으로 검증한다. 숫자가 아니거나 없으면 null 로 넘겨 공통 403 으로 거부한다.
     */
    private Long requireAdminMapping(Map<String, Object> request, HttpSession session) {
        Object raw = request != null ? request.get("mappingId") : null;
        Long mappingId = raw instanceof Number number ? number.longValue() : null;
        resourceOwnerAccessGuard.requireMappingAdminAccess(session, mappingId);
        return mappingId;
    }
}
