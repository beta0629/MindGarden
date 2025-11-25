package com.coresolution.core.repository.statistics;

import com.coresolution.core.domain.statistics.StatisticsValue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * 통계 값 캐시 Repository
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-25
 */
@Repository
public interface StatisticsValueRepository extends JpaRepository<StatisticsValue, Long> {
    
    /**
     * 테넌트 ID, 통계 코드, 계산 날짜로 조회
     */
    Optional<StatisticsValue> findByTenantIdAndStatisticCodeAndCalculationDate(
        String tenantId, 
        String statisticCode, 
        LocalDate calculationDate
    );
    
    /**
     * 테넌트 ID와 통계 코드로 기간 내 값 조회
     */
    @Query("SELECT sv FROM StatisticsValue sv WHERE " +
           "sv.tenantId = :tenantId AND " +
           "sv.statisticCode = :statisticCode AND " +
           "sv.calculationDate BETWEEN :startDate AND :endDate " +
           "ORDER BY sv.calculationDate DESC")
    List<StatisticsValue> findByTenantIdAndStatisticCodeAndDateRange(
        @Param("tenantId") String tenantId,
        @Param("statisticCode") String statisticCode,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );
    
    /**
     * 만료된 캐시 삭제
     */
    @Modifying
    @Query("DELETE FROM StatisticsValue sv WHERE sv.expiresAt < :now")
    void deleteExpiredCache(@Param("now") LocalDateTime now);
    
    /**
     * 테넌트 ID로 만료된 캐시 삭제
     */
    @Modifying
    @Query("DELETE FROM StatisticsValue sv WHERE sv.tenantId = :tenantId AND sv.expiresAt < :now")
    void deleteExpiredCacheByTenantId(@Param("tenantId") String tenantId, @Param("now") LocalDateTime now);
}


