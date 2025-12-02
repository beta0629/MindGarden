package com.coresolution.core.service;

import com.coresolution.core.domain.SchedulerExecutionLog;
import com.coresolution.core.domain.SchedulerExecutionSummary;
import com.coresolution.core.repository.SchedulerExecutionLogRepository;
import com.coresolution.core.repository.SchedulerExecutionSummaryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 스케줄러 실행 로그 서비스
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-12-02
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SchedulerExecutionLogService {
    
    private final SchedulerExecutionLogRepository logRepository;
    private final SchedulerExecutionSummaryRepository summaryRepository;
    
    /**
     * 실행 로그 저장
     */
    @Transactional
    public void saveExecutionLog(
        String executionId,
        String tenantId,
        String schedulerName,
        String status,
        String resultData
    ) {
        try {
            SchedulerExecutionLog log = SchedulerExecutionLog.builder()
                .executionId(executionId)
                .tenantId(tenantId)
                .schedulerName(schedulerName)
                .status(status)
                .resultData(resultData)
                .startedAt(LocalDateTime.now())
                .build();
            
            logRepository.save(log);
            
        } catch (Exception e) {
            log.error("스케줄러 실행 로그 저장 실패: executionId={}, schedulerName={}", 
                executionId, schedulerName, e);
        }
    }
    
    /**
     * 실행 로그 저장 (에러 포함)
     */
    @Transactional
    public void saveExecutionLog(
        String executionId,
        String tenantId,
        String schedulerName,
        String status,
        String resultData,
        String errorMessage
    ) {
        try {
            SchedulerExecutionLog log = SchedulerExecutionLog.builder()
                .executionId(executionId)
                .tenantId(tenantId)
                .schedulerName(schedulerName)
                .status(status)
                .resultData(resultData)
                .errorMessage(errorMessage)
                .startedAt(LocalDateTime.now())
                .completedAt(LocalDateTime.now())
                .build();
            
            logRepository.save(log);
            
        } catch (Exception e) {
            log.error("스케줄러 실행 로그 저장 실패: executionId={}, schedulerName={}", 
                executionId, schedulerName, e);
        }
    }
    
    /**
     * 실행 요약 저장
     */
    @Transactional
    public void saveSummaryLog(
        String executionId,
        String schedulerName,
        int successCount,
        int failureCount,
        long durationMs
    ) {
        try {
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime startTime = now.minusSeconds(durationMs / 1000);
            
            SchedulerExecutionSummary summary = SchedulerExecutionSummary.builder()
                .executionId(executionId)
                .schedulerName(schedulerName)
                .totalTenants(successCount + failureCount)
                .successCount(successCount)
                .failureCount(failureCount)
                .totalDuration(durationMs)
                .startedAt(startTime)
                .completedAt(now)
                .build();
            
            summaryRepository.save(summary);
            
        } catch (Exception e) {
            log.error("스케줄러 실행 요약 저장 실패: executionId={}, schedulerName={}", 
                executionId, schedulerName, e);
        }
    }
    
    /**
     * 스케줄러 실행 이력 조회
     */
    public List<SchedulerExecutionSummary> getExecutionHistory(
        String schedulerName,
        LocalDateTime startDate,
        LocalDateTime endDate
    ) {
        return summaryRepository.findBySchedulerNameAndStartedAtBetweenOrderByStartedAtDesc(
            schedulerName, startDate, endDate
        );
    }
    
    /**
     * 최근 실패한 스케줄러 조회
     */
    public List<SchedulerExecutionLog> getFailuresSince(LocalDateTime since) {
        return logRepository.findByStatusAndStartedAtAfterOrderByStartedAtDesc("FAILED", since);
    }
    
    /**
     * 스케줄러 통계 조회
     */
    public SchedulerStatistics getStatistics(
        String schedulerName,
        LocalDateTime startDate,
        LocalDateTime endDate
    ) {
        List<SchedulerExecutionSummary> summaries = summaryRepository
            .findBySchedulerNameAndStartedAtBetweenOrderByStartedAtDesc(
                schedulerName, startDate, endDate
            );
        
        if (summaries.isEmpty()) {
            return SchedulerStatistics.builder()
                .schedulerName(schedulerName)
                .startDate(startDate)
                .endDate(endDate)
                .totalExecutions(0)
                .successfulExecutions(0)
                .failedExecutions(0)
                .successRate(0.0)
                .averageDuration(0L)
                .minDuration(0L)
                .maxDuration(0L)
                .totalTenantsProcessed(0)
                .averageTenantsPerExecution(0)
                .build();
        }
        
        int totalExecutions = summaries.size();
        int successfulExecutions = (int) summaries.stream()
            .filter(s -> s.getFailureCount() == 0)
            .count();
        int failedExecutions = totalExecutions - successfulExecutions;
        
        double successRate = (double) successfulExecutions / totalExecutions;
        
        long totalDuration = summaries.stream()
            .mapToLong(SchedulerExecutionSummary::getTotalDuration)
            .sum();
        long averageDuration = totalDuration / totalExecutions;
        long minDuration = summaries.stream()
            .mapToLong(SchedulerExecutionSummary::getTotalDuration)
            .min()
            .orElse(0L);
        long maxDuration = summaries.stream()
            .mapToLong(SchedulerExecutionSummary::getTotalDuration)
            .max()
            .orElse(0L);
        
        int totalTenantsProcessed = summaries.stream()
            .mapToInt(SchedulerExecutionSummary::getTotalTenants)
            .sum();
        int averageTenantsPerExecution = totalTenantsProcessed / totalExecutions;
        
        return SchedulerStatistics.builder()
            .schedulerName(schedulerName)
            .startDate(startDate)
            .endDate(endDate)
            .totalExecutions(totalExecutions)
            .successfulExecutions(successfulExecutions)
            .failedExecutions(failedExecutions)
            .successRate(successRate)
            .averageDuration(averageDuration)
            .minDuration(minDuration)
            .maxDuration(maxDuration)
            .totalTenantsProcessed(totalTenantsProcessed)
            .averageTenantsPerExecution(averageTenantsPerExecution)
            .build();
    }
    
    /**
     * 스케줄러 통계 DTO
     */
    @lombok.Data
    @lombok.Builder
    public static class SchedulerStatistics {
        private String schedulerName;
        private LocalDateTime startDate;
        private LocalDateTime endDate;
        
        private int totalExecutions;
        private int successfulExecutions;
        private int failedExecutions;
        
        private double successRate;
        private long averageDuration;
        private long minDuration;
        private long maxDuration;
        
        private int totalTenantsProcessed;
        private int averageTenantsPerExecution;
    }
}

