package com.coresolution.core.service;

import com.coresolution.core.dto.TenantDashboardRequest;
import com.coresolution.core.dto.TenantDashboardResponse;

import java.util.List;

/**
 * 테넌트 대시보드 서비스 인터페이스
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
public interface TenantDashboardService {
    
    /**
     * 테넌트별 대시보드 목록 조회
     * 
     * @param tenantId 테넌트 ID
     * @return 대시보드 목록
     */
    List<TenantDashboardResponse> getDashboardsByTenant(String tenantId);
    
    /**
     * 대시보드 상세 조회
     * 
     * @param tenantId 테넌트 ID
     * @param dashboardId 대시보드 ID
     * @return 대시보드 상세 정보
     */
    TenantDashboardResponse getDashboard(String tenantId, String dashboardId);
    
    /**
     * 대시보드 생성
     * 
     * @param tenantId 테넌트 ID
     * @param request 대시보드 생성 요청
     * @param createdBy 생성자
     * @return 생성된 대시보드
     */
    TenantDashboardResponse createDashboard(String tenantId, TenantDashboardRequest request, String createdBy);
    
    /**
     * 대시보드 수정 (이름 등)
     * 
     * @param tenantId 테넌트 ID
     * @param dashboardId 대시보드 ID
     * @param request 대시보드 수정 요청
     * @param updatedBy 수정자
     * @return 수정된 대시보드
     */
    TenantDashboardResponse updateDashboard(String tenantId, String dashboardId, TenantDashboardRequest request, String updatedBy);
    
    /**
     * 대시보드 삭제
     * 
     * @param tenantId 테넌트 ID
     * @param dashboardId 대시보드 ID
     * @param deletedBy 삭제자
     */
    void deleteDashboard(String tenantId, String dashboardId, String deletedBy);
    
    /**
     * 기본 대시보드 생성 (온보딩 시)
     * 
     * @param tenantId 테넌트 ID
     * @param businessType 업종
     * @param createdBy 생성자
     * @return 생성된 대시보드 목록
     */
    List<TenantDashboardResponse> createDefaultDashboards(String tenantId, String businessType, String createdBy);
    
    /**
     * 현재 사용자의 역할에 맞는 대시보드 조회
     * 
     * @param tenantId 테넌트 ID
     * @param tenantRoleId 역할 ID
     * @return 대시보드 정보 (없으면 null)
     */
    TenantDashboardResponse getDashboardByRole(String tenantId, String tenantRoleId);
}

