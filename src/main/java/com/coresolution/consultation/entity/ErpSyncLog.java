package com.coresolution.consultation.entity;

import java.time.LocalDateTime;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

/**
 * ERP 동기화 로그 엔티티. 물리 테이블 {@code erp_sync_logs}와 급여 ERP 프로시저 INSERT/UPDATE 정합.
 *
 * @author MindGarden
 * @since 2025-09-24
 */
@Entity
@Table(name = "erp_sync_logs",
    indexes = {
        @Index(name = "idx_erp_sync_logs_tenant_date", columnList = "tenant_id, sync_date"),
        @Index(name = "idx_erp_sync_logs_tenant_status", columnList = "tenant_id, status"),
        @Index(name = "idx_erp_sync_logs_tenant_sync_type", columnList = "tenant_id, sync_type")
    })
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ErpSyncLog {

    /**
     * 전역 스케줄러가 테넌트 컨텍스트 없이 적재하는 집계 로그용 식별자(실제 테넌트 ID와 구분).
     */
    public static final String PLATFORM_AGGREGATE_TENANT_ID = "__mg_platform_aggregate__";

    /** 스케줄러가 {@link #createdBy}/{@link #updatedBy}에 넣는 감사 주체 식별자. */
    public static final String SCHEDULER_AUDIT_ACTOR = "SYSTEM";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false, length = 100)
    private String tenantId;

    @Enumerated(EnumType.STRING)
    @Column(name = "sync_type", nullable = false, length = 50)
    private SyncType syncType;

    @Column(name = "sync_date", nullable = false)
    @Builder.Default
    private LocalDateTime syncDate = LocalDateTime.now();

    @Column(name = "records_processed")
    @Builder.Default
    private Integer recordsProcessed = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private SyncStatus status = SyncStatus.PENDING;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "started_at")
    @Builder.Default
    private LocalDateTime startedAt = LocalDateTime.now();

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "duration_seconds")
    private Long durationSeconds;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "sync_data", columnDefinition = "json")
    private JsonNode syncData;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "created_by", length = 50)
    private String createdBy;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "updated_by", length = 50)
    private String updatedBy;

    public enum SyncType {
        FINANCIAL("재무데이터"),
        SALARY("급여데이터"),
        SALARY_APPROVAL("급여승인"),
        SALARY_PAYMENT("급여지급"),
        INVENTORY("재고데이터"),
        CUSTOMER("고객데이터"),
        FULL_SYNC("전체동기화");

        private final String koreanName;

        SyncType(String koreanName) {
            this.koreanName = koreanName;
        }

        public String getKoreanName() {
            return koreanName;
        }
    }

    public enum SyncStatus {
        PENDING("대기"),
        STARTED("시작"),
        IN_PROGRESS("진행중"),
        COMPLETED("완료"),
        FAILED("실패"),
        CANCELLED("취소");

        private final String koreanName;

        SyncStatus(String koreanName) {
            this.koreanName = koreanName;
        }

        public String getKoreanName() {
            return koreanName;
        }
    }

    public void markAsCompleted(int recordsProcessed) {
        this.status = SyncStatus.COMPLETED;
        this.recordsProcessed = recordsProcessed;
        this.completedAt = LocalDateTime.now();
        calculateDuration();
    }

    public void markAsFailed(String errorMessage) {
        this.status = SyncStatus.FAILED;
        this.errorMessage = errorMessage;
        this.completedAt = LocalDateTime.now();
        calculateDuration();
    }

    public void markAsInProgress() {
        this.status = SyncStatus.IN_PROGRESS;
    }

    private void calculateDuration() {
        if (startedAt != null && completedAt != null) {
            this.durationSeconds = java.time.Duration.between(startedAt, completedAt).getSeconds();
        }
    }

    public boolean isSuccessful() {
        return SyncStatus.COMPLETED.equals(this.status);
    }

    public double getProcessingRate() {
        if (durationSeconds != null && durationSeconds > 0 && recordsProcessed != null && recordsProcessed > 0) {
            return recordsProcessed.doubleValue() / durationSeconds;
        }
        return 0.0;
    }
}
