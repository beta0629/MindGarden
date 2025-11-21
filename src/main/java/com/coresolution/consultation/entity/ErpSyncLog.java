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
 * ERP 시스템과의 데이터 동기화 이력 관리
 * 
 * @author MindGarden
 * @version 1.0.0
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

    // 동기화 타입 enum
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

    // 동기화 상태 enum
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

    // 동기화 완료 처리
    public void markAsCompleted(int recordsProcessed) {
        this.status = SyncStatus.COMPLETED;
        this.recordsProcessed = recordsProcessed;
        this.completedAt = LocalDateTime.now();
        calculateDuration();
    }

    // 동기화 실패 처리
    public void markAsFailed(String errorMessage) {
        this.status = SyncStatus.FAILED;
        this.errorMessage = errorMessage;
        this.completedAt = LocalDateTime.now();
        calculateDuration();
    }

    // 진행 중으로 상태 변경
    public void markAsInProgress() {
        this.status = SyncStatus.IN_PROGRESS;
    }

    // 소요 시간 계산
    private void calculateDuration() {
        if (startedAt != null && completedAt != null) {
            this.durationSeconds = java.time.Duration.between(startedAt, completedAt).getSeconds();
        }
    }

    // 성공 여부 확인
    public boolean isSuccessful() {
        return SyncStatus.COMPLETED.equals(this.status);
    }

    // 처리 속도 계산 (레코드/초)
    public double getProcessingRate() {
        if (durationSeconds != null && durationSeconds > 0 && recordsProcessed != null && recordsProcessed > 0) {
            return recordsProcessed.doubleValue() / durationSeconds;
        }
        return 0.0;
    }
}
