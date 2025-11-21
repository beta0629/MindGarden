package com.coresolution.core.controller.ops;

import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.controller.dto.ops.PricingPlanCreateRequest;
import com.coresolution.core.controller.dto.ops.PricingPlanUpdateRequest;
import com.coresolution.core.domain.PricingPlan;
import com.coresolution.core.dto.ApiResponse;
import com.coresolution.core.service.ops.PricingPlanService;
import com.coresolution.consultation.exception.EntityNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Ops 포털 요금제 관리 API 컨트롤러
 * 요금제 CRUD 및 관리 API
 * 
 * 표준화 완료: BaseApiController 상속, ApiResponse 사용, GlobalExceptionHandler에 위임
 * 
 * @author CoreSolution
 * @version 2.0.0
 * @since 2025-01-XX
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/ops/plans")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PricingPlanOpsController extends BaseApiController {
    
    private final PricingPlanService pricingPlanService;
    
    /**
     * 모든 요금제 목록 조회
     * GET /api/v1/ops/plans
     * Trinity 직원만 접근 가능
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('OPS')")
    public ResponseEntity<ApiResponse<List<PricingPlan>>> getPlans() {
        log.debug("모든 요금제 목록 조회");
        List<PricingPlan> plans = pricingPlanService.findAllPlans();
        return success(plans);
    }
    
    /**
     * 활성화된 요금제 목록 조회
     * GET /api/v1/ops/plans/active
     * 공개 엔드포인트 - 입점사가 온보딩 신청 시 요금제 선택을 위해 필요
     */
    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<PricingPlan>>> getActivePlans() {
        log.debug("활성화된 요금제 목록 조회");
        List<PricingPlan> plans = pricingPlanService.findAllActivePlans();
        return success(plans);
    }
    
    /**
     * plan_code로 요금제 조회
     * GET /api/v1/ops/plans/code/{planCode}
     * 공개 엔드포인트 - 입점사가 온보딩 신청 시 요금제 조회를 위해 필요
     */
    @GetMapping("/code/{planCode}")
    public ResponseEntity<ApiResponse<PricingPlan>> getPlanByCode(@PathVariable String planCode) {
        log.debug("요금제 조회: planCode={}", planCode);
        PricingPlan plan = pricingPlanService.findByPlanCode(planCode)
            .orElseThrow(() -> new EntityNotFoundException("요금제를 찾을 수 없습니다: " + planCode));
        return success(plan);
    }
    
    /**
     * plan_id로 요금제 조회
     * GET /api/v1/ops/plans/{planId}
     * 공개 엔드포인트 - 입점사가 온보딩 신청 시 요금제 조회를 위해 필요
     */
    @GetMapping("/{planId}")
    public ResponseEntity<ApiResponse<PricingPlan>> getPlanById(@PathVariable String planId) {
        log.debug("요금제 조회: planId={}", planId);
        PricingPlan plan = pricingPlanService.findByPlanId(planId)
            .orElseThrow(() -> new EntityNotFoundException("요금제를 찾을 수 없습니다: " + planId));
        return success(plan);
    }
    
    /**
     * 모든 애드온 목록 조회
     * GET /api/v1/ops/plans/addons
     * Trinity 직원만 접근 가능
     * TODO: PricingAddon 엔티티 구현 후 실제 데이터 반환하도록 수정 필요
     */
    @GetMapping("/addons")
    @PreAuthorize("hasRole('ADMIN') or hasRole('OPS')")
    public ResponseEntity<ApiResponse<List<?>>> getAddons() {
        log.debug("모든 애드온 목록 조회 (임시: 빈 배열 반환)");
        // TODO: PricingAddon 엔티티 및 서비스 구현 후 실제 데이터 반환
        return success(List.of());
    }
    
    /**
     * 요금제 생성
     * POST /api/v1/ops/plans
     * Trinity 직원만 접근 가능
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('OPS')")
    public ResponseEntity<ApiResponse<PricingPlan>> createPlan(
            @RequestBody @Valid PricingPlanCreateRequest request,
            Authentication authentication) {
        log.info("요금제 생성 요청: planCode={}, displayName={}", request.planCode(), request.displayName());
        
        String createdBy = authentication != null && authentication.getName() != null 
            ? authentication.getName() 
            : "SYSTEM";
        
        PricingPlan created = pricingPlanService.createPlan(request, createdBy);
        return created("요금제가 생성되었습니다.", created);
    }
    
    /**
     * 요금제 수정
     * PUT /api/v1/ops/plans/{planId}
     * Trinity 직원만 접근 가능
     */
    @PutMapping("/{planId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('OPS')")
    public ResponseEntity<ApiResponse<PricingPlan>> updatePlan(
            @PathVariable String planId,
            @RequestBody @Valid PricingPlanUpdateRequest request,
            Authentication authentication) {
        log.info("요금제 수정 요청: planId={}", planId);
        
        String updatedBy = authentication != null && authentication.getName() != null 
            ? authentication.getName() 
            : "SYSTEM";
        
        PricingPlan updated = pricingPlanService.updatePlan(planId, request, updatedBy);
        return updated("요금제가 수정되었습니다.", updated);
    }
    
    /**
     * 요금제 비활성화
     * DELETE /api/v1/ops/plans/{planId}
     * Trinity 직원만 접근 가능
     */
    @DeleteMapping("/{planId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('OPS')")
    public ResponseEntity<ApiResponse<Void>> deactivatePlan(
            @PathVariable String planId,
            Authentication authentication) {
        log.info("요금제 비활성화 요청: planId={}", planId);
        
        String deletedBy = authentication != null && authentication.getName() != null 
            ? authentication.getName() 
            : "SYSTEM";
        
        pricingPlanService.deactivatePlan(planId, deletedBy);
        return success("요금제가 비활성화되었습니다.");
    }
}

