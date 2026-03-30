package com.coresolution.consultation.service;

import com.coresolution.consultation.entity.AudioTranscription;
import com.coresolution.consultation.entity.ConsultationAudioFile;

import java.io.InputStream;

/**
 * 음성-텍스트 변환(STT) 서비스 인터페이스
 * Google Cloud Speech-to-Text API 통합
 *
 * @author MindGarden
 * @version 1.0.0
 * @since 2026-01-21
 */
public interface SpeechToTextService {

    /**
     * 음성 파일을 텍스트로 전사
     *
     * @param audioFile 음성 파일 엔티티
     * @return 전사 결과
     */
    AudioTranscription transcribeAudio(ConsultationAudioFile audioFile);

    /**
     * 실시간 스트리밍 전사
     *
     * @param audioStream 음성 스트림
     * @return 전사된 텍스트
     */
    String streamTranscribe(InputStream audioStream);

    /**
     * 비동기 음성 전사 (백그라운드 작업)
     *
     * @param audioFileId 음성 파일 ID
     */
    void transcribeAudioAsync(Long audioFileId);

    /**
     * 전사 상태 확인
     *
     * @param audioFileId 음성 파일 ID
     * @return 전사 상태 (PENDING, PROCESSING, COMPLETED, FAILED)
     */
    String getTranscriptionStatus(Long audioFileId);
}
