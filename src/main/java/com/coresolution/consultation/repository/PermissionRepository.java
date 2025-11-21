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
    
    /**
     * 권한 코드로 권한 조회
     */
    Optional<Permission> findByPermissionCode(String permissionCode);
    
    /**
     * 권한 코드 존재 여부 확인
     */
    boolean existsByPermissionCode(String permissionCode);
    
    /**
     * 활성화된 권한만 조회
     */
    List<Permission> findByIsActiveTrue();
    
    /**
     * 카테고리별 권한 조회
     */
    List<Permission> findByCategoryAndIsActiveTrue(String category);
    
    /**
     * 권한 코드 리스트로 권한 조회
     */
    @Query("SELECT p FROM Permission p WHERE p.permissionCode IN :codes AND p.isActive = true")
    List<Permission> findByPermissionCodeInAndIsActiveTrue(@Param("codes") List<String> codes);
    
    /**
     * 권한명으로 검색
     */
    @Query("SELECT p FROM Permission p WHERE p.permissionName LIKE %:name% AND p.isActive = true")
    List<Permission> findByPermissionNameContainingAndIsActiveTrue(@Param("name") String name);
}
