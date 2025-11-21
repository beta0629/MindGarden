package com.coresolution.consultation.controller;

import java.util.Map;
import com.coresolution.consultation.service.DiscountAccountingService;
import com.coresolution.consultation.service.DiscountAccountingService.DiscountAccountingResult;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 할인 회계 처리 컨트롤러
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-24
 */
@Slf4j
@RestController
@RequestMapping({"/api/v1/admin/discount-accounting", "/api/admin/discount-accounting"}) // v1 경로 추가, 레거시 경로 유지
@RequiredArgsConstructor
public class DiscountAccountingController {
    
    private final DiscountAccountingService discountAccountingService;
    
    /**
     * 할인 회계 거래 조회
     */
    @GetMapping("/{mappingId}")
    public ResponseEntity<Map<String, Object>> getDiscountAccounting(@PathVariable Long mappingId) {
        log.info("💰 할인 회계 거래 조회: mappingId={}", mappingId);
        
        try {
            DiscountAccountingResult result = discountAccountingService.getDiscountAccounting(mappingId);
            
            Map<String, Object> response = Map.of(
                "success", result.isSuccess(),
                "data", result,
                "message", result.getMessage()
            );
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ 할인 회계 거래 조회 실패: mappingId={}, 오류={}", mappingId, e.getMessage(), e);
            
            Map<String, Object> response = Map.of(
                "success", false,
                "message", "할인 회계 거래 조회 실패: " + e.getMessage()
            );
            
            return ResponseEntity.ok(response);
        }
    }
    
    /**
     * 할인 회계 거래 검증
     */
    @GetMapping("/{mappingId}/validate")
    public ResponseEntity<Map<String, Object>> validateDiscountAccounting(@PathVariable Long mappingId) {
        log.info("🔍 할인 회계 거래 검증: mappingId={}", mappingId);
        
        try {
            Map<String, Object> result = discountAccountingService.validateDiscountAccounting(mappingId);
            
            Map<String, Object> response = Map.of(
                "success", true,
                "data", result,
                "message", "할인 회계 거래 검증 완료"
            );
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ 할인 회계 거래 검증 실패: mappingId={}, 오류={}", mappingId, e.getMessage(), e);
            
            Map<String, Object> response = Map.of(
                "success", false,
                "message", "할인 회계 거래 검증 실패: " + e.getMessage()
            );
            
            return ResponseEntity.ok(response);
        }
    }
    
    /**
     * 할인 회계 거래 취소
     */
    @PostMapping("/{mappingId}/cancel")
    public ResponseEntity<Map<String, Object>> cancelDiscountAccounting(
            @PathVariable Long mappingId,
            @RequestBody Map<String, String> request) {
        
        String reason = request.getOrDefault("reason", "사용자 요청에 의한 취소");
        
        log.info("💰 할인 회계 거래 취소: mappingId={}, reason={}", mappingId, reason);
        
        try {
            Map<String, Object> result = discountAccountingService.cancelDiscountAccounting(mappingId, reason);
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("❌ 할인 회계 거래 취소 실패: mappingId={}, 오류={}", mappingId, e.getMessage(), e);
            
            Map<String, Object> response = Map.of(
                "success", false,
                "message", "할인 회계 거래 취소 실패: " + e.getMessage()
            );
            
            return ResponseEntity.ok(response);
        }
    }
    
    /**
     * 할인 회계 거래 수정
     */
    @PutMapping("/{mappingId}")
    public ResponseEntity<Map<String, Object>> updateDiscountAccounting(
            @PathVariable Long mappingId,
            @RequestBody Map<String, Object> request) {
        
        log.info("💰 할인 회계 거래 수정: mappingId={}", mappingId);
        
        try {
            // 요청 데이터 파싱
            String discountCode = (String) request.get("discountCode");
            Double newFinalAmount = ((Number) request.get("newFinalAmount")).doubleValue();
            
            // 할인 정보 조회 (실제 구현에서는 Discount 엔티티를 조회해야 함)
            // 여기서는 간단히 처리
            
            Map<String, Object> result = discountAccountingService.updateDiscountAccounting(
                mappingId, null, java.math.BigDecimal.valueOf(newFinalAmount)
            );
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("❌ 할인 회계 거래 수정 실패: mappingId={}, 오류={}", mappingId, e.getMessage(), e);
            
            Map<String, Object> response = Map.of(
                "success", false,
                "message", "할인 회계 거래 수정 실패: " + e.getMessage()
            );
            
            return ResponseEntity.ok(response);
        }
    }
}
