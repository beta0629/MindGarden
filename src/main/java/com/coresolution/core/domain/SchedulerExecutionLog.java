package com.coresolution.core.domain;

import java.time.LocalDateTime;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 스케줄러 실행 로그 엔티티
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-12-02
 */
@Entity
@Table(name = "scheduler_execution_log",
    indexes = {
        @Index(name = "idx_execution_id", columnList = "execution_id"),
        @Index(name = "idx_tenant_id", columnList = "tenant_id"),
        @Index(name = "idx_scheduler_name", columnList = "scheduler_name"),
        @Index(name = "idx_status", columnList = "status"),
        @Index(name = "idx_started_at", columnList = "started_at")
    }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SchedulerExecutionLog {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "execution_id", nullable = false, length = 50)
    private String executionId;
    
    @Column(name = "tenant_id", length = 64)
    private String tenantId;
    
    @Column(name = "scheduler_name", nullable = false, length = 100)
    private String schedulerName;
    
    @Column(name = "status", nullable = false, length = 20)
    private String status; // SUCCESS, FAILED, RUNNING
    
    @Column(name = "result_data", columnDefinition = "JSON")
    private String resultData;
    
    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;
    
    @Column(name = "execution_time")
    private Long executionTime; // ms
    
    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt;
    
    @Column(name = "completed_at")
    private LocalDateTime completedAt;
    
    // 주의: processed_count 컬럼은 DB에 없으므로 제거됨
    // 처리된 항목 수는 result_data JSON 필드에 저장하거나 별도 테이블 사용
    
    // ===== 편의 메서드 =====
    
    /**
     * executedAt은 startedAt의 별칭
     */
    public LocalDateTime getExecutedAt() {
        return startedAt;
    }
    
    public void setExecutedAt(LocalDateTime executedAt) {
        this.startedAt = executedAt;
    }
    
    /**
     * jobName은 schedulerName의 별칭
     */
    public String getJobName() {
        return schedulerName;
    }
    
    public void setJobName(String jobName) {
        this.schedulerName = jobName;
    }
    
    /**
     * durationMs는 executionTime의 별칭
     */
    public Long getDurationMs() {
        return executionTime;
    }
    
    public void setDurationMs(Long durationMs) {
        this.executionTime = durationMs;
    }
}

