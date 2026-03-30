package com.coresolution.consultation.repository;

import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.entity.Permission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * 권한 Repository
 */
@Repository
public interface PermissionRepository extends JpaRepository<Permission, Long> {
    
    // ==================== tenantId 필터링 메서드 ====================
    
    /**
     * 권한 코드로 권한 조회 (tenantId 필터링)
     */
    @Query("SELECT p FROM Permission p WHERE p.tenantId = :tenantId AND p.permissionCode = :permissionCode")
    Optional<Permission> findByTenantIdAndPermissionCode(@Param("tenantId") String tenantId, @Param("permissionCode") String permissionCode);
    
    /**
     * 권한 코드 존재 여부 확인 (tenantId 필터링)
     */
    @Query("SELECT COUNT(p) > 0 FROM Permission p WHERE p.tenantId = :tenantId AND p.permissionCode = :permissionCode")
    boolean existsByTenantIdAndPermissionCode(@Param("tenantId") String tenantId, @Param("permissionCode") String permissionCode);
    
    /**
     * 활성화된 권한만 조회 (tenantId 필터링)
     */
    @Query("SELECT p FROM Permission p WHERE p.tenantId = :tenantId AND p.isActive = true")
    List<Permission> findByTenantIdAndIsActiveTrue(@Param("tenantId") String tenantId);
    
    /**
     * 카테고리별 권한 조회 (tenantId 필터링)
     */
    @Query("SELECT p FROM Permission p WHERE p.tenantId = :tenantId AND p.category = :category AND p.isActive = true")
    List<Permission> findByTenantIdAndCategoryAndIsActiveTrue(@Param("tenantId") String tenantId, @Param("category") String category);
    
    /**
     * 권한 코드 리스트로 권한 조회 (tenantId 필터링)
     */
    @Query("SELECT p FROM Permission p WHERE p.tenantId = :tenantId AND p.permissionCode IN :codes AND p.isActive = true")
    List<Permission> findByTenantIdAndPermissionCodeInAndIsActiveTrue(@Param("tenantId") String tenantId, @Param("codes") List<String> codes);
    
    /**
     * 권한명으로 검색 (tenantId 필터링)
     */
    @Query("SELECT p FROM Permission p WHERE p.tenantId = :tenantId AND p.permissionName LIKE %:name% AND p.isActive = true")
    List<Permission> findByTenantIdAndPermissionNameContainingAndIsActiveTrue(@Param("tenantId") String tenantId, @Param("name") String name);
    
    // ==================== @Deprecated 메서드 (하위 호환성) ====================
    
    /**
     * @Deprecated - 🚨 극도로 위험: 모든 테넌트 권한 접근 가능! findByTenantIdAndPermissionCode 사용하세요.
     */
    @Deprecated
    Optional<Permission> findByPermissionCode(String permissionCode);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! existsByTenantIdAndPermissionCode 사용하세요.
     */
    @Deprecated
    boolean existsByPermissionCode(String permissionCode);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! findByTenantIdAndIsActiveTrue 사용하세요.
     */
    @Deprecated
    List<Permission> findByIsActiveTrue();
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! findByTenantIdAndCategoryAndIsActiveTrue 사용하세요.
     */
    @Deprecated
    List<Permission> findByCategoryAndIsActiveTrue(String category);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! findByTenantIdAndPermissionCodeInAndIsActiveTrue 사용하세요.
     */
    @Deprecated
    @Query("SELECT p FROM Permission p WHERE p.permissionCode IN :codes AND p.isActive = true")
    List<Permission> findByPermissionCodeInAndIsActiveTrue(@Param("codes") List<String> codes);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! findByTenantIdAndPermissionNameContainingAndIsActiveTrue 사용하세요.
     */
    @Deprecated
    @Query("SELECT p FROM Permission p WHERE p.permissionName LIKE %:name% AND p.isActive = true")
    List<Permission> findByPermissionNameContainingAndIsActiveTrue(@Param("name") String name);
}
