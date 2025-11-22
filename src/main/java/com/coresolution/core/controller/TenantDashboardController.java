package com.coresolution.core.controller;

import com.coresolution.core.dto.ApiResponse;
import com.coresolution.core.dto.TenantDashboardRequest;
import com.coresolution.core.dto.TenantDashboardResponse;
import com.coresolution.core.service.TenantDashboardService;
import com.coresolution.core.service.UserRoleQueryService;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.consultation.util.AdminRoleUtils;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.exception.EntityNotFoundException;
import com.coresolution.core.context.TenantContextHolder;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 테넌트 대시보드 관리 컨트롤러
 * 테넌트 관리자가 역할별 대시보드를 동적으로 관리
 * 
 * 표준화 완료: BaseApiController 상속, ApiResponse 사용, GlobalExceptionHandler에 위임
 * 
 * @author CoreSolution
 * @version 2.0.0
 * @since 2025-01-XX
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/tenant/dashboards")
@RequiredArgsConstructor
public class TenantDashboardController extends BaseApiController {
    
    private final TenantDashboardService dashboardService;
    private final UserRoleQueryService userRoleQueryService;
    
    /**
     * 대시보드 목록 조회
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<TenantDashboardResponse>>> getDashboards(HttpSession session) {
        log.info("🔍 대시보드 목록 조회 요청");
        
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null) {
            throw new IllegalArgumentException("테넌트 정보가 없습니다.");
        }
        
        List<TenantDashboardResponse> dashboards = dashboardService.getDashboardsByTenant(tenantId);
        log.info("✅ 대시보드 목록 조회 완료: tenantId={}, count={}", tenantId, dashboards.size());
        
        return success(dashboards);
    }
    
    /**
     * 대시보드 상세 조회
     */
    @GetMapping("/{dashboardId}")
    public ResponseEntity<ApiResponse<TenantDashboardResponse>> getDashboard(
            @PathVariable String dashboardId, 
            HttpSession session) {
        log.info("🔍 대시보드 상세 조회 요청: dashboardId={}", dashboardId);
        
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null) {
            throw new IllegalArgumentException("테넌트 정보가 없습니다.");
        }
        
        TenantDashboardResponse dashboard = dashboardService.getDashboard(tenantId, dashboardId);
        if (dashboard == null) {
            throw new EntityNotFoundException("대시보드를 찾을 수 없습니다: " + dashboardId);
        }
        
