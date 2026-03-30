package com.coresolution.consultation.repository;

import com.coresolution.consultation.entity.AudioTranscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 음성 전사 결과 리포지토리
 *
 * @author MindGarden
 * @version 1.0.0
 * @since 2026-01-21
 */
@Repository
public interface AudioTranscriptionRepository extends JpaRepository<AudioTranscription, Long> {

    /**
     * 음성 파일 ID로 전사 결과 조회
     */
    Optional<AudioTranscription> findByAudioFileId(Long audioFileId);

    /**
     * AI 제공자로 전사 결과 목록 조회
     */
    List<AudioTranscription> findByAiProvider(String aiProvider);

    /**
     * 음성 파일 ID 목록으로 전사 결과 조회
     */
    List<AudioTranscription> findByAudioFileIdIn(List<Long> audioFileIds);
}
