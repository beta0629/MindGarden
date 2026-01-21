package com.coresolution.consultation.repository;

import com.coresolution.consultation.entity.ConsultationAudioFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 상담 음성 파일 리포지토리
 *
 * @author MindGarden
 * @version 1.0.0
 * @since 2026-01-21
 */
@Repository
public interface ConsultationAudioFileRepository extends JpaRepository<ConsultationAudioFile, Long> {

    /**
     * 상담 ID로 음성 파일 목록 조회
     */
    List<ConsultationAudioFile> findByConsultationIdAndIsDeletedFalse(Long consultationId);

    /**
     * 상담 기록 ID로 음성 파일 목록 조회
     */
    List<ConsultationAudioFile> findByConsultationRecordIdAndIsDeletedFalse(Long consultationRecordId);

    /**
     * 전사 상태로 음성 파일 조회
     */
    List<ConsultationAudioFile> findByTranscriptionStatusAndIsDeletedFalse(String transcriptionStatus);

    /**
     * 테넌트 ID로 음성 파일 목록 조회
     */
    List<ConsultationAudioFile> findByTenantIdAndIsDeletedFalse(String tenantId);

    /**
     * ID로 조회 (삭제되지 않은 것만)
     */
    Optional<ConsultationAudioFile> findByIdAndIsDeletedFalse(Long id);
}
