package com.coresolution.core.controller;

import com.coresolution.core.dto.ApiResponse;
import com.coresolution.core.dto.TenantRoleRequest;
import com.coresolution.core.dto.TenantRoleResponse;
import com.coresolution.core.service.TenantRoleService;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.exception.EntityNotFoundException;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 테넌트 역할 관리 컨트롤러
 * 역할 동적 관리 API (생성/수정/삭제)
 * 
 * 표준화 완료: BaseApiController 상속, ApiResponse 사용, GlobalExceptionHandler에 위임
 * 
 * @author CoreSolution
 * @version 2.0.0
 * @since 2025-01-XX
 */
@Slf4j
@RestController
@RequestMapping("/api/tenants/{tenantId}/roles")
@RequiredArgsConstructor
public class TenantRoleController extends BaseApiController {
    
    private final TenantRoleService tenantRoleService;
    
    /**
     * 역할 목록 조회
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<TenantRoleResponse>>> getRoles(@PathVariable String tenantId) {
        log.info("🔍 역할 목록 조회 요청: tenantId={}", tenantId);
        
        List<TenantRoleResponse> roles = tenantRoleService.getRolesByTenant(tenantId);
        log.info("✅ 역할 목록 조회 완료: tenantId={}, count={}", tenantId, roles.size());
        
        return success(roles);
    }
    
    /**
     * 역할 상세 조회
     */
    @GetMapping("/{tenantRoleId}")
    public ResponseEntity<ApiResponse<TenantRoleResponse>> getRole(
            @PathVariable String tenantId,
            @PathVariable String tenantRoleId) {
        log.info("🔍 역할 상세 조회 요청: tenantId={}, tenantRoleId={}", tenantId, tenantRoleId);
        
        TenantRoleResponse role = tenantRoleService.getRole(tenantId, tenantRoleId);
        if (role == null) {
            throw new EntityNotFoundException("역할을 찾을 수 없습니다: " + tenantRoleId);
        }
        
        log.info("✅ 역할 상세 조회 완료: tenantId={}, tenantRoleId={}", tenantId, tenantRoleId);
        return success(role);
    }
    
    /**
     * 역할 생성 (템플릿 기반 또는 커스텀)
     */
    @PostMapping
    public ResponseEntity<ApiResponse<TenantRoleResponse>> createRole(
            @PathVariable String tenantId,
            @RequestBody TenantRoleRequest request,
            HttpSession session) {
        log.info("🔧 역할 생성 요청: tenantId={}, name={}", tenantId, request.getNameKo());
        
        User currentUser = SessionUtils.getCurrentUser(session);
        String createdBy = currentUser != null && currentUser.getId() != null
                ? currentUser.getId().toString()
                : "system";
        
        TenantRoleResponse role = tenantRoleService.createRole(tenantId, request, createdBy);
        log.info("✅ 역할 생성 완료: tenantId={}, tenantRoleId={}, name={}", tenantId, role.getTenantRoleId(), role.getNameKo());
        
        return created("역할이 생성되었습니다.", role);
    }
    
    /**
     * 템플릿 기반 역할 생성
     */
    @PostMapping("/from-template/{roleTemplateId}")
    public ResponseEntity<ApiResponse<TenantRoleResponse>> createRoleFromTemplate(
            @PathVariable String tenantId,
            @PathVariable String roleTemplateId,
            HttpSession session) {
        log.info("🔧 템플릿 기반 역할 생성 요청: tenantId={}, roleTemplateId={}", tenantId, roleTemplateId);
        
        User currentUser = SessionUtils.getCurrentUser(session);
        String createdBy = currentUser != null && currentUser.getId() != null
                ? currentUser.getId().toString()
                : "system";
        
        TenantRoleResponse role = tenantRoleService.createRoleFromTemplate(tenantId, roleTemplateId, createdBy);
        log.info("✅ 템플릿 기반 역할 생성 완료: tenantId={}, tenantRoleId={}, name={}", tenantId, role.getTenantRoleId(), role.getNameKo());
        
        return created("템플릿 기반 역할이 생성되었습니다.", role);
    }
    
    /**
     * 역할 수정
     */
    @PutMapping("/{tenantRoleId}")
    public ResponseEntity<ApiResponse<TenantRoleResponse>> updateRole(
            @PathVariable String tenantId,
            @PathVariable String tenantRoleId,
            @RequestBody TenantRoleRequest request,
            HttpSession session) {
        log.info("🔧 역할 수정 요청: tenantId={}, tenantRoleId={}", tenantId, tenantRoleId);
        
        User currentUser = SessionUtils.getCurrentUser(session);
        String updatedBy = currentUser != null && currentUser.getId() != null
                ? currentUser.getId().toString()
                : "system";
        
        TenantRoleResponse role = tenantRoleService.updateRole(tenantId, tenantRoleId, request, updatedBy);
        log.info("✅ 역할 수정 완료: tenantId={}, tenantRoleId={}", tenantId, tenantRoleId);
        
        return updated("역할이 수정되었습니다.", role);
    }
    
    /**
     * 역할 삭제
     */
    @DeleteMapping("/{tenantRoleId}")
    public ResponseEntity<ApiResponse<Void>> deleteRole(
            @PathVariable String tenantId,
            @PathVariable String tenantRoleId,
            HttpSession session) {
        log.info("🗑️ 역할 삭제 요청: tenantId={}, tenantRoleId={}", tenantId, tenantRoleId);
        
        User currentUser = SessionUtils.getCurrentUser(session);
        String deletedBy = currentUser != null && currentUser.getId() != null
                ? currentUser.getId().toString()
                : "system";
        
        tenantRoleService.deleteRole(tenantId, tenantRoleId, deletedBy);
        log.info("✅ 역할 삭제 완료: tenantId={}, tenantRoleId={}", tenantId, tenantRoleId);
        
        return deleted("역할이 삭제되었습니다.");
    }
}

