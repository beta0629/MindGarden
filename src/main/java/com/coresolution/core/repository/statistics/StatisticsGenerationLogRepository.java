package com.coresolution.core.repository.statistics;

import com.coresolution.core.domain.statistics.StatisticsGenerationLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

/**
 * 통계 생성 이력 Repository
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-25
 */
@Repository
public interface StatisticsGenerationLogRepository extends JpaRepository<StatisticsGenerationLog, Long> {
    
    /**
     * 테넌트 ID와 통계 코드로 기간 내 이력 조회
     */
    @Query("SELECT sgl FROM StatisticsGenerationLog sgl WHERE " +
           "sgl.tenantId = :tenantId AND " +
           "sgl.statisticCode = :statisticCode AND " +
           "sgl.generationDate BETWEEN :startDate AND :endDate " +
           "ORDER BY sgl.generationDate DESC")
    List<StatisticsGenerationLog> findByTenantIdAndStatisticCodeAndDateRange(
        @Param("tenantId") String tenantId,
        @Param("statisticCode") String statisticCode,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );
    
    /**
     * 테넌트 ID와 날짜로 이력 조회
     */
    List<StatisticsGenerationLog> findByTenantIdAndGenerationDate(String tenantId, LocalDate generationDate);
    
    /**
     * 테넌트 ID와 통계 코드로 최신 이력 조회
     */
    @Query("SELECT sgl FROM StatisticsGenerationLog sgl WHERE " +
           "sgl.tenantId = :tenantId AND " +
           "sgl.statisticCode = :statisticCode " +
           "ORDER BY sgl.generationDate DESC, sgl.createdAt DESC")
    List<StatisticsGenerationLog> findLatestByTenantIdAndStatisticCode(
        @Param("tenantId") String tenantId,
        @Param("statisticCode") String statisticCode
    );
}


