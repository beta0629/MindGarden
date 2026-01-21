package com.coresolution.consultation.entity;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import jakarta.persistence.*;

import java.math.BigDecimal;

/**
 * 텍스트 감정 분석 엔티티
 *
 * Google Natural Language API를 통한 감정 분석 및
 * Gemini를 통한 인지 왜곡 패턴 감지
 *
 * @author MindGarden
 * @version 1.0.0
 * @since 2026-01-21
 */
@Entity
@Table(name = "text_emotion_analysis")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
public class TextEmotionAnalysis extends BaseEntity {

    @Column(name = "consultation_record_id", nullable = false)
    private Long consultationRecordId;

    @Lob
    @Column(name = "source_text", columnDefinition = "LONGTEXT")
    private String sourceText;

    @Column(name = "source_type", length = 50)
    private String sourceType;  // TRANSCRIPTION, CHAT, NOTE

    // Google Natural Language API 감정 분석
    @Column(name = "sentiment_score", precision = 3, scale = 2)
    private BigDecimal sentimentScore;  // -1.0 ~ 1.0

    @Column(name = "sentiment_magnitude", precision = 5, scale = 2)
    private BigDecimal sentimentMagnitude;

    @Column(name = "sentiment_classification", length = 50)
    private String sentimentClassification;  // very_negative, negative, neutral, positive, very_positive

    // 문장별 감정 (JSON)
    @Column(name = "sentence_sentiments", columnDefinition = "JSON")
    private String sentenceSentiments;

    // 인지 왜곡 분석 (Gemini)
    @Column(name = "cognitive_distortions", columnDefinition = "JSON")
    private String cognitiveDistortions;

    @Column(name = "distortion_count")
    private Integer distortionCount;

    @Column(name = "distortion_risk_level", length = 20)
    private String distortionRiskLevel;  // HIGH, MEDIUM, LOW

    // 키워드 분석
    @Column(name = "negative_keywords", columnDefinition = "JSON")
    private String negativeKeywords;

    @Column(name = "positive_keywords", columnDefinition = "JSON")
    private String positiveKeywords;

    @Column(name = "cognitive_distortion_keywords", columnDefinition = "JSON")
    private String cognitiveDistortionKeywords;

    // 분석 메타 정보
    @Column(name = "analysis_engine", length = 50)
    private String analysisEngine;

    @Column(name = "ai_model_used", length = 100)
    private String aiModelUsed;

    @Column(name = "processing_time_ms")
    private Integer processingTimeMs;

    /**
     * 매우 부정적인 감정인지 확인
     */
    public boolean isVeryNegative() {
        return sentimentScore != null
            && sentimentScore.compareTo(new BigDecimal("-0.5")) < 0
            && sentimentMagnitude != null
            && sentimentMagnitude.compareTo(BigDecimal.ONE) > 0;
    }

    /**
     * 고위험 인지 왜곡 존재 여부
     */
    public boolean hasHighRiskDistortions() {
        return "HIGH".equals(distortionRiskLevel)
            || (distortionCount != null && distortionCount >= 5);
    }
}
