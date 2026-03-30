package com.coresolution.core.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * 스케줄러 실행 요약 엔티티
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-12-02
 */
@Entity
@Table(name = "scheduler_execution_summary",
    indexes = {
        @Index(name = "idx_execution_id", columnList = "execution_id"),
        @Index(name = "idx_scheduler_name", columnList = "scheduler_name"),
        @Index(name = "idx_started_at", columnList = "started_at")
    }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SchedulerExecutionSummary {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "execution_id", unique = true, nullable = false, length = 50)
    private String executionId;
    
    @Column(name = "scheduler_name", nullable = false, length = 100)
    private String schedulerName;
    
    @Column(name = "total_tenants", nullable = false)
    private Integer totalTenants;
    
    @Column(name = "success_count", nullable = false)
    private Integer successCount;
    
    @Column(name = "failure_count", nullable = false)
    private Integer failureCount;
    
    @Column(name = "total_duration", nullable = false)
    private Long totalDuration; // ms
    
    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt;
    
    @Column(name = "completed_at", nullable = false)
    private LocalDateTime completedAt;
}

