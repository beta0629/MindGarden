package com.coresolution.core.repository;

import com.coresolution.core.domain.TenantRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 테넌트 역할 Repository
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Repository
public interface TenantRoleRepository extends JpaRepository<TenantRole, Long> {
    
    /**
     * tenant_role_id로 조회
     */
    Optional<TenantRole> findByTenantRoleIdAndIsDeletedFalse(String tenantRoleId);
    
    /**
     * tenant_id로 모든 역할 조회
     */
    @Query("SELECT tr FROM TenantRole tr WHERE tr.tenantId = ?1 AND tr.isDeleted = false ORDER BY tr.displayOrder ASC, tr.nameKo ASC")
    List<TenantRole> findByTenantIdAndIsDeletedFalse(String tenantId);
    
    /**
     * tenant_id로 활성 역할만 조회
     */
    @Query("SELECT tr FROM TenantRole tr WHERE tr.tenantId = ?1 AND tr.isActive = true AND tr.isDeleted = false ORDER BY tr.displayOrder ASC, tr.nameKo ASC")
    List<TenantRole> findActiveByTenantId(String tenantId);
    
    /**
     * tenant_id와 role_template_id로 조회
     */
    @Query("SELECT tr FROM TenantRole tr WHERE tr.tenantId = ?1 AND tr.roleTemplateId = ?2 AND tr.isDeleted = false")
    List<TenantRole> findByTenantIdAndRoleTemplateId(String tenantId, String roleTemplateId);
    
    /**
     * tenant_id와 name_ko로 조회 (중복 확인용)
     */
    @Query("SELECT tr FROM TenantRole tr WHERE tr.tenantId = ?1 AND tr.nameKo = ?2 AND tr.isDeleted = false")
    Optional<TenantRole> findByTenantIdAndNameKo(String tenantId, String nameKo);
    
    /**
     * role_template_id로 조회
     */
    @Query("SELECT tr FROM TenantRole tr WHERE tr.roleTemplateId = ?1 AND tr.isDeleted = false")
    List<TenantRole> findByRoleTemplateId(String roleTemplateId);
}

