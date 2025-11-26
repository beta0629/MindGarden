package com.coresolution.core.service.statistics;

import com.coresolution.core.domain.statistics.StatisticsDefinition;
import com.coresolution.core.domain.statistics.StatisticsGenerationLog;
import com.coresolution.core.domain.statistics.StatisticsValue;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * 통계 메타데이터 서비스 인터페이스
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-25
 */
public interface StatisticsMetadataService {
    
    /**
     * 통계 정의 조회
     */
    List<StatisticsDefinition> getStatisticsDefinitions(String tenantId, String category);
    
    /**
     * 통계 정의 조회 (단일)
     */
    StatisticsDefinition getStatisticsDefinition(String tenantId, String statisticCode);
    
    /**
     * 통계 정의 저장
     */
    StatisticsDefinition saveStatisticsDefinition(String tenantId, StatisticsDefinition definition);
    
    /**
     * 통계 값 계산 (메타데이터 기반)
     */
    BigDecimal calculateStatistic(String tenantId, String statisticCode, LocalDate date, Map<String, Object> params);
    
    /**
     * 일별 통계 자동 생성 (배치)
     */
    void generateDailyStatistics(String tenantId, LocalDate date);
    
    /**
     * 통계 생성 이력 조회
     */
    List<StatisticsGenerationLog> getGenerationLogs(String tenantId, String statisticCode, LocalDate startDate, LocalDate endDate);
    
    /**
     * 통계 값 캐시 조회
     */
    StatisticsValue getCachedValue(String tenantId, String statisticCode, LocalDate date);
    
    /**
     * 통계 값 캐시 저장
     */
    StatisticsValue cacheValue(String tenantId, String statisticCode, LocalDate date, BigDecimal value);
}


