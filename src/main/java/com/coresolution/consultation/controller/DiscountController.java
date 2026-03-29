package com.coresolution.consultation.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.service.PackageDiscountService;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.consultation.service.PackageDiscountService.DiscountCalculationResult;
import com.coresolution.consultation.service.PackageDiscountService.DiscountOption;
import com.coresolution.consultation.service.PackageDiscountService.DiscountValidationResult;
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
 * 할인 관리 컨트롤러
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-24
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/admin/discounts") // 표준화 2025-12-05: 레거시 경로 제거
@RequiredArgsConstructor
public class DiscountController {
    
    private final PackageDiscountService packageDiscountService;
    private final ConsultantClientMappingRepository mappingRepository;

    private String resolveTenantId(HttpSession session) {
        String tenantId = SessionUtils.getTenantId(session);
        if (tenantId == null || tenantId.isEmpty()) {
            var user = SessionUtils.getCurrentUser(session);
            if (user != null) {
                tenantId = user.getTenantId();
            }
        }
        return tenantId;
    }
    
    /**
     * 적용 가능한 할인 옵션 조회
     */
    @GetMapping("/available")
    public ResponseEntity<Map<String, Object>> getAvailableDiscounts(
            @RequestParam Long mappingId,
            HttpSession session) {
        
        log.info("💰 적용 가능한 할인 옵션 조회: mappingId={}", mappingId);
        
        try {
            String tenantId = resolveTenantId(session);
            if (tenantId == null || tenantId.isEmpty()) {
                throw new IllegalStateException("테넌트 ID를 확인할 수 없습니다.");
            }
            ConsultantClientMapping mapping = mappingRepository.findByTenantIdAndId(tenantId, mappingId)
                .orElseThrow(() -> new RuntimeException("매핑을 찾을 수 없습니다: " + mappingId));
            
            List<DiscountOption> discounts = packageDiscountService.getAvailableDiscounts(mapping);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", discounts);
            response.put("message", "적용 가능한 할인 옵션 조회 완료");
            
            log.info("✅ 적용 가능한 할인 옵션 조회 완료: {}개", discounts.size());
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ 적용 가능한 할인 옵션 조회 실패: mappingId={}, 오류={}", mappingId, e.getMessage(), e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "할인 옵션 조회 실패: " + e.getMessage());
            return ResponseEntity.ok(response);
        }
    }
    
    /**
     * 할인 코드 적용
     */
    @PostMapping("/apply")
    public ResponseEntity<Map<String, Object>> applyDiscount(
            @RequestBody Map<String, Object> request,
            HttpSession session) {
        
        Long mappingId = ((Number) request.get("mappingId")).longValue();
        String discountCode = (String) request.get("discountCode");
        
        log.info("💰 할인 코드 적용: mappingId={}, discountCode={}", mappingId, discountCode);
        
        try {
            String tenantId = resolveTenantId(session);
            if (tenantId == null || tenantId.isEmpty()) {
                throw new IllegalStateException("테넌트 ID를 확인할 수 없습니다.");
            }
            ConsultantClientMapping mapping = mappingRepository.findByTenantIdAndId(tenantId, mappingId)
                .orElseThrow(() -> new RuntimeException("매핑을 찾을 수 없습니다: " + mappingId));
            
            DiscountCalculationResult result = packageDiscountService.calculateDiscountWithCode(mapping, discountCode);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", result.isValid());
            response.put("data", result);
            response.put("message", result.getMessage());
            
            if (result.isValid()) {
                log.info("✅ 할인 코드 적용 완료: mappingId={}, discountCode={}, finalAmount={}", 
                         mappingId, discountCode, result.getFinalAmount());
            } else {
                log.warn("⚠️ 할인 코드 적용 실패: mappingId={}, discountCode={}, reason={}", 
                         mappingId, discountCode, result.getMessage());
            }
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ 할인 코드 적용 실패: mappingId={}, discountCode={}, 오류={}", 
                     mappingId, discountCode, e.getMessage(), e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "할인 적용 실패: " + e.getMessage());
            return ResponseEntity.ok(response);
        }
    }
    
    /**
     * 할인 유효성 검증
     */
    @PostMapping("/validate")
    public ResponseEntity<Map<String, Object>> validateDiscount(
            @RequestBody Map<String, Object> request,
            HttpSession session) {
        
        Long mappingId = ((Number) request.get("mappingId")).longValue();
        String discountCode = (String) request.get("discountCode");
        
        log.info("🔍 할인 유효성 검증: mappingId={}, discountCode={}", mappingId, discountCode);
        
        try {
            String tenantId = resolveTenantId(session);
            if (tenantId == null || tenantId.isEmpty()) {
                throw new IllegalStateException("테넌트 ID를 확인할 수 없습니다.");
            }
            ConsultantClientMapping mapping = mappingRepository.findByTenantIdAndId(tenantId, mappingId)
                .orElseThrow(() -> new RuntimeException("매핑을 찾을 수 없습니다: " + mappingId));
            
            DiscountValidationResult result = packageDiscountService.validateDiscount(mapping, discountCode);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", result.isValid());
            response.put("data", result);
            response.put("message", result.getMessage());
            
            log.info("✅ 할인 유효성 검증 완료: mappingId={}, discountCode={}, valid={}", 
                     mappingId, discountCode, result.isValid());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ 할인 유효성 검증 실패: mappingId={}, discountCode={}, 오류={}", 
                     mappingId, discountCode, e.getMessage(), e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "할인 검증 실패: " + e.getMessage());
            return ResponseEntity.ok(response);
        }
    }
    
    /**
     * 할인 미리보기 (실제 적용하지 않고 계산만)
     */
    @PostMapping("/preview")
    public ResponseEntity<Map<String, Object>> previewDiscount(
            @RequestBody Map<String, Object> request,
            HttpSession session) {
        
        Long mappingId = ((Number) request.get("mappingId")).longValue();
        String discountCode = (String) request.get("discountCode");
        
        log.info("👁️ 할인 미리보기: mappingId={}, discountCode={}", mappingId, discountCode);
        
        try {
            String tenantId = resolveTenantId(session);
            if (tenantId == null || tenantId.isEmpty()) {
                throw new IllegalStateException("테넌트 ID를 확인할 수 없습니다.");
            }
            ConsultantClientMapping mapping = mappingRepository.findByTenantIdAndId(tenantId, mappingId)
                .orElseThrow(() -> new RuntimeException("매핑을 찾을 수 없습니다: " + mappingId));
            
            DiscountCalculationResult result = packageDiscountService.calculateDiscountWithCode(mapping, discountCode);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", result);
            response.put("message", "할인 미리보기 완료");
            
            log.info("✅ 할인 미리보기 완료: mappingId={}, discountCode={}, finalAmount={}", 
                     mappingId, discountCode, result.getFinalAmount());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ 할인 미리보기 실패: mappingId={}, discountCode={}, 오류={}", 
                     mappingId, discountCode, e.getMessage(), e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "할인 미리보기 실패: " + e.getMessage());
            return ResponseEntity.ok(response);
        }
    }
}
