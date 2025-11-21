package com.coresolution.core.controller;

import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;
import com.coresolution.core.dto.TenantRoleRequest;
import com.coresolution.core.dto.TenantRoleResponse;
import com.coresolution.core.service.TenantRoleService;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.consultation.entity.User;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.consultation.exception.EntityNotFoundException;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 테넌트별 역할 관리 컨트롤러
 * 테넌트 관리자가 자신의 테넌트에서 역할을 동적으로 관리
 * 
 * 표준화 완료: BaseApiController 상속, ApiResponse 사용, GlobalExceptionHandler에 위임
 * 
 * @author CoreSolution
 * @version 2.0.0
 * @since 2025-01-XX
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/tenant/roles")
@RequiredArgsConstructor
public class TenantRoleManagementController extends BaseApiController {
    
    private final TenantRoleService tenantRoleService;
    
    /**
     * 현재 테넌트의 역할 목록 조회
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<TenantRoleResponse>>> getRoles(HttpSession session) {
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null) {
            throw new IllegalArgumentException("테넌트 정보가 없습니다.");
        }
        
        List<TenantRoleResponse> roles = tenantRoleService.getRolesByTenant(tenantId);
        return success(roles);
    }
    
    /**
     * 역할 상세 조회
     */
    @GetMapping("/{tenantRoleId}")
    public ResponseEntity<ApiResponse<TenantRoleResponse>> getRole(
            @PathVariable String tenantRoleId, HttpSession session) {
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null) {
            throw new IllegalArgumentException("테넌트 정보가 없습니다.");
        }
        
        TenantRoleResponse role = tenantRoleService.getRole(tenantId, tenantRoleId);
        if (role == null) {
            throw new EntityNotFoundException("역할을 찾을 수 없습니다: " + tenantRoleId);
        }
        return success(role);
    }
    
    /**
     * 역할 생성
     */
    @PostMapping
    public ResponseEntity<ApiResponse<TenantRoleResponse>> createRole(
            @RequestBody TenantRoleRequest request, HttpSession session) {
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null) {
            throw new IllegalArgumentException("테넌트 정보가 없습니다.");
        }
        
        User currentUser = SessionUtils.getCurrentUser(session);
        String createdBy = currentUser != null && currentUser.getId() != null
                ? currentUser.getId().toString()
                : "system";
        
        TenantRoleResponse role = tenantRoleService.createRole(tenantId, request, createdBy);
        return created("역할이 생성되었습니다.", role);
    }
    
    /**
     * 템플릿 기반 역할 생성
     */
    @PostMapping("/from-template/{roleTemplateId}")
    public ResponseEntity<ApiResponse<TenantRoleResponse>> createRoleFromTemplate(
            @PathVariable String roleTemplateId,
            HttpSession session) {
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null) {
            throw new IllegalArgumentException("테넌트 정보가 없습니다.");
        }
        
        User currentUser = SessionUtils.getCurrentUser(session);
        String createdBy = currentUser != null && currentUser.getId() != null
                ? currentUser.getId().toString()
                : "system";
        
        TenantRoleResponse role = tenantRoleService.createRoleFromTemplate(tenantId, roleTemplateId, createdBy);
        return created("템플릿 기반 역할이 생성되었습니다.", role);
    }
    
    /**
     * 역할 수정
     */
    @PutMapping("/{tenantRoleId}")
    public ResponseEntity<ApiResponse<TenantRoleResponse>> updateRole(
            @PathVariable String tenantRoleId,
            @RequestBody TenantRoleRequest request,
            HttpSession session) {
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null) {
            throw new IllegalArgumentException("테넌트 정보가 없습니다.");
        }
        
        User currentUser = SessionUtils.getCurrentUser(session);
        String updatedBy = currentUser != null && currentUser.getId() != null
                ? currentUser.getId().toString()
                : "system";
        
        TenantRoleResponse role = tenantRoleService.updateRole(tenantId, tenantRoleId, request, updatedBy);
        return updated("역할이 수정되었습니다.", role);
    }
    
    /**
     * 역할 삭제
     */
    @DeleteMapping("/{tenantRoleId}")
    public ResponseEntity<ApiResponse<Void>> deleteRole(@PathVariable String tenantRoleId, HttpSession session) {
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null) {
            throw new IllegalArgumentException("테넌트 정보가 없습니다.");
        }
        
        User currentUser = SessionUtils.getCurrentUser(session);
        String deletedBy = currentUser != null && currentUser.getId() != null
                ? currentUser.getId().toString()
                : "system";
        
        tenantRoleService.deleteRole(tenantId, tenantRoleId, deletedBy);
        return deleted("역할이 삭제되었습니다.");
    }
}

