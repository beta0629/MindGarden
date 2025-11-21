package com.coresolution.consultation.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 상담일지 미작성 알림 엔티티
 * 상담일지 미작성 시 자동 알림 생성
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-24
 */
@Entity
@Table(name = "consultation_record_alerts",
    indexes = {
        @Index(name = "idx_consultation_record_alerts_schedule", columnList = "scheduleId"),
        @Index(name = "idx_consultation_record_alerts_consultant", columnList = "consultantId"),
        @Index(name = "idx_consultation_record_alerts_date", columnList = "sessionDate"),
        @Index(name = "idx_consultation_record_alerts_status", columnList = "status"),
        @Index(name = "idx_consultation_record_alerts_type", columnList = "alertType"),
        @Index(name = "idx_consultation_record_alerts_created", columnList = "createdAt"),
        @Index(name = "idx_consultation_record_alerts_deleted", columnList = "isDeleted"),
        @Index(name = "idx_consultation_record_alerts_duplicate_check", 
               columnList = "scheduleId, consultantId, alertType, status, createdAt")
    })
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConsultationRecordAlert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "schedule_id", nullable = false)
    private Long scheduleId;

    @Column(name = "consultant_id", nullable = false)
    private Long consultantId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "consultant_id", insertable = false, updatable = false)
    private User consultant;

    @Column(name = "client_id")
    private Long clientId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", insertable = false, updatable = false)
    private User client;

    @Column(name = "session_date", nullable = false)
    private LocalDate sessionDate;

    @Column(name = "session_time")
    private LocalTime sessionTime;

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(name = "alert_type", nullable = false, length = 50)
    @Builder.Default
    private AlertType alertType = AlertType.MISSING_RECORD;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private AlertStatus status = AlertStatus.PENDING;

    @Column(name = "message", columnDefinition = "TEXT")
    private String message;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @Column(name = "is_deleted", nullable = false)
    @Builder.Default
    private Boolean isDeleted = false;

    // 알림 타입 enum
    public enum AlertType {
        MISSING_RECORD("상담일지 미작성"),
        OVERDUE_RECORD("상담일지 지연"),
        REMINDER("리마인더");

        private final String koreanName;

        AlertType(String koreanName) {
            this.koreanName = koreanName;
        }

        public String getKoreanName() {
            return koreanName;
        }
    }

    // 알림 상태 enum
    public enum AlertStatus {
        PENDING("대기"),
        SENT("발송완료"),
        READ("읽음"),
        DISMISSED("무시"),
        RESOLVED("해결됨");

        private final String koreanName;

        AlertStatus(String koreanName) {
            this.koreanName = koreanName;
        }

        public String getKoreanName() {
            return koreanName;
        }
    }

    // 알림 발송 처리
    public void markAsSent() {
        this.status = AlertStatus.SENT;
        this.updatedAt = LocalDateTime.now();
    }

    // 알림 읽음 처리
    public void markAsRead() {
        this.status = AlertStatus.READ;
        this.updatedAt = LocalDateTime.now();
    }

    // 알림 무시 처리
    public void markAsDismissed() {
        this.status = AlertStatus.DISMISSED;
        this.updatedAt = LocalDateTime.now();
    }

    // 알림 해결 처리
    public void markAsResolved() {
        this.status = AlertStatus.RESOLVED;
        this.updatedAt = LocalDateTime.now();
    }

    // 논리적 삭제 처리
    public void markAsDeleted() {
        this.isDeleted = true;
        this.updatedAt = LocalDateTime.now();
    }

    // 중요도 점수 반환 (정렬용)
    public int getPriorityScore() {
        switch (alertType) {
            case MISSING_RECORD:
                return 3;
            case OVERDUE_RECORD:
                return 2;
            case REMINDER:
                return 1;
            default:
                return 0;
        }
    }
}
