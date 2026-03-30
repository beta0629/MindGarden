package com.coresolution.core.repository;

import com.coresolution.core.domain.TenantDashboard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 테넌트 대시보드 Repository
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Repository
public interface TenantDashboardRepository extends JpaRepository<TenantDashboard, Long> {
    
    /**
     * dashboard_id로 조회
     */
    Optional<TenantDashboard> findByDashboardIdAndIsDeletedFalse(String dashboardId);
    
    /**
     * tenant_id로 모든 대시보드 조회
     */
    @Query("SELECT td FROM TenantDashboard td WHERE td.tenantId = ?1 AND td.isDeleted = false ORDER BY td.displayOrder ASC, td.dashboardNameKo ASC")
    List<TenantDashboard> findByTenantIdAndIsDeletedFalse(String tenantId);
    
    /**
     * tenant_id로 활성 대시보드만 조회
     */
    @Query("SELECT td FROM TenantDashboard td WHERE td.tenantId = ?1 AND td.isActive = true AND td.isDeleted = false ORDER BY td.displayOrder ASC")
    List<TenantDashboard> findActiveByTenantId(String tenantId);
    
    /**
     * tenant_id와 tenant_role_id로 조회
     */
    @Query("SELECT td FROM TenantDashboard td WHERE td.tenantId = ?1 AND td.tenantRoleId = ?2 AND td.isDeleted = false")
    Optional<TenantDashboard> findByTenantIdAndTenantRoleId(String tenantId, String tenantRoleId);
    
    /**
     * tenant_id와 dashboard_type으로 조회
     */
    @Query("SELECT td FROM TenantDashboard td WHERE td.tenantId = ?1 AND td.dashboardType = ?2 AND td.isDeleted = false")
    List<TenantDashboard> findByTenantIdAndDashboardType(String tenantId, String dashboardType);
}

