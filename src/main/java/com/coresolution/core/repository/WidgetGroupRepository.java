package com.coresolution.core.repository;

import com.coresolution.core.domain.WidgetGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 위젯 그룹 Repository
 * 
 * 목적: 위젯 그룹 데이터 접근
 * 표준: DATABASE_SCHEMA_STANDARD.md 준수
 * 
 * @author CoreSolution Team
 * @since 2025-12-02
 */
@Repository
public interface WidgetGroupRepository extends JpaRepository<WidgetGroup, String> {
    
    /**
     * 테넌트 ID + 업종 + 역할로 위젯 그룹 조회 (활성화된 것만)
     */
    @Query("SELECT wg FROM WidgetGroup wg " +
           "WHERE (wg.tenantId = :tenantId OR wg.tenantId IS NULL) " +
           "AND wg.businessType = :businessType " +
           "AND wg.roleCode = :roleCode " +
           "AND wg.isDeleted = false " +
           "AND wg.isActive = true " +
           "ORDER BY wg.displayOrder ASC")
    List<WidgetGroup> findByTenantAndBusinessTypeAndRoleCode(
            @Param("tenantId") String tenantId,
            @Param("businessType") String businessType,
            @Param("roleCode") String roleCode);
    
    /**
     * 업종 + 역할로 시스템 위젯 그룹 조회
     */
    List<WidgetGroup> findByTenantIdIsNullAndBusinessTypeAndRoleCodeAndIsDeletedFalseAndIsActiveTrue(
            String businessType, String roleCode);
    
    /**
     * 테넌트별 위젯 그룹 조회
     */
    List<WidgetGroup> findByTenantIdAndIsDeletedFalseAndIsActiveTrue(String tenantId);
    
    /**
     * 그룹 ID로 조회 (소프트 삭제 제외)
     */
    Optional<WidgetGroup> findByGroupIdAndIsDeletedFalse(String groupId);
    
    /**
     * 그룹 ID + 테넌트 ID로 조회 (소프트 삭제 제외)
     */
    Optional<WidgetGroup> findByGroupIdAndTenantIdAndIsDeletedFalse(String groupId, String tenantId);
    
    /**
     * 테넌트 + 업종 + 역할 + 그룹명으로 중복 확인
     */
    boolean existsByTenantIdAndBusinessTypeAndRoleCodeAndGroupNameAndIsDeletedFalse(
            String tenantId, String businessType, String roleCode, String groupName);
}

