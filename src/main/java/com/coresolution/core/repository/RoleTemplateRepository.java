package com.coresolution.core.repository;

import com.coresolution.core.domain.RoleTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 역할 템플릿 Repository
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Repository
public interface RoleTemplateRepository extends JpaRepository<RoleTemplate, Long> {
    
    /**
     * role_template_id로 조회
     */
    Optional<RoleTemplate> findByRoleTemplateIdAndIsDeletedFalse(String roleTemplateId);
    
    /**
     * template_code로 조회
     */
    Optional<RoleTemplate> findByTemplateCodeAndIsDeletedFalse(String templateCode);
    
    /**
     * business_type으로 조회
     */
    @Query("SELECT rt FROM RoleTemplate rt WHERE rt.businessType = ?1 AND rt.isActive = true AND rt.isDeleted = false ORDER BY rt.displayOrder ASC")
    List<RoleTemplate> findByBusinessTypeAndActive(String businessType);
    
    /**
     * business_type과 관리자 역할 여부로 조회
     */
    @Query("SELECT rt FROM RoleTemplate rt WHERE rt.businessType = ?1 AND rt.isAdminRole = TRUE AND rt.isActive = TRUE AND rt.isDeleted = FALSE ORDER BY rt.displayOrder ASC")
    List<RoleTemplate> findByBusinessTypeAndAdminRole(String businessType);
    
    /**
     * 활성화된 모든 템플릿 조회
     */
    @Query("SELECT rt FROM RoleTemplate rt WHERE rt.isActive = true AND rt.isDeleted = false ORDER BY rt.displayOrder ASC")
    List<RoleTemplate> findAllActive();
}

