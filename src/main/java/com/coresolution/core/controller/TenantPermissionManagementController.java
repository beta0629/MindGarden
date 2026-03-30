package com.coresolution.core.controller;

import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;
import com.coresolution.core.dto.RolePermissionRequest;
import com.coresolution.core.dto.RolePermissionResponse;
import com.coresolution.core.service.RolePermissionService;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.consultation.entity.User;
import com.coresolution.core.context.TenantContextHolder;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 테넌트별 권한 관리 컨트롤러
 * 테넌트 관리자가 역할별 권한을 동적으로 관리
 * 
 * 표준화 완료: BaseApiController 상속, ApiResponse 사용, GlobalExceptionHandler에 위임
 * 
 * @author CoreSolution
 * @version 2.0.0
 * @since 2025-01-XX
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/tenant/roles/{tenantRoleId}/permissions")
@RequiredArgsConstructor
public class TenantPermissionManagementController extends BaseApiController {
    
    private final RolePermissionService permissionService;
    
    /**
     * 역할별 권한 목록 조회
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<RolePermissionResponse>>> getPermissions(
            @PathVariable String tenantRoleId, HttpSession session) {
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null) {
            throw new IllegalArgumentException("테넌트 정보가 없습니다.");
        }
        
        List<RolePermissionResponse> permissions = permissionService.getPermissions(tenantId, tenantRoleId);
        return success(permissions);
    }
    
    /**
     * 권한 추가
     */
    @PostMapping
    public ResponseEntity<ApiResponse<RolePermissionResponse>> addPermission(
            @PathVariable String tenantRoleId,
            @RequestBody RolePermissionRequest request,
            HttpSession session) {
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null) {
            throw new IllegalArgumentException("테넌트 정보가 없습니다.");
        }
        
        User currentUser = SessionUtils.getCurrentUser(session);
        String grantedBy = currentUser != null && currentUser.getId() != null
                ? currentUser.getId().toString()
                : "system";
        
        RolePermissionResponse permission = permissionService.addPermission(
            tenantId, tenantRoleId, request, grantedBy);
        return created("권한이 추가되었습니다.", permission);
    }
    
    /**
     * 권한 수정
     */
    @PutMapping("/{permissionId}")
    public ResponseEntity<ApiResponse<RolePermissionResponse>> updatePermission(
            @PathVariable String tenantRoleId,
            @PathVariable Long permissionId,
            @RequestBody RolePermissionRequest request,
            HttpSession session) {
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null) {
            throw new IllegalArgumentException("테넌트 정보가 없습니다.");
        }
        
        User currentUser = SessionUtils.getCurrentUser(session);
        String updatedBy = currentUser != null && currentUser.getId() != null
                ? currentUser.getId().toString()
                : "system";
        
        RolePermissionResponse permission = permissionService.updatePermission(
            tenantId, permissionId, request, updatedBy);
        return updated("권한이 수정되었습니다.", permission);
    }
    
    /**
     * 권한 삭제
     */
    @DeleteMapping("/{permissionId}")
    public ResponseEntity<ApiResponse<Void>> removePermission(
            @PathVariable String tenantRoleId,
            @PathVariable Long permissionId,
            HttpSession session) {
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null) {
            throw new IllegalArgumentException("테넌트 정보가 없습니다.");
        }
        
        User currentUser = SessionUtils.getCurrentUser(session);
        String deletedBy = currentUser != null && currentUser.getId() != null
                ? currentUser.getId().toString()
                : "system";
        
        permissionService.removePermission(tenantId, permissionId, deletedBy);
        return deleted("권한이 삭제되었습니다.");
    }
}

