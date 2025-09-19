package com.mindgarden.consultation.controller;

import java.util.Map;
import com.mindgarden.consultation.repository.ConsultantClientMappingRepository;
import com.mindgarden.consultation.service.AmountManagementService;
import org.springframework.http.ResponseEntity;
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
@RequestMapping("/api/admin/amount-management")
@RequiredArgsConstructor
public class AmountManagementController {
    
    private final AmountManagementService amountManagementService;
    private final ConsultantClientMappingRepository mappingRepository;
    
    /**
     * 매핑의 통합 금액 정보 조회
     */
    @GetMapping("/mappings/{mappingId}/amount-info")
    public ResponseEntity<?> getIntegratedAmountInfo(@PathVariable Long mappingId) {
        try {
            log.info("📊 통합 금액 정보 조회: MappingID={}", mappingId);
            
            Map<String, Object> amountInfo = amountManagementService.getIntegratedAmountInfo(mappingId);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", amountInfo
            ));
        } catch (Exception e) {
            log.error("❌ 통합 금액 정보 조회 실패: MappingID={}", mappingId, e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "금액 정보 조회에 실패했습니다: " + e.getMessage()
            ));
        }
    }
    
    /**
     * 금액 일관성 검사
     */
    @GetMapping("/mappings/{mappingId}/consistency-check")
    public ResponseEntity<?> checkAmountConsistency(@PathVariable Long mappingId) {
        try {
            log.info("🔍 금액 일관성 검사: MappingID={}", mappingId);
            
            AmountManagementService.AmountConsistencyResult result = 
                amountManagementService.checkAmountConsistency(mappingId);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", Map.of(
                    "isConsistent", result.isConsistent(),
                    "reason", result.getInconsistencyReason(),
                    "amountBreakdown", result.getAmountBreakdown(),
                    "recommendation", result.getRecommendation()
                )
            ));
        } catch (Exception e) {
            log.error("❌ 금액 일관성 검사 실패: MappingID={}", mappingId, e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "금액 일관성 검사에 실패했습니다: " + e.getMessage()
            ));
        }
    }
    
    /**
     * 금액 검증
     */
    @PostMapping("/mappings/{mappingId}/validate-amount")
    public ResponseEntity<?> validateAmount(
            @PathVariable Long mappingId,
            @RequestBody Map<String, Object> request) {
        try {
            Long inputAmount = request.get("amount") != null ? 
                ((Number) request.get("amount")).longValue() : null;
            
            log.info("🔍 금액 검증: MappingID={}, InputAmount={}", mappingId, inputAmount);
            
            // 매핑 조회
            var mappingOpt = mappingRepository.findById(mappingId);
            if (mappingOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "매핑을 찾을 수 없습니다."
                ));
            }
            
            AmountManagementService.AmountValidationResult result = 
                amountManagementService.validateAmount(mappingOpt.get(), inputAmount);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", Map.of(
                    "isValid", result.isValid(),
                    "message", result.getMessage(),
                    "recommendedAmount", result.getRecommendedAmount(),
                    "detectedAmounts", result.getDetectedAmounts()
                )
            ));
        } catch (Exception e) {
            log.error("❌ 금액 검증 실패: MappingID={}", mappingId, e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "금액 검증에 실패했습니다: " + e.getMessage()
            ));
        }
    }
    
    /**
     * 금액 변경 이력 기록
     */
    @PostMapping("/mappings/{mappingId}/record-change")
    public ResponseEntity<?> recordAmountChange(
            @PathVariable Long mappingId,
            @RequestBody Map<String, Object> request) {
        try {
            Long oldAmount = request.get("oldAmount") != null ? 
                ((Number) request.get("oldAmount")).longValue() : null;
            Long newAmount = request.get("newAmount") != null ? 
                ((Number) request.get("newAmount")).longValue() : null;
            String changeReason = (String) request.get("changeReason");
            String changedBy = (String) request.get("changedBy");
            
            log.info("📝 금액 변경 이력 기록: MappingID={}, Old={}, New={}", 
                mappingId, oldAmount, newAmount);
            
            amountManagementService.recordAmountChange(mappingId, oldAmount, newAmount, changeReason, changedBy);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "금액 변경 이력이 기록되었습니다."
            ));
        } catch (Exception e) {
            log.error("❌ 금액 변경 이력 기록 실패: MappingID={}", mappingId, e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "금액 변경 이력 기록에 실패했습니다: " + e.getMessage()
            ));
        }
    }
}
