package com.coresolution.consultation.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;

/**
 * 음성 바이오마커 엔티티
 *
 * 음성 톤, 속도, 피치, 볼륨 등을 분석하여 우울/불안 징후 추적
 *
 * @author MindGarden
 * @version 1.0.0
 * @since 2026-01-21
 */
@Entity
@Table(name = "voice_biomarkers")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
public class VoiceBiomarker extends BaseEntity {

    @Column(name = "consultation_record_id", nullable = false)
    private Long consultationRecordId;

    @Column(name = "audio_file_id")
    private Long audioFileId;

    // 음성 특징
    @Column(name = "pitch_mean", precision = 6, scale = 2)
    private BigDecimal pitchMean;

    @Column(name = "pitch_std", precision = 6, scale = 2)
    private BigDecimal pitchStd;

    @Column(name = "pitch_min", precision = 6, scale = 2)
    private BigDecimal pitchMin;

    @Column(name = "pitch_max", precision = 6, scale = 2)
    private BigDecimal pitchMax;

    @Column(name = "speech_rate_wpm")
    private Integer speechRateWpm;

    @Column(name = "pause_count")
    private Integer pauseCount;

    @Column(name = "avg_pause_duration", precision = 5, scale = 2)
    private BigDecimal avgPauseDuration;

    @Column(name = "volume_mean", precision = 5, scale = 2)
    private BigDecimal volumeMean;

    @Column(name = "volume_std", precision = 5, scale = 2)
    private BigDecimal volumeStd;

    @Column(name = "tremor_detected")
    private Boolean tremorDetected;

    @Column(name = "tremor_frequency", precision = 5, scale = 2)
    private BigDecimal tremorFrequency;

    // 감정 지표
    @Column(name = "stress_score", precision = 3, scale = 2)
    private BigDecimal stressScore;

    @Column(name = "anxiety_score", precision = 3, scale = 2)
    private BigDecimal anxietyScore;

    @Column(name = "depression_score", precision = 3, scale = 2)
    private BigDecimal depressionScore;

    @Column(name = "energy_level", precision = 3, scale = 2)
    private BigDecimal energyLevel;

    // 분석 메타 정보
    @Column(name = "analysis_engine", length = 50)
    private String analysisEngine;

    @Column(name = "processing_time_ms")
    private Integer processingTimeMs;

    @Column(name = "confidence_score", precision = 3, scale = 2)
    private BigDecimal confidenceScore;

    /**
     * 음성 바이오마커가 정상 범위인지 확인
     */
    public boolean isWithinNormalRange() {
        // 정상 범위: 말 속도 120-180 wpm, 불안 점수 < 0.5
        return speechRateWpm != null
            && speechRateWpm >= 120
            && speechRateWpm <= 180
            && (anxietyScore == null || anxietyScore.compareTo(new BigDecimal("0.5")) < 0);
    }

    /**
     * 고위험 바이오마커 감지
     */
    public boolean isHighRisk() {
        return (depressionScore != null && depressionScore.compareTo(new BigDecimal("0.7")) > 0)
            || (anxietyScore != null && anxietyScore.compareTo(new BigDecimal("0.7")) > 0)
            || (tremorDetected != null && tremorDetected);
    }
}