        log.info("✅ 대시보드 상세 조회 완료: dashboardId={}", dashboardId);
        return success(dashboard);
    }
    
    /**
     * 대시보드 생성
     */
    @PostMapping
    public ResponseEntity<ApiResponse<TenantDashboardResponse>> createDashboard(
            @RequestBody TenantDashboardRequest request, 
            HttpSession session) {
        log.info("🔧 대시보드 생성 요청: dashboardName={}", request.getDashboardName());
        
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null) {
            throw new IllegalArgumentException("테넌트 정보가 없습니다.");
        }
        
        User currentUser = SessionUtils.getCurrentUser(session);
        String createdBy = currentUser != null && currentUser.getId() != null
                ? currentUser.getId().toString()
                : "system";
        
        TenantDashboardResponse dashboard = dashboardService.createDashboard(tenantId, request, createdBy);
        log.info("✅ 대시보드 생성 완료: dashboardId={}, dashboardName={}", 
                dashboard.getDashboardId(), dashboard.getDashboardName());
        
        return created("대시보드가 생성되었습니다.", dashboard);
    }
    
    /**
     * 대시보드 수정 (이름 등)
     */
    @PutMapping("/{dashboardId}")
    public ResponseEntity<ApiResponse<TenantDashboardResponse>> updateDashboard(
            @PathVariable String dashboardId,
            @RequestBody TenantDashboardRequest request,
            HttpSession session) {
        log.info("🔧 대시보드 수정 요청: dashboardId={}", dashboardId);
        
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null) {
            throw new IllegalArgumentException("테넌트 정보가 없습니다.");
        }
        
        User currentUser = SessionUtils.getCurrentUser(session);
        String updatedBy = currentUser != null && currentUser.getId() != null
                ? currentUser.getId().toString()
                : "system";
        
        TenantDashboardResponse dashboard = dashboardService.updateDashboard(tenantId, dashboardId, request, updatedBy);
        log.info("✅ 대시보드 수정 완료: dashboardId={}", dashboardId);
        
        return updated("대시보드가 수정되었습니다.", dashboard);
    }
    
    /**
     * 현재 사용자의 역할에 맞는 대시보드 조회
     * 역할이나 대시보드가 없을 경우 404를 반환하되, 프론트엔드에서 조용히 처리할 수 있도록 함
     * 관리자 역할이 UserRoleAssignment에 없을 경우 User의 role 필드를 확인하여 폴백 처리
     */
    @GetMapping("/current")
    public ResponseEntity<ApiResponse<TenantDashboardResponse>> getCurrentUserDashboard(HttpSession session) {
        log.info("🔍 현재 사용자 대시보드 조회 요청");
        
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null) {
            throw new IllegalArgumentException("테넌트 정보가 없습니다.");
        }
        
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            throw new IllegalArgumentException("로그인이 필요합니다.");
        }
        
        // 사용자의 현재 역할 조회 (UserRoleAssignment 기반)
        java.util.Optional<com.coresolution.core.domain.UserRoleAssignment> primaryRole = 
            userRoleQueryService.getPrimaryRole(currentUser, tenantId);
        
        if (primaryRole.isEmpty()) {
            // UserRoleAssignment에 역할이 없는 경우, User의 role 필드를 확인
            if (currentUser.getRole() != null && AdminRoleUtils.isAdmin(currentUser)) {
                log.info("⚠️ UserRoleAssignment에 역할이 없지만 User.role이 관리자임: userId={}, role={}, tenantId={}", 
                        currentUser.getId(), currentUser.getRole(), tenantId);
                // 관리자인 경우 기본 관리자 대시보드를 찾거나 null 반환 (프론트엔드에서 레거시 라우팅으로 처리)
                // 여기서는 404를 반환하여 프론트엔드에서 레거시 라우팅으로 폴백하도록 함
                throw new EntityNotFoundException("활성 역할을 찾을 수 없습니다. 관리자 역할이 UserRoleAssignment에 등록되지 않았을 수 있습니다.");
            }
            log.warn("⚠️ 활성 역할을 찾을 수 없음: userId={}, tenantId={}, userRole={}", 
                    currentUser.getId(), tenantId, currentUser.getRole());
            throw new EntityNotFoundException("활성 역할을 찾을 수 없습니다.");
        }
        
        String tenantRoleId = primaryRole.get().getTenantRoleId();
        TenantDashboardResponse dashboard = dashboardService.getDashboardByRole(tenantId, tenantRoleId);
        
        if (dashboard == null) {
            log.warn("⚠️ 대시보드를 찾을 수 없음: tenantId={}, tenantRoleId={}", 
                    tenantId, tenantRoleId);
            throw new EntityNotFoundException("대시보드를 찾을 수 없습니다.");
        }
        
        log.info("✅ 현재 사용자 대시보드 조회 완료: dashboardId={}", dashboard.getDashboardId());
        return success(dashboard);
    }
    
    /**
     * 역할별 대시보드 조회
     */
    @GetMapping("/by-role/{tenantRoleId}")
    public ResponseEntity<ApiResponse<TenantDashboardResponse>> getDashboardByRole(
            @PathVariable String tenantRoleId, 
            HttpSession session) {
        log.info("🔍 역할별 대시보드 조회 요청: tenantRoleId={}", tenantRoleId);
        
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null) {
            throw new IllegalArgumentException("테넌트 정보가 없습니다.");
        }
        
        TenantDashboardResponse dashboard = dashboardService.getDashboardByRole(tenantId, tenantRoleId);
        
        if (dashboard == null) {
            throw new EntityNotFoundException("대시보드를 찾을 수 없습니다: tenantRoleId=" + tenantRoleId);
        }
        
        log.info("✅ 역할별 대시보드 조회 완료: tenantRoleId={}, dashboardId={}", 
                tenantRoleId, dashboard.getDashboardId());
        return success(dashboard);
    }
    
    /**
     * 대시보드 삭제
     */
    @DeleteMapping("/{dashboardId}")
    public ResponseEntity<ApiResponse<Void>> deleteDashboard(
            @PathVariable String dashboardId, 
            HttpSession session) {
        log.info("🗑️ 대시보드 삭제 요청: dashboardId={}", dashboardId);
        
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null) {
            throw new IllegalArgumentException("테넌트 정보가 없습니다.");
        }
        
        User currentUser = SessionUtils.getCurrentUser(session);
        String deletedBy = currentUser != null && currentUser.getId() != null
                ? currentUser.getId().toString()
                : "system";
        
        dashboardService.deleteDashboard(tenantId, dashboardId, deletedBy);
        log.info("✅ 대시보드 삭제 완료: dashboardId={}", dashboardId);
        
        return deleted("대시보드가 삭제되었습니다.");
    }
}

