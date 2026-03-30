package com.coresolution.core.repository;

import com.coresolution.core.entity.RoleMenuPermission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 역할별 메뉴 권한 Repository
 * 
 * @author MindGarden
 * @version 2.0.0
 * @since 2025-12-03
 */
@Repository
public interface RoleMenuPermissionRepository extends JpaRepository<RoleMenuPermission, Long> {

    /**
     * 테넌트와 역할로 권한 조회
     */
    @Query("SELECT p FROM RoleMenuPermission p WHERE p.tenantId = :tenantId AND p.tenantRoleId = :tenantRoleId AND p.isActive = true")
    List<RoleMenuPermission> findByTenantIdAndTenantRoleIdAndIsActiveTrue(
        @Param("tenantId") String tenantId,
        @Param("tenantRoleId") String tenantRoleId
    );

    /**
     * 특정 메뉴 권한 조회
     */
    Optional<RoleMenuPermission> findByTenantIdAndTenantRoleIdAndMenuId(
        String tenantId,
        String tenantRoleId,
        Long menuId
    );

    /**
     * 테넌트의 모든 권한 조회
     */
    @Query("SELECT p FROM RoleMenuPermission p WHERE p.tenantId = :tenantId AND p.isActive = true")
    List<RoleMenuPermission> findByTenantIdAndIsActiveTrue(@Param("tenantId") String tenantId);

    /**
     * 메뉴의 모든 권한 조회
     */
    @Query("SELECT p FROM RoleMenuPermission p WHERE p.menuId = :menuId AND p.isActive = true")
    List<RoleMenuPermission> findByMenuIdAndIsActiveTrue(@Param("menuId") Long menuId);

    /**
     * 테넌트와 메뉴로 권한 조회
     */
    @Query("SELECT p FROM RoleMenuPermission p WHERE p.tenantId = :tenantId AND p.menuId = :menuId AND p.isActive = true")
    List<RoleMenuPermission> findByTenantIdAndMenuIdAndIsActiveTrue(
        @Param("tenantId") String tenantId,
        @Param("menuId") Long menuId
    );

    /**
     * 권한 개수 조회
     */
    @Query("SELECT COUNT(p) FROM RoleMenuPermission p WHERE p.tenantId = :tenantId AND p.isActive = true")
    long countByTenantId(@Param("tenantId") String tenantId);
}

