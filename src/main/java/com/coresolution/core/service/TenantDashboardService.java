package com.coresolution.core.service;

import java.util.List;
import com.coresolution.core.dto.TenantDashboardRequest;
import com.coresolution.core.dto.TenantDashboardResponse;

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
     * @param dashboardTemplates 선택된 대시보드 템플릿 (역할명 -> 템플릿 ID 매핑, 선택적)
     * @param dashboardWidgets 역할별 위젯 목록 (선택적, 템플릿 수정 시 사용)
     * @return 생성된 대시보드 목록
     */
    List<TenantDashboardResponse> createDefaultDashboards(String tenantId, String businessType, String createdBy, java.util.Map<String, String> dashboardTemplates, java.util.Map<String, java.util.List<String>> dashboardWidgets);
    
    /**
     * 기본 대시보드 생성 (온보딩 시) - 오버로드 (하위 호환성)
     * 
     * @param tenantId 테넌트 ID
     * @param businessType 업종
     * @param createdBy 생성자
     * @return 생성된 대시보드 목록
     */
    default List<TenantDashboardResponse> createDefaultDashboards(String tenantId, String businessType, String createdBy) {
        return createDefaultDashboards(tenantId, businessType, createdBy, null, null);
    }
    
    default List<TenantDashboardResponse> createDefaultDashboards(String tenantId, String businessType, String createdBy, java.util.Map<String, String> dashboardTemplates) {
        return createDefaultDashboards(tenantId, businessType, createdBy, dashboardTemplates, null);
    }
    
    /**
     * 현재 사용자의 역할에 맞는 대시보드 조회
     * 
     * @param tenantId 테넌트 ID
     * @param tenantRoleId 역할 ID
     * @return 대시보드 정보 (없으면 null)
     */
    TenantDashboardResponse getDashboardByRole(String tenantId, String tenantRoleId);
}

