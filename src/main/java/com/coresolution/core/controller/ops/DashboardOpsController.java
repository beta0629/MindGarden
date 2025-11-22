package com.coresolution.core.controller.ops;

import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;
import com.coresolution.core.service.ops.DashboardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Ops 포털 대시보드 API 컨트롤러
 * 운영 포털 대시보드 메트릭 조회 API
 * 
 * 표준화 완료: BaseApiController 상속, ApiResponse 사용, GlobalExceptionHandler에 위임
 * 
 * @author CoreSolution
 * @version 2.0.0
 * @since 2025-01-XX
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/ops/dashboard")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('ADMIN') or hasRole('OPS')")
public class DashboardOpsController extends BaseApiController {
    
    private final DashboardService dashboardService;
    
    /**
     * 대시보드 메트릭 조회
     * GET /api/v1/ops/dashboard/metrics
     */
    @GetMapping("/metrics")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMetrics() {
        // 인증 정보 확인
        org.springframework.security.core.Authentication auth = 
            org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        
        if (auth != null) {
            log.info("대시보드 메트릭 조회 요청: principal={}, authorities={}", 
                auth.getPrincipal(), auth.getAuthorities());
        } else {
            log.warn("대시보드 메트릭 조회 요청: 인증 정보 없음");
        }
        
        Map<String, Object> metrics = dashboardService.getMetrics();
        return success(metrics);
    }
}

