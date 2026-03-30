package com.coresolution.core.repository;

import com.coresolution.core.domain.SchedulerExecutionSummary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * 스케줄러 실행 요약 Repository
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-12-02
 */
@Repository
public interface SchedulerExecutionSummaryRepository extends JpaRepository<SchedulerExecutionSummary, Long> {
    
    /**
     * 실행 ID로 조회
     */
    Optional<SchedulerExecutionSummary> findByExecutionId(String executionId);
    
    /**
     * 스케줄러명으로 조회
     */
    List<SchedulerExecutionSummary> findBySchedulerNameOrderByStartedAtDesc(String schedulerName);
    
    /**
     * 스케줄러명과 기간으로 조회
     */
    List<SchedulerExecutionSummary> findBySchedulerNameAndStartedAtBetweenOrderByStartedAtDesc(
        String schedulerName,
        LocalDateTime startDate,
        LocalDateTime endDate
    );
    
    /**
     * 최근 N개 조회
     */
    List<SchedulerExecutionSummary> findTop10BySchedulerNameOrderByStartedAtDesc(String schedulerName);
}

