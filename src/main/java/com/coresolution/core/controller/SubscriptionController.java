package com.coresolution.core.controller;

import com.coresolution.core.controller.dto.billing.SubscriptionResponse;
import com.coresolution.core.dto.ApiResponse;
import com.coresolution.core.service.billing.SubscriptionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * 구독 조회 API 컨트롤러 (테넌트별)
 * 
 * 표준화 완료: BaseApiController 상속, ApiResponse 사용, GlobalExceptionHandler에 위임
 * 
 * @author CoreSolution
 * @version 2.0.0
 * @since 2025-01-XX
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/subscriptions")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SubscriptionController extends BaseApiController {
    
    private final SubscriptionService subscriptionService;
    
    /**
     * 테넌트별 구독 정보 조회
     * GET /api/v1/subscriptions/{tenantId}
     */
    @GetMapping("/{tenantId}")
    public ResponseEntity<ApiResponse<SubscriptionResponse>> getSubscriptionByTenant(
            @PathVariable String tenantId) {
        log.debug("구독 조회 요청: tenantId={}", tenantId);
        
        SubscriptionResponse response = subscriptionService.getSubscriptionByTenant(tenantId);
        
        log.debug("✅ 구독 조회 완료: tenantId={}", tenantId);
        return success(response);
    }
}

