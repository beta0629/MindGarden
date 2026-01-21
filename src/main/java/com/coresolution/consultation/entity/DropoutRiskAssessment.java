package com.coresolution.consultation.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

/**
 * 중도 탈락 위험도 평가 엔티티
 *
 * @author MindGarden
 * @version 1.0.0
 * @since 2026-01-21
 */
@Entity
@Table(name = "dropout_risk_assessments")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
public class DropoutRiskAssessment extends BaseEntity {

    @Column(name = "client_id", nullable = false)
    private Long clientId;

    @Column(name = "consultation_id")
    private Long consultationId;

    // 탈락 위험도
    @Column(name = "dropout_risk_level", length = 20)
    private String dropoutRiskLevel; // CRITICAL, HIGH, MEDIUM, LOW

    @Column(name = "dropout_probability", precision = 3, scale = 2)
    private BigDecimal dropoutProbability;

    // 위험 요인
    @Column(name = "engagement_score", precision = 3, scale = 2)
    private BigDecimal engagementScore;

    @Column(name = "attendance_rate", precision = 3, scale = 2)
    private BigDecimal attendanceRate;

    @Column(name = "response_delay_hours", precision = 5, scale = 2)
    private BigDecimal responseDelayHours;

    @Column(name = "emotional_progress_stagnation")
    private Boolean emotionalProgressStagnation;

    // 위험 신호
    @Column(name = "warning_signs", columnDefinition = "JSON")
    private String warningSigns;

    @Column(name = "early_intervention_needed")
    private Boolean earlyInterventionNeeded;

    // 대응 전략
    @Column(name = "recommended_actions", columnDefinition = "JSON")
    private String recommendedActions;

    @Lob
    @Column(name = "intervention_strategies", columnDefinition = "TEXT")
    private String interventionStrategies;

    // 모델 정보
    @Column(name = "model_name", length = 100)
    private String modelName;

    @Column(name = "assessment_date")
    private LocalDateTime assessmentDate;

    /**
     * 조기 개입 필요 여부
     */
    public boolean needsEarlyIntervention() {
        return Boolean.TRUE.equals(earlyInterventionNeeded) || "CRITICAL".equals(dropoutRiskLevel)
                || (dropoutProbability != null
                        && dropoutProbability.compareTo(new BigDecimal("0.7")) > 0);
    }
}
