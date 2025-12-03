package com.coresolution.core.repository;

import com.coresolution.core.entity.RolePermissionGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 역할별 권한 그룹 Repository
 * 
 * @author MindGarden
 * @version 2.0.0
 * @since 2025-12-03
 */
@Repository
public interface RolePermissionGroupRepository extends JpaRepository<RolePermissionGroup, Long> {

    /**
     * 테넌트와 역할로 권한 그룹 조회
     */
    @Query("SELECT r FROM RolePermissionGroup r WHERE r.tenantId = :tenantId AND r.tenantRoleId = :tenantRoleId AND r.isActive = true")
    List<RolePermissionGroup> findByTenantIdAndTenantRoleIdAndIsActiveTrue(
        @Param("tenantId") String tenantId,
        @Param("tenantRoleId") String tenantRoleId
    );

    /**
     * 특정 그룹 권한 조회
     */
    Optional<RolePermissionGroup> findByTenantIdAndTenantRoleIdAndPermissionGroupCode(
        String tenantId,
        String tenantRoleId,
        String permissionGroupCode
    );

    /**
     * 특정 그룹 권한 존재 여부 확인
     */
    @Query("SELECT COUNT(r) > 0 FROM RolePermissionGroup r WHERE r.tenantId = :tenantId AND r.tenantRoleId = :tenantRoleId AND r.permissionGroupCode = :groupCode AND r.isActive = true")
    boolean existsByTenantIdAndTenantRoleIdAndPermissionGroupCodeAndIsActiveTrue(
        @Param("tenantId") String tenantId,
        @Param("tenantRoleId") String tenantRoleId,
        @Param("groupCode") String groupCode
    );

    /**
     * 테넌트의 모든 권한 조회
     */
    @Query("SELECT r FROM RolePermissionGroup r WHERE r.tenantId = :tenantId AND r.isActive = true")
    List<RolePermissionGroup> findByTenantIdAndIsActiveTrue(@Param("tenantId") String tenantId);

    /**
     * 그룹 코드의 모든 권한 조회
     */
    @Query("SELECT r FROM RolePermissionGroup r WHERE r.permissionGroupCode = :groupCode AND r.isActive = true")
    List<RolePermissionGroup> findByPermissionGroupCodeAndIsActiveTrue(@Param("groupCode") String groupCode);

    /**
     * 권한 그룹 코드 목록 조회
     */
    @Query("SELECT r.permissionGroupCode FROM RolePermissionGroup r WHERE r.tenantId = :tenantId AND r.tenantRoleId = :tenantRoleId AND r.isActive = true")
    List<String> findPermissionGroupCodesByTenantIdAndTenantRoleId(
        @Param("tenantId") String tenantId,
        @Param("tenantRoleId") String tenantRoleId
    );
}

