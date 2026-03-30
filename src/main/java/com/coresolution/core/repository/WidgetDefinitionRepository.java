package com.coresolution.core.repository;

import com.coresolution.core.domain.WidgetDefinition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 위젯 정의 Repository
 * 
 * 목적: 위젯 정의 데이터 접근
 * 표준: DATABASE_SCHEMA_STANDARD.md 준수
 * 
 * @author CoreSolution Team
 * @since 2025-12-02
 */
@Repository
public interface WidgetDefinitionRepository extends JpaRepository<WidgetDefinition, String> {
    
    /**
     * 그룹 ID로 위젯 조회 (활성화된 것만, 정렬)
     */
    List<WidgetDefinition> findByGroupIdAndIsDeletedFalseAndIsActiveTrueOrderByDisplayOrderAsc(String groupId);
    
    /**
     * 테넌트 + 업종 + 역할로 위젯 조회
     */
    @Query("SELECT wd FROM WidgetDefinition wd " +
           "WHERE (wd.tenantId = :tenantId OR wd.tenantId IS NULL) " +
           "AND wd.businessType = :businessType " +
           "AND (wd.roleCode = :roleCode OR wd.roleCode IS NULL) " +
           "AND wd.isDeleted = false " +
           "AND wd.isActive = true " +
           "ORDER BY wd.displayOrder ASC")
    List<WidgetDefinition> findByTenantAndBusinessTypeAndRoleCode(
            @Param("tenantId") String tenantId,
            @Param("businessType") String businessType,
            @Param("roleCode") String roleCode);
    
    /**
     * 독립 위젯 조회 (사용자가 추가 가능한 위젯)
     */
    @Query("SELECT wd FROM WidgetDefinition wd " +
           "WHERE wd.groupId IS NULL " +
           "AND wd.businessType = :businessType " +
           "AND wd.isSystemManaged = false " +
           "AND wd.isDeleted = false " +
           "AND wd.isActive = true " +
           "ORDER BY wd.displayOrder ASC")
    List<WidgetDefinition> findAvailableIndependentWidgets(@Param("businessType") String businessType);
    
    /**
     * 위젯 ID로 조회 (소프트 삭제 제외)
     */
    Optional<WidgetDefinition> findByWidgetIdAndIsDeletedFalse(String widgetId);
    
    /**
     * 위젯 ID + 테넌트 ID로 조회
     */
    Optional<WidgetDefinition> findByWidgetIdAndTenantIdAndIsDeletedFalse(String widgetId, String tenantId);
    
    /**
     * 위젯 타입으로 조회
     */
    List<WidgetDefinition> findByWidgetTypeAndIsDeletedFalseAndIsActiveTrue(String widgetType);
    
    /**
     * 시스템 관리 위젯 여부 확인
     */
    @Query("SELECT wd.isSystemManaged FROM WidgetDefinition wd " +
           "WHERE wd.widgetId = :widgetId AND wd.isDeleted = false")
    Optional<Boolean> isSystemManagedWidget(@Param("widgetId") String widgetId);
    
    /**
     * 삭제 가능 위젯 여부 확인
     */
    @Query("SELECT wd.isDeletable FROM WidgetDefinition wd " +
           "WHERE wd.widgetId = :widgetId AND wd.isDeleted = false")
    Optional<Boolean> isDeletableWidget(@Param("widgetId") String widgetId);
}

