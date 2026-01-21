package com.coresolution.consultation.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * 음성 전사 결과 엔티티
 * Google Speech-to-Text API 등을 통해 생성된 음성 전사 결과 저장
 *
 * @author MindGarden
 * @version 1.0.0
 * @since 2026-01-21
 */
@Entity
@Table(name = "audio_transcriptions", indexes = {
    @Index(name = "idx_audio_file_id", columnList = "audio_file_id"),
    @Index(name = "idx_ai_provider", columnList = "ai_provider"),
    @Index(name = "idx_created_at", columnList = "created_at")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AudioTranscription {

    @jakarta.persistence.Id
    @jakarta.persistence.GeneratedValue(strategy = jakarta.persistence.GenerationType.IDENTITY)
    @Column(name = "id", nullable = false, updatable = false)
    private Long id;

    @NotNull(message = "음성 파일 ID는 필수입니다.")
    @Column(name = "audio_file_id", nullable = false)
    private Long audioFileId;

    // 전사 내용
    @Column(name = "transcription_text", columnDefinition = "LONGTEXT")
    private String transcriptionText;

    @Column(name = "confidence_score", precision = 5, scale = 2)
    private BigDecimal confidenceScore; // 0-100 신뢰도 점수

    @Column(name = "language_code", length = 10)
    @Builder.Default
    private String languageCode = "ko-KR";

    // 처리 정보
    @Column(name = "processing_time_ms")
    private Integer processingTimeMs;

    @Column(name = "ai_provider", length = 50)
    @Builder.Default
    private String aiProvider = "GOOGLE_SPEECH"; // GOOGLE_SPEECH, WHISPER, 등

    @Column(name = "ai_model_used", length = 100)
    private String aiModelUsed;

    // 화자 분리 (JSON 형식)
    @Column(name = "speaker_labels", columnDefinition = "JSON")
    private String speakerLabels;

    // 생성 시간
    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private java.time.LocalDateTime createdAt = java.time.LocalDateTime.now();

    // 비즈니스 메서드

    /**
     * 신뢰도 점수 설정 (0-100 범위 검증)
     */
    public void setConfidenceScore(BigDecimal score) {
        if (score != null) {
            if (score.compareTo(BigDecimal.ZERO) < 0) {
                this.confidenceScore = BigDecimal.ZERO;
            } else if (score.compareTo(new BigDecimal("100")) > 0) {
                this.confidenceScore = new BigDecimal("100");
            } else {
                this.confidenceScore = score;
            }
        }
    }

    /**
     * 신뢰도 점수를 백분율 문자열로 반환
     */
    public String getConfidenceScorePercentage() {
        if (confidenceScore == null) {
            return "N/A";
        }
        return confidenceScore.intValue() + "%";
    }

    /**
     * 높은 신뢰도 여부 (80% 이상)
     */
    public boolean isHighConfidence() {
        return confidenceScore != null && confidenceScore.compareTo(new BigDecimal("80")) >= 0;
    }

    /**
     * 전사 텍스트 길이
     */
    public int getTextLength() {
        return transcriptionText != null ? transcriptionText.length() : 0;
    }

    /**
     * 전사 텍스트 단어 수 (공백 기준)
     */
    public int getWordCount() {
        if (transcriptionText == null || transcriptionText.trim().isEmpty()) {
            return 0;
        }
        return transcriptionText.trim().split("\\s+").length;
    }

    /**
     * 처리 시간을 초 단위로 반환
     */
    public double getProcessingTimeInSeconds() {
        if (processingTimeMs == null) {
            return 0.0;
        }
        return processingTimeMs / 1000.0;
    }

    /**
     * 전사 텍스트가 비어있는지 확인
     */
    public boolean isEmpty() {
        return transcriptionText == null || transcriptionText.trim().isEmpty();
    }

    @Override
    public String toString() {
        return "AudioTranscription{" +
                "id=" + id +
                ", audioFileId=" + audioFileId +
                ", textLength=" + getTextLength() +
                ", confidenceScore=" + confidenceScore +
                ", languageCode='" + languageCode + '\'' +
                ", aiProvider='" + aiProvider + '\'' +
                ", processingTimeMs=" + processingTimeMs +
                '}';
    }
}
