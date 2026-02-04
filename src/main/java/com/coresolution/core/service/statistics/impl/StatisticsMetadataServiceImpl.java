package com.coresolution.core.service.statistics.impl;

import com.coresolution.core.domain.statistics.StatisticsDefinition;
import com.coresolution.core.domain.statistics.StatisticsGenerationLog;
import com.coresolution.core.domain.statistics.StatisticsValue;
import com.coresolution.core.repository.statistics.StatisticsDefinitionRepository;
import com.coresolution.core.repository.statistics.StatisticsGenerationLogRepository;
import com.coresolution.core.repository.statistics.StatisticsValueRepository;
import com.coresolution.core.service.statistics.StatisticsCalculationEngine;
import com.coresolution.core.service.statistics.StatisticsMetadataService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * 통계 메타데이터 서비스 구현체
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-25
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class StatisticsMetadataServiceImpl implements StatisticsMetadataService {
    
    private final StatisticsDefinitionRepository definitionRepository;
    private final StatisticsGenerationLogRepository logRepository;
    private final StatisticsValueRepository valueRepository;
    private final StatisticsCalculationEngine calculationEngine;
    
    @Override
    @Transactional(readOnly = true)
    public List<StatisticsDefinition> getStatisticsDefinitions(String tenantId, String category) {
        StatisticsDefinition.Category categoryEnum = null;
        if (category != null && !category.isEmpty()) {
            try {
                categoryEnum = StatisticsDefinition.Category.valueOf(category.toUpperCase());
            } catch (IllegalArgumentException e) {
                log.warn("알 수 없는 카테고리: {}", category);
            }
        }
        
        return definitionRepository.findActiveByTenantIdAndCategory(tenantId, categoryEnum);
    }
    
    @Override
    @Transactional(readOnly = true)
    public StatisticsDefinition getStatisticsDefinition(String tenantId, String statisticCode) {
        // 테넌트별 정의 우선 조회
        List<StatisticsDefinition> definitions = definitionRepository.findByStatisticCodeAndTenantId(statisticCode, tenantId);
        
        if (!definitions.isEmpty()) {
            return definitions.get(0); // 테넌트별 정의가 우선
        }
        
        // 시스템 기본 정의 조회
        return definitionRepository.findByTenantIdAndStatisticCode(null, statisticCode)
            .orElseThrow(() -> new IllegalArgumentException("통계 정의를 찾을 수 없습니다: " + statisticCode));
    }
    
    @Override
    public StatisticsDefinition saveStatisticsDefinition(String tenantId, StatisticsDefinition definition) {
        definition.setTenantId(tenantId);
        return definitionRepository.save(definition);
    }
    
    @Override
    public BigDecimal calculateStatistic(String tenantId, String statisticCode, LocalDate date, Map<String, Object> params) {
        long startTime = System.currentTimeMillis();
        
        try {
            // 통계 정의 조회
            StatisticsDefinition definition = getStatisticsDefinition(tenantId, statisticCode);
            
            // 캐시 확인
            StatisticsValue cachedValue = valueRepository.findByTenantIdAndStatisticCodeAndCalculationDate(
                tenantId, statisticCode, date
            ).orElse(null);
            
            if (cachedValue != null && !cachedValue.isExpired()) {
                log.debug("캐시된 통계 값 사용: code={}, value={}", statisticCode, cachedValue.getCalculatedValue());
                return cachedValue.getCalculatedValue();
            }
            
            // 통계 계산
            Map<String, Object> calculationParams = Map.of(
                "tenantId", tenantId,
                "date", date
            );
            
            BigDecimal value = calculationEngine.calculate(definition, date, calculationParams);
            
            // 캐시 저장 (중복 방지: 존재하면 업데이트, 없으면 저장)
            StatisticsValue existingValue = valueRepository.findByTenantIdAndStatisticCodeAndCalculationDate(
                tenantId, statisticCode, date
            ).orElse(null);
            
            StatisticsValue statisticsValue;
            if (existingValue != null) {
                // 기존 값 업데이트
                existingValue.setCalculatedValue(value);
                existingValue.setExpiresAt(LocalDateTime.now().plusHours(1)); // 1시간 캐시 갱신
                statisticsValue = valueRepository.save(existingValue);
                log.debug("기존 통계 값 업데이트: code={}, value={}", statisticCode, value);
            } else {
                // 새 값 저장
                statisticsValue = StatisticsValue.builder()
                    .tenantId(tenantId)
                    .statisticCode(statisticCode)
                    .calculationDate(date)
                    .calculatedValue(value)
                    .expiresAt(LocalDateTime.now().plusHours(1)) // 1시간 캐시
                    .build();
                statisticsValue = valueRepository.save(statisticsValue);
                log.debug("새 통계 값 저장: code={}, value={}", statisticCode, value);
            }
            
            // 생성 이력 저장
            long calculationTime = System.currentTimeMillis() - startTime;
            StatisticsGenerationLog generationLog = StatisticsGenerationLog.builder()
                .tenantId(tenantId)
                .statisticCode(statisticCode)
                .generationDate(date)
                .calculatedValue(value)
                .calculationTimeMs((int) calculationTime)
                .status(StatisticsGenerationLog.GenerationStatus.SUCCESS)
                .build();
            
            logRepository.save(generationLog);
            
            log.info("통계 계산 완료: code={}, value={}, time={}ms", statisticCode, value, calculationTime);
            
            return value;
            
        } catch (Exception e) {
            long calculationTime = System.currentTimeMillis() - startTime;
            
            // 실패 이력 저장
            StatisticsGenerationLog generationLog = StatisticsGenerationLog.builder()
                .tenantId(tenantId)
                .statisticCode(statisticCode)
                .generationDate(date)
                .calculationTimeMs((int) calculationTime)
                .status(StatisticsGenerationLog.GenerationStatus.FAILED)
                .errorMessage(e.getMessage())
                .build();
            
            logRepository.save(generationLog);
            
            log.error("통계 계산 실패: code={}", statisticCode, e);
            throw new RuntimeException("통계 계산 실패: " + e.getMessage(), e);
        }
    }
    
    @Override
    public void generateDailyStatistics(String tenantId, LocalDate date) {
        log.info("일별 통계 자동 생성 시작: tenantId={}, date={}", tenantId, date);
        
        // 활성화된 통계 정의 조회
        List<StatisticsDefinition> definitions = definitionRepository.findActiveByTenantId(tenantId);
        
        int successCount = 0;
        int failureCount = 0;
        
        for (StatisticsDefinition definition : definitions) {
            try {
                calculateStatistic(tenantId, definition.getStatisticCode(), date, Map.of());
                successCount++;
            } catch (Exception e) {
                log.error("통계 생성 실패: code={}", definition.getStatisticCode(), e);
                failureCount++;
            }
        }
        
        log.info("일별 통계 자동 생성 완료: tenantId={}, date={}, success={}, failure={}", 
            tenantId, date, successCount, failureCount);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<StatisticsGenerationLog> getGenerationLogs(String tenantId, String statisticCode, LocalDate startDate, LocalDate endDate) {
        return logRepository.findByTenantIdAndStatisticCodeAndDateRange(tenantId, statisticCode, startDate, endDate);
    }
    
    @Override
    @Transactional(readOnly = true)
    public StatisticsValue getCachedValue(String tenantId, String statisticCode, LocalDate date) {
        return valueRepository.findByTenantIdAndStatisticCodeAndCalculationDate(tenantId, statisticCode, date)
            .orElse(null);
    }
    
    @Override
    public StatisticsValue cacheValue(String tenantId, String statisticCode, LocalDate date, BigDecimal value) {
        StatisticsValue statisticsValue = StatisticsValue.builder()
            .tenantId(tenantId)
            .statisticCode(statisticCode)
            .calculationDate(date)
            .calculatedValue(value)
            .expiresAt(LocalDateTime.now().plusHours(1)) // 1시간 캐시
            .build();
        
        return valueRepository.save(statisticsValue);
    }
}

