package com.coresolution.core.repository;

import java.time.LocalDateTime;
import java.util.List;
import com.coresolution.core.domain.SchedulerExecutionLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * 스케줄러 실행 로그 Repository
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-12-02
 */
@Repository
public interface SchedulerExecutionLogRepository extends JpaRepository<SchedulerExecutionLog, Long> {
    
    /**
     * 실행 ID로 조회
     */
    List<SchedulerExecutionLog> findByExecutionId(String executionId);
    
    /**
     * 스케줄러명으로 조회
     */
    List<SchedulerExecutionLog> findBySchedulerNameOrderByStartedAtDesc(String schedulerName);
    
    /**
     * 테넌트 ID와 스케줄러명으로 조회
     */
    List<SchedulerExecutionLog> findByTenantIdAndSchedulerNameOrderByStartedAtDesc(
        String tenantId, 
        String schedulerName
    );
    
    /**
     * 특정 기간 실패 조회
     */
    List<SchedulerExecutionLog> findByStatusAndStartedAtAfterOrderByStartedAtDesc(
        String status, 
        LocalDateTime since
    );
    
    /**
     * 스케줄러명과 기간으로 조회
     */
    List<SchedulerExecutionLog> findBySchedulerNameAndStartedAtBetweenOrderByStartedAtDesc(
        String schedulerName,
        LocalDateTime startDate,
        LocalDateTime endDate
    );
    
    /**
     * 최근 실행 내역 조회
     */
    List<SchedulerExecutionLog> findByStartedAtAfterOrderByStartedAtDesc(LocalDateTime since);
    
    /**
     * 테넌트별 최근 실행 내역 조회
     */
    List<SchedulerExecutionLog> findByTenantIdAndStartedAtAfterOrderByStartedAtDesc(String tenantId, LocalDateTime since);
    
    /**
     * 테넌트별 특정 시점 이후 조회
     */
    List<SchedulerExecutionLog> findByTenantIdAndStartedAtAfter(String tenantId, LocalDateTime since);
    
    /**
     * 기간별 조회
     */
    List<SchedulerExecutionLog> findByStartedAtBetween(LocalDateTime start, LocalDateTime end);
    
    /**
     * 테넌트별 기간별 조회
     */
    List<SchedulerExecutionLog> findByTenantIdAndStartedAtBetween(String tenantId, LocalDateTime start, LocalDateTime end);
    
    /**
     * 상태별 조회
     */
    List<SchedulerExecutionLog> findByStatusOrderByStartedAtDesc(String status);
    
    /**
     * 테넌트별 상태별 조회
     */
    List<SchedulerExecutionLog> findByTenantIdAndStatusOrderByStartedAtDesc(String tenantId, String status);
}

