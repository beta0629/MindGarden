package com.coresolution.consultation.entity;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import jakarta.persistence.*;

import java.math.BigDecimal;

/**
 * 비디오 감정 분석 엔티티
 *
 * 영상 상담 시 표정, 시선, 자세 등 비언어적 신호 분석
 *
 * @author MindGarden
 * @version 1.0.0
 * @since 2026-01-21
 */
@Entity
@Table(name = "video_emotion_analysis")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
public class VideoEmotionAnalysis extends BaseEntity {

    @Column(name = "consultation_record_id", nullable = false)
    private Long consultationRecordId;

    @Column(name = "video_file_path", length = 500)
    private String videoFilePath;

    // 전체 감정 요약
    @Column(name = "dominant_emotion", length = 50)
    private String dominantEmotion;

    @Column(name = "emotion_timeline", columnDefinition = "JSON")
    private String emotionTimeline;

    // 개별 감정 평균 점수
    @Column(name = "avg_joy", precision = 3, scale = 2)
    private BigDecimal avgJoy;

    @Column(name = "avg_sorrow", precision = 3, scale = 2)
    private BigDecimal avgSorrow;

    @Column(name = "avg_anger", precision = 3, scale = 2)
    private BigDecimal avgAnger;

    @Column(name = "avg_surprise", precision = 3, scale = 2)
    private BigDecimal avgSurprise;

    @Column(name = "avg_fear", precision = 3, scale = 2)
    private BigDecimal avgFear;

    @Column(name = "avg_disgust", precision = 3, scale = 2)
    private BigDecimal avgDisgust;

    // 비언어적 신호
    @Column(name = "gaze_direction_changes")
    private Integer gazeDirectionChanges;

    @Column(name = "avg_gaze_confidence", precision = 3, scale = 2)
    private BigDecimal avgGazeConfidence;

    @Column(name = "posture_changes")
    private Integer postureChanges;

    // 분석 메타 정보
    @Column(name = "analysis_engine", length = 50)
    private String analysisEngine;

    @Column(name = "video_duration_seconds")
    private Integer videoDurationSeconds;

    @Column(name = "frames_analyzed")
    private Integer framesAnalyzed;

    @Column(name = "processing_time_ms")
    private Integer processingTimeMs;

    /**
     * 부정적 감정이 우세한지 확인
     */
    public boolean isNegativeEmotionDominant() {
        if (avgSorrow == null && avgAnger == null && avgFear == null) {
            return false;
        }

        BigDecimal negativeSum = BigDecimal.ZERO;
        if (avgSorrow != null) negativeSum = negativeSum.add(avgSorrow);
        if (avgAnger != null) negativeSum = negativeSum.add(avgAnger);
        if (avgFear != null) negativeSum = negativeSum.add(avgFear);

        BigDecimal positiveSum = avgJoy != null ? avgJoy : BigDecimal.ZERO;

        return negativeSum.compareTo(positiveSum) > 0;
    }
}
