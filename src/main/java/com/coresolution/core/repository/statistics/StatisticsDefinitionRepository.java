package com.coresolution.core.repository.statistics;

import com.coresolution.core.domain.statistics.StatisticsDefinition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 통계 정의 Repository
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-25
 */
@Repository
public interface StatisticsDefinitionRepository extends JpaRepository<StatisticsDefinition, Long> {
    
    /**
     * 테넌트 ID와 통계 코드로 조회
     */
    Optional<StatisticsDefinition> findByTenantIdAndStatisticCode(String tenantId, String statisticCode);
    
    /**
     * 테넌트 ID와 카테고리로 활성화된 통계 정의 목록 조회
     */
    @Query("SELECT sd FROM StatisticsDefinition sd WHERE " +
           "(sd.tenantId = :tenantId OR sd.tenantId IS NULL) AND " +
           "(:category IS NULL OR sd.category = :category) AND " +
           "sd.isActive = true " +
           "ORDER BY sd.displayOrder ASC, sd.statisticCode ASC")
    List<StatisticsDefinition> findActiveByTenantIdAndCategory(
        @Param("tenantId") String tenantId,
        @Param("category") StatisticsDefinition.Category category
    );
    
    /**
     * 테넌트 ID로 활성화된 통계 정의 목록 조회
     */
    @Query("SELECT sd FROM StatisticsDefinition sd WHERE " +
           "(sd.tenantId = :tenantId OR sd.tenantId IS NULL) AND " +
           "sd.isActive = true " +
           "ORDER BY sd.displayOrder ASC, sd.statisticCode ASC")
    List<StatisticsDefinition> findActiveByTenantId(@Param("tenantId") String tenantId);
    
    /**
     * 시스템 기본 통계 정의 목록 조회 (tenant_id = NULL)
     */
    List<StatisticsDefinition> findByTenantIdIsNullAndIsActiveTrueOrderByDisplayOrderAsc();
    
    /**
     * 통계 코드로 조회 (시스템 기본 또는 테넌트별)
     */
    @Query("SELECT sd FROM StatisticsDefinition sd WHERE " +
           "sd.statisticCode = :statisticCode AND " +
           "(sd.tenantId = :tenantId OR sd.tenantId IS NULL) AND " +
           "sd.isActive = true " +
           "ORDER BY sd.tenantId DESC") // 테넌트별 정의가 우선
    List<StatisticsDefinition> findByStatisticCodeAndTenantId(
        @Param("statisticCode") String statisticCode,
        @Param("tenantId") String tenantId
    );
}


