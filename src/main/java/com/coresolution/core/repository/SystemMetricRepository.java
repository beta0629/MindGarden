package com.coresolution.core.repository;

import com.coresolution.core.domain.SystemMetric;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 시스템 메트릭 Repository
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-12-02
 */
@Repository
public interface SystemMetricRepository extends JpaRepository<SystemMetric, Long> {
    
    /**
     * 테넌트별 최근 메트릭 조회
     */
    List<SystemMetric> findByTenantIdAndMetricTypeAndCollectedAtAfterOrderByCollectedAtDesc(
        String tenantId,
        String metricType,
        LocalDateTime since
    );
    
    /**
     * 시스템 전체 최근 메트릭 조회
     */
    List<SystemMetric> findByMetricTypeAndCollectedAtAfterOrderByCollectedAtDesc(
        String metricType,
        LocalDateTime since
    );
    
    /**
     * 테넌트별 메트릭 평균값 조회
     */
    @Query("SELECT AVG(m.metricValue) FROM SystemMetric m " +
           "WHERE m.tenantId = ?1 AND m.metricType = ?2 " +
           "AND m.collectedAt BETWEEN ?3 AND ?4")
    Double getAverageMetricValue(
        String tenantId,
        String metricType,
        LocalDateTime startTime,
        LocalDateTime endTime
    );
}

