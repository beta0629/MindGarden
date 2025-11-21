package com.coresolution.consultation.controller;

import java.util.HashMap;
import java.util.Map;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.service.AmountManagementService;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 금액 관리 중앙화 컨트롤러
 * 모든 금액 관련 API를 통합 관리
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-19
 */
@Slf4j
@RestController
@RequestMapping({"/api/v1/admin/amount-management", "/api/admin/amount-management"}) // v1 경로 추가, 레거시 경로 유지
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class AmountManagementController extends BaseApiController {
    
    private final AmountManagementService amountManagementService;
    private final ConsultantClientMappingRepository mappingRepository;
    
    /**
     * 매핑의 통합 금액 정보 조회
     */
    @GetMapping("/mappings/{mappingId}/amount-info")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getIntegratedAmountInfo(@PathVariable Long mappingId) {
        log.info("📊 통합 금액 정보 조회: MappingID={}", mappingId);
        
        Map<String, Object> amountInfo = amountManagementService.getIntegratedAmountInfo(mappingId);
        
        return success(amountInfo);
    }
    
    /**
     * 금액 일관성 검사
     */
    @GetMapping("/mappings/{mappingId}/consistency-check")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkAmountConsistency(@PathVariable Long mappingId) {
        log.info("🔍 금액 일관성 검사: MappingID={}", mappingId);
        
        AmountManagementService.AmountConsistencyResult result = 
            amountManagementService.checkAmountConsistency(mappingId);
        
        Map<String, Object> data = new HashMap<>();
        data.put("isConsistent", result.isConsistent());
        data.put("reason", result.getInconsistencyReason());
        data.put("amountBreakdown", result.getAmountBreakdown());
        data.put("recommendation", result.getRecommendation());
        
        return success(data);
    }
    
    /**
     * 금액 검증
     */
    @PostMapping("/mappings/{mappingId}/validate-amount")
    public ResponseEntity<ApiResponse<Map<String, Object>>> validateAmount(
            @PathVariable Long mappingId,
            @RequestBody Map<String, Object> request) {
        Long inputAmount = request.get("amount") != null ? 
            ((Number) request.get("amount")).longValue() : null;
        
        log.info("🔍 금액 검증: MappingID={}, InputAmount={}", mappingId, inputAmount);
        
        // 매핑 조회
        var mappingOpt = mappingRepository.findById(mappingId);
        if (mappingOpt.isEmpty()) {
            throw new RuntimeException("매핑을 찾을 수 없습니다.");
        }
        
        AmountManagementService.AmountValidationResult result = 
            amountManagementService.validateAmount(mappingOpt.get(), inputAmount);
        
        Map<String, Object> data = new HashMap<>();
        data.put("isValid", result.isValid());
        data.put("message", result.getMessage());
        data.put("recommendedAmount", result.getRecommendedAmount());
        data.put("detectedAmounts", result.getDetectedAmounts());
        
        return success(data);
    }
    
    /**
     * 금액 변경 이력 기록
     */
    @PostMapping("/mappings/{mappingId}/record-change")
    public ResponseEntity<ApiResponse<Void>> recordAmountChange(
            @PathVariable Long mappingId,
            @RequestBody Map<String, Object> request) {
        Long oldAmount = request.get("oldAmount") != null ? 
            ((Number) request.get("oldAmount")).longValue() : null;
        Long newAmount = request.get("newAmount") != null ? 
            ((Number) request.get("newAmount")).longValue() : null;
        String changeReason = (String) request.get("changeReason");
        String changedBy = (String) request.get("changedBy");
        
        log.info("📝 금액 변경 이력 기록: MappingID={}, Old={}, New={}", 
            mappingId, oldAmount, newAmount);
        
        amountManagementService.recordAmountChange(mappingId, oldAmount, newAmount, changeReason, changedBy);
        
        return success("금액 변경 이력이 기록되었습니다.");
    }
}
