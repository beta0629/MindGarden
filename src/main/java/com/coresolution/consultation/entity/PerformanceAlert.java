package com.coresolution.consultation.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;
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
 * 성과 알림 엔티티
 * 상담사 성과 저하 시 자동 알림 생성
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-24
 */
@Entity
@Table(name = "performance_alerts",
    indexes = {
        @Index(name = "idx_alerts_level_status", columnList = "alertLevel, status"),
        @Index(name = "idx_alerts_created", columnList = "createdAt"),
        @Index(name = "idx_alerts_consultant", columnList = "consultantId")
    })
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PerformanceAlert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "consultant_id", nullable = false)
    private Long consultantId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "consultant_id", insertable = false, updatable = false)
    private User consultant;

    @Column(name = "consultant_name", length = 100)
    private String consultantName;

    @Enumerated(EnumType.STRING)
    @Column(name = "alert_level", nullable = false, length = 20)
    private AlertLevel alertLevel;

    @Column(name = "completion_rate", precision = 5, scale = 2)
    private BigDecimal completionRate;

    @Column(name = "alert_message", columnDefinition = "TEXT")
    private String alertMessage;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20)
    @Builder.Default
    private AlertStatus status = AlertStatus.PENDING;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    @Column(name = "read_at")
    private LocalDateTime readAt;

    // 알림 레벨 enum
    public enum AlertLevel {
        CRITICAL("위험"),
        WARNING("경고"),
        INFO("정보");

        private final String koreanName;

        AlertLevel(String koreanName) {
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
        DISMISSED("무시");

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
        this.sentAt = LocalDateTime.now();
    }

    // 알림 읽음 처리
    public void markAsRead() {
        this.status = AlertStatus.READ;
        this.readAt = LocalDateTime.now();
    }

    // 알림 무시 처리
    public void markAsDismissed() {
        this.status = AlertStatus.DISMISSED;
    }

    // 중요도 점수 반환 (정렬용)
    public int getPriorityScore() {
        switch (alertLevel) {
            case CRITICAL:
                return 3;
            case WARNING:
                return 2;
            case INFO:
                return 1;
            default:
                return 0;
        }
    }
}
