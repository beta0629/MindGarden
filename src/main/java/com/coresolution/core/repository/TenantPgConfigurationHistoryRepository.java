package com.coresolution.core.repository;

import com.coresolution.core.domain.TenantPgConfigurationHistory;
import com.coresolution.core.domain.TenantPgConfigurationHistory.ChangeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 테넌트 PG 설정 변경 이력 Repository
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Repository
public interface TenantPgConfigurationHistoryRepository extends JpaRepository<TenantPgConfigurationHistory, Long> {
    
    /**
     * config_id로 조회 (최신순)
     */
    List<TenantPgConfigurationHistory> findByConfigIdOrderByChangedAtDesc(String configId);
    
    /**
     * config_id와 change_type으로 조회
     */
    List<TenantPgConfigurationHistory> findByConfigIdAndChangeTypeOrderByChangedAtDesc(
        String configId,
        ChangeType changeType
    );
    
    /**
     * config_id와 기간으로 조회
     */
    @Query("SELECT h FROM TenantPgConfigurationHistory h " +
           "WHERE h.configId = :configId " +
           "AND h.changedAt BETWEEN :startDate AND :endDate " +
           "ORDER BY h.changedAt DESC")
    List<TenantPgConfigurationHistory> findByConfigIdAndDateRange(
        @Param("configId") String configId,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );
    
    /**
     * changed_by로 조회
     */
    List<TenantPgConfigurationHistory> findByChangedByOrderByChangedAtDesc(String changedBy);
    
    /**
     * 최근 변경 이력 조회 (상위 N개)
     */
    @Query("SELECT h FROM TenantPgConfigurationHistory h " +
           "WHERE h.configId = :configId " +
           "ORDER BY h.changedAt DESC " +
           "LIMIT :limit")
    List<TenantPgConfigurationHistory> findRecentHistory(
        @Param("configId") String configId,
        @Param("limit") int limit
    );
}

