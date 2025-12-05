package com.coresolution.consultation.entity;

import java.time.LocalDateTime;
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

 /**
 * ERP 동기화 로그 엔티티
 /**
 * ERP 시스템과의 데이터 동기화 이력 관리
 /**
 * 
 /**
 * @author MindGarden
 /**
 * @version 1.0.0
 /**
 * @since 2025-09-24
 */
@Entity
@Table(name = "erp_sync_log",
    indexes = {
        @Index(name = "idx_erp_sync_type_date", columnList = "syncType, syncDate"),
        @Index(name = "idx_erp_sync_status", columnList = "status")
    })
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ErpSyncLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "tenant_id", length = 100)
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
    @Column(name = "status", length = 20)
    @Builder.Default
    private SyncStatus status = SyncStatus.STARTED;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "started_at")
    @Builder.Default
    private LocalDateTime startedAt = LocalDateTime.now();

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "duration_seconds")
    private Long durationSeconds;

    public enum SyncType {
        FINANCIAL("재무데이터"),
        SALARY("급여데이터"),
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
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
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
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
        this.status = SyncStatus.IN_PROGRESS;
    }

    private void calculateDuration() {
        if (startedAt != null && completedAt != null) {
            this.durationSeconds = java.time.Duration.between(startedAt, completedAt).getSeconds();
        }
    }

    public boolean isSuccessful() {
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
        return SyncStatus.COMPLETED.equals(this.status);
    }

    public double getProcessingRate() {
        if (durationSeconds != null && durationSeconds > 0 && recordsProcessed != null && recordsProcessed > 0) {
            return recordsProcessed.doubleValue() / durationSeconds;
        }
        return 0.0;
    }
}
