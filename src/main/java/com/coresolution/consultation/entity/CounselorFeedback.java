package com.coresolution.consultation.entity;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 상담사 피드백 엔티티
 *
 * @author MindGarden
 * @version 1.0.0
 * @since 2026-01-21
 */
@Entity
@Table(name = "counselor_feedbacks")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
public class CounselorFeedback extends BaseEntity {

    @Column(name = "consultant_id", nullable = false)
    private Long consultantId;

    @Column(name = "consultation_record_id")
    private Long consultationRecordId;

    // 상담 기법 평가
    @Column(name = "empathic_listening_score", precision = 3, scale = 2)
    private BigDecimal empathicListeningScore;

    @Column(name = "questioning_technique_score", precision = 3, scale = 2)
    private BigDecimal questioningTechniqueScore;

    @Column(name = "intervention_timing_score", precision = 3, scale = 2)
    private BigDecimal interventionTimingScore;

    @Column(name = "rapport_building_score", precision = 3, scale = 2)
    private BigDecimal rapportBuildingScore;

    // 전체 평가
    @Column(name = "overall_performance_score", precision = 3, scale = 2)
    private BigDecimal overallPerformanceScore;

    @Column(name = "performance_level", length = 20)
    private String performanceLevel;

    // 강점 및 개선 영역
    @Column(name = "strengths", columnDefinition = "JSON")
    private String strengths;

    @Column(name = "areas_for_improvement", columnDefinition = "JSON")
    private String areasForImprovement;

    // AI 생성 피드백
    @Lob
    @Column(name = "ai_feedback_summary", columnDefinition = "TEXT")
    private String aiFeedbackSummary;

    @Lob
    @Column(name = "specific_recommendations", columnDefinition = "TEXT")
    private String specificRecommendations;

    @Column(name = "example_responses", columnDefinition = "JSON")
    private String exampleResponses;

    // 분석 메타 정보
    @Column(name = "analysis_model", length = 100)
    private String analysisModel;

    @Column(name = "feedback_date")
    private LocalDateTime feedbackDate;
}
