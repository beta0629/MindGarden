package com.coresolution.consultation.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.service.PackageDiscountService;
import com.coresolution.consultation.service.PackageDiscountService.DiscountCalculationResult;
import com.coresolution.consultation.service.PackageDiscountService.DiscountOption;
import com.coresolution.consultation.service.PackageDiscountService.DiscountValidationResult;
import com.coresolution.consultation.service.support.ResourceOwnerAccessGuard;
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
 * <p>모든 엔드포인트는 세션 테넌트 관리자만, {@code mappingId} 가 세션 테넌트 매핑일 때만 허용한다
 * ({@link ResourceOwnerAccessGuard#requireMappingAdminAccess}). 없는·다른 테넌트 매핑은 공통 403 이다.</p>
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

    private static final String AVAILABLE_FAILED = "할인 옵션 조회에 실패했습니다.";
    private static final String APPLY_FAILED = "할인 적용에 실패했습니다.";
    private static final String VALIDATE_FAILED = "할인 검증에 실패했습니다.";
    private static final String PREVIEW_FAILED = "할인 미리보기에 실패했습니다.";

    private final PackageDiscountService packageDiscountService;
    private final ResourceOwnerAccessGuard resourceOwnerAccessGuard;
    
    /**
     * 적용 가능한 할인 옵션 조회
     */
    @GetMapping("/available")
    public ResponseEntity<Map<String, Object>> getAvailableDiscounts(
            @RequestParam Long mappingId,
            HttpSession session) {
        
        ConsultantClientMapping mapping = resourceOwnerAccessGuard.requireMappingAdminAccess(session, mappingId);
        log.info("💰 적용 가능한 할인 옵션 조회: mappingId={}", mappingId);
        
        try {
            List<DiscountOption> discounts = packageDiscountService.getAvailableDiscounts(mapping);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", discounts);
            response.put("message", "적용 가능한 할인 옵션 조회 완료");
            
            log.info("✅ 적용 가능한 할인 옵션 조회 완료: {}개", discounts.size());
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ 적용 가능한 할인 옵션 조회 실패: mappingId={}, 오류={}", mappingId, e.getMessage(), e);
            return failure(AVAILABLE_FAILED);
        }
    }
    
    /**
     * 할인 코드 적용
     */
    @PostMapping("/apply")
    public ResponseEntity<Map<String, Object>> applyDiscount(
            @RequestBody Map<String, Object> request,
            HttpSession session) {
        
        ConsultantClientMapping mapping = requireAdminMapping(request, session);
        Long mappingId = mapping.getId();
        String discountCode = (String) request.get("discountCode");
        
        log.info("💰 할인 코드 적용: mappingId={}, discountCode={}", mappingId, discountCode);
        
        try {
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
            return failure(APPLY_FAILED);
        }
    }
    
    /**
     * 할인 유효성 검증
     */
    @PostMapping("/validate")
    public ResponseEntity<Map<String, Object>> validateDiscount(
            @RequestBody Map<String, Object> request,
            HttpSession session) {
        
        ConsultantClientMapping mapping = requireAdminMapping(request, session);
        Long mappingId = mapping.getId();
        String discountCode = (String) request.get("discountCode");
        
        log.info("🔍 할인 유효성 검증: mappingId={}, discountCode={}", mappingId, discountCode);
        
        try {
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
            return failure(VALIDATE_FAILED);
        }
    }
    
    /**
     * 할인 미리보기 (실제 적용하지 않고 계산만)
     */
    @PostMapping("/preview")
    public ResponseEntity<Map<String, Object>> previewDiscount(
            @RequestBody Map<String, Object> request,
            HttpSession session) {
        
        ConsultantClientMapping mapping = requireAdminMapping(request, session);
        Long mappingId = mapping.getId();
        String discountCode = (String) request.get("discountCode");
        
        log.info("👁️ 할인 미리보기: mappingId={}, discountCode={}", mappingId, discountCode);
        
        try {
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
            return failure(PREVIEW_FAILED);
        }
    }

    /**
     * 본문 {@code mappingId} 를 관리자·세션 테넌트 기준으로 검증한다. 숫자가 아니거나 없으면 공통 403 으로 거부한다.
     */
    private ConsultantClientMapping requireAdminMapping(Map<String, Object> request, HttpSession session) {
        Object raw = request != null ? request.get("mappingId") : null;
        Long mappingId = raw instanceof Number number ? number.longValue() : null;
        return resourceOwnerAccessGuard.requireMappingAdminAccess(session, mappingId);
    }

    private static ResponseEntity<Map<String, Object>> failure(String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("message", message);
        return ResponseEntity.ok(response);
    }
}
