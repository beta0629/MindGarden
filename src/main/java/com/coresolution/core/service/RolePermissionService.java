package com.coresolution.core.service;

import com.coresolution.core.dto.RolePermissionRequest;
import com.coresolution.core.dto.RolePermissionResponse;

import java.util.List;

/**
 * 역할 권한 관리 서비스 인터페이스
 * 테넌트별 역할에 대한 권한 동적 관리
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
public interface RolePermissionService {
    
    /**
     * 역할별 권한 목록 조회
     * 
     * @param tenantId 테넌트 ID
     * @param tenantRoleId 역할 ID
     * @return 권한 목록
     */
    List<RolePermissionResponse> getPermissions(String tenantId, String tenantRoleId);
    
    /**
     * 권한 추가
     * 
     * @param tenantId 테넌트 ID
     * @param tenantRoleId 역할 ID
     * @param request 권한 요청
     * @param grantedBy 부여자
     * @return 추가된 권한
     */
    RolePermissionResponse addPermission(String tenantId, String tenantRoleId, 
                                        RolePermissionRequest request, String grantedBy);
    
    /**
     * 권한 수정
     * 
     * @param tenantId 테넌트 ID
     * @param permissionId 권한 ID
     * @param request 권한 요청
     * @param updatedBy 수정자
     * @return 수정된 권한
     */
    RolePermissionResponse updatePermission(String tenantId, Long permissionId, 
                                           RolePermissionRequest request, String updatedBy);
    
    /**
     * 권한 삭제
     * 
     * @param tenantId 테넌트 ID
     * @param permissionId 권한 ID
     * @param deletedBy 삭제자
     */
    void removePermission(String tenantId, Long permissionId, String deletedBy);
}

