package com.coresolution.consultation.repository;

import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.entity.RolePermission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * 역할-권한 매칭 Repository (레거시)
 * 
 * @deprecated com.coresolution.core.repository.RolePermissionRepository를 사용하세요.
 * 이 Repository는 레거시 시스템과의 호환성을 위해 유지됩니다.
 * 
 * 주의: 이 Repository는 role_name 기반이며, 새로운 시스템은 tenant_role_id 기반입니다.
 */
@Deprecated
@Repository
public interface LegacyRolePermissionRepository extends JpaRepository<RolePermission, Long> {
    
    /**
     * 역할명으로 권한 목록 조회
     */
    @Query("SELECT rp FROM RolePermission rp WHERE rp.roleName = :roleName AND rp.isActive = true")
    List<RolePermission> findByRoleNameAndIsActiveTrue(@Param("roleName") String roleName);
    
    /**
     * 권한 코드로 역할 목록 조회
     */
    @Query("SELECT rp FROM RolePermission rp WHERE rp.permissionCode = :permissionCode AND rp.isActive = true")
    List<RolePermission> findByPermissionCodeAndIsActiveTrue(@Param("permissionCode") String permissionCode);
    
    /**
     * 특정 역할이 특정 권한을 가지고 있는지 확인
     */
    @Query("SELECT CASE WHEN COUNT(rp) > 0 THEN true ELSE false END FROM RolePermission rp " +
           "WHERE rp.roleName = :roleName AND rp.permissionCode = :permissionCode AND rp.isActive = true")
    boolean existsByRoleNameAndPermissionCodeAndIsActiveTrue(@Param("roleName") String roleName, 
                                                           @Param("permissionCode") String permissionCode);
    
    /**
     * 역할명과 권한 코드로 매칭 조회
     */
    @Query("SELECT rp FROM RolePermission rp WHERE rp.roleName = :roleName AND rp.permissionCode = :permissionCode AND rp.isActive = true")
    Optional<RolePermission> findByRoleNameAndPermissionCodeAndIsActiveTrue(@Param("roleName") String roleName, @Param("permissionCode") String permissionCode);
    
    /**
     * 특정 권한을 가진 모든 역할 조회
     */
    @Query("SELECT DISTINCT rp.roleName FROM RolePermission rp WHERE rp.permissionCode = :permissionCode AND rp.isActive = true")
    List<String> findRoleNamesByPermissionCodeAndIsActiveTrue(@Param("permissionCode") String permissionCode);
    
    /**
     * 특정 역할의 권한 개수 조회
     */
    @Query("SELECT COUNT(rp) FROM RolePermission rp WHERE rp.roleName = :roleName AND rp.isActive = true")
    long countByRoleNameAndIsActiveTrue(@Param("roleName") String roleName);
    
    /**
     * 권한별 역할 개수 조회
     */
    @Query("SELECT COUNT(rp) FROM RolePermission rp WHERE rp.permissionCode = :permissionCode AND rp.isActive = true")
    long countByPermissionCodeAndIsActiveTrue(@Param("permissionCode") String permissionCode);
    
    /**
     * 비활성화된 매칭들 조회 (관리용)
     */
    @Query("SELECT rp FROM RolePermission rp WHERE rp.isActive = false")
    List<RolePermission> findByIsActiveFalse();
    
    /**
     * 특정 역할의 모든 권한 매칭 삭제
     */
    void deleteByRoleName(String roleName);
    
    /**
     * 역할명과 권한 코드로 매칭 존재 여부 확인 (is_active 상태와 관계없이)
     */
    @Query("SELECT CASE WHEN COUNT(rp) > 0 THEN true ELSE false END FROM RolePermission rp " +
           "WHERE rp.roleName = :roleName AND rp.permissionCode = :permissionCode")
    boolean existsByRoleNameAndPermissionCode(@Param("roleName") String roleName, 
                                            @Param("permissionCode") String permissionCode);
    
    /**
     * 역할명과 권한 코드로 매칭 조회 (is_active 상태와 관계없이)
     */
    @Query("SELECT rp FROM RolePermission rp WHERE rp.roleName = :roleName AND rp.permissionCode = :permissionCode")
    Optional<RolePermission> findByRoleNameAndPermissionCode(@Param("roleName") String roleName, 
                                                           @Param("permissionCode") String permissionCode);
}
