package com.coresolution.consultation.controller;

import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;
import com.coresolution.core.domain.Tenant;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.MultiTenantUserService;
import com.coresolution.consultation.utils.SessionUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 멀티 테넌트 사용자 컨트롤러
 * Phase 3: 멀티 테넌트 사용자 지원 API
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Slf4j
@RestController
@RequestMapping("/api/auth/tenant")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class MultiTenantController extends BaseApiController {
    
    private final MultiTenantUserService multiTenantUserService;
    
    /**
     * 사용자가 접근 가능한 모든 테넌트 목록 조회
     * GET /api/auth/tenant/accessible
     */
    @GetMapping("/accessible")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAccessibleTenants(HttpSession session) {
        User user = SessionUtils.getCurrentUser(session);
        if (user == null) {
            throw new org.springframework.security.access.AccessDeniedException("로그인이 필요합니다.");
        }
        
        List<Tenant> tenants = multiTenantUserService.getAccessibleTenants(user.getId());
        
        List<Map<String, Object>> tenantList = tenants.stream()
            .map(tenant -> {
                Map<String, Object> tenantMap = new HashMap<>();
                tenantMap.put("tenantId", tenant.getTenantId());
                tenantMap.put("name", tenant.getName());
                tenantMap.put("businessType", tenant.getBusinessType());
                tenantMap.put("status", tenant.getStatus() != null ? tenant.getStatus().name() : null);
                return tenantMap;
            })
            .collect(Collectors.toList());
        
        Map<String, Object> data = new HashMap<>();
        data.put("tenants", tenantList);
        data.put("isMultiTenant", tenants.size() > 1);
        data.put("count", tenants.size());
        
        return success(data);
    }
    
    /**
     * 멀티 테넌트 사용자 여부 확인
     * GET /api/auth/tenant/check-multi
     */
    @GetMapping("/check-multi")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkMultiTenantUser(HttpSession session) {
        User user = SessionUtils.getCurrentUser(session);
        
        // 로그인하지 않은 사용자에 대해서는 빈 데이터 반환 (403 오류 방지)
        if (user == null) {
            log.debug("멀티 테넌트 확인: 로그인하지 않은 사용자");
            Map<String, Object> data = new HashMap<>();
            data.put("isMultiTenant", false);
            data.put("isAuthenticated", false);
            return success(data);
        }
        
        boolean isMultiTenant = multiTenantUserService.isMultiTenantUser(user.getId());
        
        Map<String, Object> data = new HashMap<>();
        data.put("isMultiTenant", isMultiTenant);
        data.put("isAuthenticated", true);
        
        return success(data);
    }
    
    /**
     * 테넌트 전환
     * POST /api/auth/tenant/switch
     * 
     * @param request 테넌트 전환 요청 (tenantId 포함)
     */
    @PostMapping("/switch")
    public ResponseEntity<ApiResponse<Map<String, Object>>> switchTenant(
            @RequestBody Map<String, String> request,
            HttpSession session,
            HttpServletRequest httpRequest) {
        User user = SessionUtils.getCurrentUser(session);
        if (user == null) {
            throw new org.springframework.security.access.AccessDeniedException("로그인이 필요합니다.");
        }
        
        String tenantId = request.get("tenantId");
        if (tenantId == null || tenantId.isEmpty()) {
            throw new IllegalArgumentException("tenantId가 필요합니다.");
        }
        
        // 테넌트 접근 권한 확인 (이메일 기반으로 명확하게 확인)
        // 로그인 이메일과 테넌트별 권한을 명확하게 연결
        String userEmail = user.getEmail();
        if (userEmail == null || userEmail.trim().isEmpty()) {
            log.warn("사용자 이메일이 없어 테넌트 접근 권한 확인 불가: userId={}, tenantId={}", 
                user.getId(), tenantId);
            throw new org.springframework.security.access.AccessDeniedException("사용자 이메일 정보가 없어 테넌트 접근 권한을 확인할 수 없습니다.");
        }
        
        boolean hasAccess = multiTenantUserService.hasAccessToTenantByEmail(userEmail, tenantId);
        if (!hasAccess) {
            log.warn("테넌트 접근 권한 없음: email={}, tenantId={}", userEmail, tenantId);
            throw new org.springframework.security.access.AccessDeniedException("해당 테넌트에 접근할 수 없습니다. 로그인 이메일(" + userEmail + ")로 해당 테넌트에 접근 권한이 없습니다.");
        }
        
        log.info("✅ 테넌트 접근 권한 확인 완료: email={}, tenantId={}", userEmail, tenantId);
        
        // 세션에 테넌트 ID 저장
        session.setAttribute("tenantId", tenantId);
        
        // TenantContextHolder에 설정 (다음 요청부터 적용)
        com.coresolution.core.context.TenantContextHolder.setTenantId(tenantId);
        
        log.info("✅ 테넌트 전환 성공: userId={}, tenantId={}", user.getId(), tenantId);
        
        Map<String, Object> data = new HashMap<>();
        data.put("message", "테넌트가 전환되었습니다.");
        data.put("tenantId", tenantId);
        
        return success(data);
    }
    
    /**
     * 현재 테넌트 조회
     * GET /api/auth/tenant/current
     */
    @GetMapping("/current")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getCurrentTenant(HttpSession session) {
        User user = SessionUtils.getCurrentUser(session);
        if (user == null) {
            throw new org.springframework.security.access.AccessDeniedException("로그인이 필요합니다.");
        }
        
        Tenant currentTenant = multiTenantUserService.getCurrentTenant(user);
        
        Map<String, Object> data = new HashMap<>();
        if (currentTenant == null) {
            data.put("tenant", null);
            data.put("message", "현재 테넌트가 없습니다.");
        } else {
            Map<String, Object> tenantMap = new HashMap<>();
            tenantMap.put("tenantId", currentTenant.getTenantId());
            tenantMap.put("name", currentTenant.getName());
            tenantMap.put("businessType", currentTenant.getBusinessType());
            tenantMap.put("status", currentTenant.getStatus() != null ? currentTenant.getStatus().name() : null);
            data.put("tenant", tenantMap);
        }
        
        return success(data);
    }
    
    /**
     * 기본 테넌트 조회
     * GET /api/auth/tenant/default
     */
    @GetMapping("/default")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDefaultTenant(HttpSession session) {
        User user = SessionUtils.getCurrentUser(session);
        if (user == null) {
            throw new org.springframework.security.access.AccessDeniedException("로그인이 필요합니다.");
        }
        
        Tenant defaultTenant = multiTenantUserService.getDefaultTenant(user.getId());
        
        Map<String, Object> data = new HashMap<>();
        if (defaultTenant == null) {
            data.put("tenant", null);
            data.put("message", "기본 테넌트가 없습니다.");
        } else {
            Map<String, Object> tenantMap = new HashMap<>();
            tenantMap.put("tenantId", defaultTenant.getTenantId());
            tenantMap.put("name", defaultTenant.getName());
            tenantMap.put("businessType", defaultTenant.getBusinessType());
            tenantMap.put("status", defaultTenant.getStatus() != null ? defaultTenant.getStatus().name() : null);
            data.put("tenant", tenantMap);
        }
        
        return success(data);
    }
}

