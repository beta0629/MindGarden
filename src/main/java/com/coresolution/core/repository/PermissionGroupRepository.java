package com.coresolution.core.repository;

import com.coresolution.core.entity.PermissionGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 권한 그룹 Repository
 * 
 * @author MindGarden
 * @version 2.0.0
 * @since 2025-12-03
 */
@Repository
public interface PermissionGroupRepository extends JpaRepository<PermissionGroup, Long> {

    /**
     * 그룹 코드로 조회
     */
    Optional<PermissionGroup> findByGroupCode(String groupCode);

    /**
     * 테넌트 ID와 그룹 코드로 조회
     */
    Optional<PermissionGroup> findByTenantIdAndGroupCode(String tenantId, String groupCode);

    /**
     * 시스템 그룹만 조회 (tenant_id = NULL)
     */
    @Query("SELECT p FROM PermissionGroup p WHERE p.tenantId IS NULL AND p.isActive = true ORDER BY p.sortOrder ASC")
    List<PermissionGroup> findSystemGroups();

    /**
     * 테넌트 그룹만 조회
     */
    @Query("SELECT p FROM PermissionGroup p WHERE p.tenantId = :tenantId AND p.isActive = true ORDER BY p.sortOrder ASC")
    List<PermissionGroup> findTenantGroups(@Param("tenantId") String tenantId);

    /**
     * 모든 활성 그룹 조회 (시스템 + 테넌트)
     */
    @Query("SELECT p FROM PermissionGroup p WHERE (p.tenantId = :tenantId OR p.tenantId IS NULL) AND p.isActive = true ORDER BY p.sortOrder ASC")
    List<PermissionGroup> findAllActiveGroups(@Param("tenantId") String tenantId);

    /**
     * 그룹 타입으로 조회
     */
    @Query("SELECT p FROM PermissionGroup p WHERE p.groupType = :groupType AND p.isActive = true ORDER BY p.sortOrder ASC")
    List<PermissionGroup> findByGroupType(@Param("groupType") String groupType);

    /**
     * 부모 그룹 코드로 하위 그룹 조회
     */
    @Query("SELECT p FROM PermissionGroup p WHERE p.parentGroupCode = :parentCode AND p.isActive = true ORDER BY p.sortOrder ASC")
    List<PermissionGroup> findByParentGroupCode(@Param("parentCode") String parentCode);

    /**
     * 최상위 그룹만 조회 (parent_group_code = NULL)
     */
    @Query("SELECT p FROM PermissionGroup p WHERE p.parentGroupCode IS NULL AND p.isActive = true ORDER BY p.sortOrder ASC")
    List<PermissionGroup> findRootGroups();

    /**
     * 테넌트 ID별 그룹 개수 조회
     */
    @Query("SELECT COUNT(p) FROM PermissionGroup p WHERE p.tenantId = :tenantId AND p.isActive = true")
    long countByTenantId(@Param("tenantId") String tenantId);
}

