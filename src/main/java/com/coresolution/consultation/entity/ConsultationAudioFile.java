package com.coresolution.consultation.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

/**
 * 상담 음성 파일 엔티티 상담 세션 중 녹음된 음성 파일의 메타데이터 관리
 *
 * @author MindGarden
 * @version 1.0.0
 * @since 2026-01-21
 */
@Entity
@Table(name = "consultation_audio_files",
        indexes = {@Index(name = "idx_consultation_id", columnList = "consultation_id"),
                @Index(name = "idx_consultation_record_id", columnList = "consultation_record_id"),
                @Index(name = "idx_tenant_id", columnList = "tenant_id"),
                @Index(name = "idx_transcription_status", columnList = "transcription_status"),
                @Index(name = "idx_created_at", columnList = "created_at")})
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
public class ConsultationAudioFile extends BaseEntity {

    @NotNull(message = "상담 ID는 필수입니다.")
    @Column(name = "consultation_id", nullable = false)
    private Long consultationId;

    @Column(name = "consultation_record_id")
    private Long consultationRecordId;

    // 파일 정보
    @NotNull(message = "파일명은 필수입니다.")
    @Size(max = 500, message = "파일명은 500자 이하여야 합니다.")
    @Column(name = "file_name", nullable = false, length = 500)
    private String fileName;

    @NotNull(message = "파일 경로는 필수입니다.")
    @Size(max = 1000, message = "파일 경로는 1000자 이하여야 합니다.")
    @Column(name = "file_path", nullable = false, length = 1000)
    private String filePath;

    @Column(name = "file_size_bytes")
    private Long fileSizeBytes;

    @Column(name = "duration_seconds")
    private Integer durationSeconds;

    @Size(max = 100, message = "MIME 타입은 100자 이하여야 합니다.")
    @Column(name = "mime_type", length = 100)
    private String mimeType;

    // 상태 관리
    @Column(name = "upload_status", length = 20)
    @Builder.Default
    private String uploadStatus = "PENDING"; // PENDING, UPLOADED, FAILED

    @Column(name = "transcription_status", length = 20)
    @Builder.Default
    private String transcriptionStatus = "PENDING"; // PENDING, PROCESSING, COMPLETED, FAILED

    // 비즈니스 메서드

    /**
     * 업로드 완료 처리
     */
    public void completeUpload() {
        this.uploadStatus = "UPLOADED";
    }

    /**
     * 업로드 실패 처리
     */
    public void failUpload() {
        this.uploadStatus = "FAILED";
    }

    /**
     * 전사 시작 처리
     */
    public void startTranscription() {
        this.transcriptionStatus = "PROCESSING";
    }

    /**
     * 전사 완료 처리
     */
    public void completeTranscription() {
        this.transcriptionStatus = "COMPLETED";
    }

    /**
     * 전사 실패 처리
     */
    public void failTranscription() {
        this.transcriptionStatus = "FAILED";
    }

    /**
     * 전사 가능 여부 확인
     */
    public boolean canTranscribe() {
        return "UPLOADED".equals(this.uploadStatus) && ("PENDING".equals(this.transcriptionStatus)
                || "FAILED".equals(this.transcriptionStatus));
    }

    /**
     * 전사 완료 여부 확인
     */
    public boolean isTranscriptionCompleted() {
        return "COMPLETED".equals(this.transcriptionStatus);
    }

    /**
     * 파일 크기를 MB 단위로 반환
     */
    public double getFileSizeInMB() {
        if (fileSizeBytes == null) {
            return 0.0;
        }
        return fileSizeBytes / (1024.0 * 1024.0);
    }

    /**
     * 재생 시간을 분:초 형식으로 반환
     */
    public String getFormattedDuration() {
        if (durationSeconds == null || durationSeconds == 0) {
            return "00:00";
        }
        int minutes = durationSeconds / 60;
        int seconds = durationSeconds % 60;
        return String.format("%02d:%02d", minutes, seconds);
    }

    @Override
    public String toString() {
        return "ConsultationAudioFile{" + "id=" + getId() + ", consultationId=" + consultationId
                + ", fileName='" + fileName + '\'' + ", fileSizeBytes=" + fileSizeBytes
                + ", durationSeconds=" + durationSeconds + ", uploadStatus='" + uploadStatus + '\''
                + ", transcriptionStatus='" + transcriptionStatus + '\'' + '}';
    }
}
