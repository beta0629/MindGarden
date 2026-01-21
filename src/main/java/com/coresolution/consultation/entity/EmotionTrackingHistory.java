package com.coresolution.consultation.entity;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 감정 변화 추적 엔티티
 *
 * 상담 회기별 감정 변화를 시계열로 추적
 *
 * @author MindGarden
 * @version 1.0.0
 * @since 2026-01-21
 */
@Entity
@Table(name = "emotion_tracking_history")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
public class EmotionTrackingHistory extends BaseEntity {

    @Column(name = "client_id", nullable = false)
    private Long clientId;

    @Column(name = "consultation_record_id", nullable = false)
    private Long consultationRecordId;

    // 감정 점수 (세션별)
    @Column(name = "session_number")
    private Integer sessionNumber;

    @Column(name = "emotion_type", length = 50)
    private String emotionType;

    @Column(name = "emotion_score", precision = 3, scale = 2)
    private BigDecimal emotionScore;

    // 변화 추이
    @Column(name = "score_change_from_previous", precision = 3, scale = 2)
    private BigDecimal scoreChangeFromPrevious;

    @Column(name = "trend", length = 20)
    private String trend;  // IMPROVING, STABLE, WORSENING

    @Column(name = "measured_at")
    private LocalDateTime measuredAt;

    /**
     * 호전 중인지 확인
     */
    public boolean isImproving() {
        return "IMPROVING".equals(trend)
            && scoreChangeFromPrevious != null
            && scoreChangeFromPrevious.compareTo(new BigDecimal("0.1")) > 0;
    }

    /**
     * 악화 중인지 확인
     */
    public boolean isWorsening() {
        return "WORSENING".equals(trend)
            && scoreChangeFromPrevious != null
            && scoreChangeFromPrevious.compareTo(new BigDecimal("-0.1")) < 0;
    }
}
