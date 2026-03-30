package com.coresolution.core.service;

import com.coresolution.core.dto.TenantRoleRequest;
import com.coresolution.core.dto.TenantRoleResponse;

import java.util.List;

/**
 * 테넌트 역할 서비스 인터페이스
 * 역할 동적 관리 (생성/수정/삭제)
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
public interface TenantRoleService {
    
    /**
     * 테넌트별 역할 목록 조회
     * 
     * @param tenantId 테넌트 ID
     * @return 역할 목록
     */
    List<TenantRoleResponse> getRolesByTenant(String tenantId);
    
    /**
     * 역할 상세 조회
     * 
     * @param tenantId 테넌트 ID
     * @param tenantRoleId 역할 ID
     * @return 역할 상세 정보
     */
    TenantRoleResponse getRole(String tenantId, String tenantRoleId);
    
    /**
     * 역할 생성 (템플릿 기반 또는 커스텀)
     * 
     * @param tenantId 테넌트 ID
     * @param request 역할 생성 요청
     * @param createdBy 생성자
     * @return 생성된 역할
     */
    TenantRoleResponse createRole(String tenantId, TenantRoleRequest request, String createdBy);
    
    /**
     * 역할 수정
     * 
     * @param tenantId 테넌트 ID
     * @param tenantRoleId 역할 ID
     * @param request 역할 수정 요청
     * @param updatedBy 수정자
     * @return 수정된 역할
     */
    TenantRoleResponse updateRole(String tenantId, String tenantRoleId, TenantRoleRequest request, String updatedBy);
    
    /**
     * 역할 삭제
     * 
     * @param tenantId 테넌트 ID
     * @param tenantRoleId 역할 ID
     * @param deletedBy 삭제자
     */
    void deleteRole(String tenantId, String tenantRoleId, String deletedBy);
    
    /**
     * 템플릿 기반 역할 생성
     * 
     * @param tenantId 테넌트 ID
     * @param roleTemplateId 역할 템플릿 ID
     * @param createdBy 생성자
     * @return 생성된 역할
     */
    TenantRoleResponse createRoleFromTemplate(String tenantId, String roleTemplateId, String createdBy);
}

