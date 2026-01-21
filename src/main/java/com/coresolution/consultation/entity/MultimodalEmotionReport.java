package com.coresolution.consultation.entity;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import jakarta.persistence.*;

import java.math.BigDecimal;

/**
 * 멀티모달 감정 통합 리포트 엔티티
 *
 * 음성, 비디오, 텍스트 분석 결과를 통합하여 종합적인 감정 상태 평가
 *
 * @author MindGarden
 * @version 1.0.0
 * @since 2026-01-21
 */
@Entity
@Table(name = "multimodal_emotion_reports")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
public class MultimodalEmotionReport extends BaseEntity {

    @Column(name = "consultation_record_id", nullable = false)
    private Long consultationRecordId;

    // 참조 ID
    @Column(name = "voice_biomarker_id")
    private Long voiceBiomarkerId;

    @Column(name = "video_emotion_id")
    private Long videoEmotionId;

    @Column(name = "text_emotion_id")
    private Long textEmotionId;

    // 통합 감정 분석
    @Column(name = "overall_emotion", length = 50)
    private String overallEmotion;

    @Column(name = "emotion_confidence", precision = 3, scale = 2)
    private BigDecimal emotionConfidence;

    // 3가지 모달리티 점수
    @Column(name = "voice_emotion_score", precision = 3, scale = 2)
    private BigDecimal voiceEmotionScore;

    @Column(name = "video_emotion_score", precision = 3, scale = 2)
    private BigDecimal videoEmotionScore;

    @Column(name = "text_emotion_score", precision = 3, scale = 2)
    private BigDecimal textEmotionScore;

    // 통합 지표
    @Column(name = "stress_index", precision = 3, scale = 2)
    private BigDecimal stressIndex;

    @Column(name = "anxiety_index", precision = 3, scale = 2)
    private BigDecimal anxietyIndex;

    @Column(name = "depression_index", precision = 3, scale = 2)
    private BigDecimal depressionIndex;

    @Column(name = "energy_index", precision = 3, scale = 2)
    private BigDecimal energyIndex;

    // 위험도 평가
    @Column(name = "overall_risk_level", length = 20)
    private String overallRiskLevel;  // CRITICAL, HIGH, MEDIUM, LOW

    @Column(name = "risk_factors", columnDefinition = "JSON")
    private String riskFactors;

    // AI 분석 요약
    @Lob
    @Column(name = "ai_summary", columnDefinition = "TEXT")
    private String aiSummary;

    @Lob
    @Column(name = "recommendations", columnDefinition = "TEXT")
    private String recommendations;

    // 분석 메타 정보
    @Column(name = "modalities_used", length = 100)
    private String modalitiesUsed;

    @Column(name = "total_processing_time_ms")
    private Integer totalProcessingTimeMs;

    /**
     * 고위험 상태인지 확인
     */
    public boolean isHighRisk() {
        return "CRITICAL".equals(overallRiskLevel)
            || "HIGH".equals(overallRiskLevel);
    }

    /**
     * 3가지 모달리티가 모두 수집되었는지 확인
     */
    public boolean isCompleteMultimodal() {
        return voiceBiomarkerId != null
            && videoEmotionId != null
            && textEmotionId != null;
    }

    /**
     * 평균 감정 점수 계산
     */
    public BigDecimal getAverageEmotionScore() {
        int count = 0;
        BigDecimal sum = BigDecimal.ZERO;

        if (voiceEmotionScore != null) {
            sum = sum.add(voiceEmotionScore);
            count++;
        }
        if (videoEmotionScore != null) {
            sum = sum.add(videoEmotionScore);
            count++;
        }
        if (textEmotionScore != null) {
            sum = sum.add(textEmotionScore);
            count++;
        }

        return count > 0 ? sum.divide(new BigDecimal(count), 2, java.math.RoundingMode.HALF_UP) : BigDecimal.ZERO;
    }
}
