package com.coresolution.core.repository;

import com.coresolution.core.domain.RolePermission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 역할 권한 Repository
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Repository
public interface RolePermissionRepository extends JpaRepository<RolePermission, Long> {
    
    /**
     * tenant_role_id로 모든 권한 조회
     * 주의: @Entity(name = "TenantRolePermission")이므로 엔티티 이름을 사용해야 함
     */
    @Query("SELECT rp FROM TenantRolePermission rp WHERE rp.tenantRoleId = ?1 ORDER BY rp.permissionCode ASC")
    List<RolePermission> findByTenantRoleId(String tenantRoleId);
    
    /**
     * tenant_role_id와 permission_code로 조회
     */
    @Query("SELECT rp FROM TenantRolePermission rp WHERE rp.tenantRoleId = ?1 AND rp.permissionCode = ?2")
    Optional<RolePermission> findByTenantRoleIdAndPermissionCode(String tenantRoleId, String permissionCode);
    
    /**
     * tenant_role_id와 permission_code로 존재 여부 확인
     */
    @Query("SELECT COUNT(rp) > 0 FROM TenantRolePermission rp WHERE rp.tenantRoleId = ?1 AND rp.permissionCode = ?2")
    boolean existsByTenantRoleIdAndPermissionCode(String tenantRoleId, String permissionCode);
    
    /**
     * tenant_role_id로 권한 삭제
     */
    void deleteByTenantRoleId(String tenantRoleId);
}

