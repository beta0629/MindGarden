package com.coresolution.consultation.service;

import com.coresolution.consultation.entity.*;

import java.util.List;

/**
 * 멀티모달 감정 분석 서비스 인터페이스
 *
 * 음성, 비디오, 텍스트를 통합하여 내담자의 감정 상태 분석
 *
 * @author MindGarden
 * @version 1.0.0
 * @since 2026-01-21
 */
public interface EmotionAnalysisService {

    /**
     * 음성 바이오마커 분석
     *
     * @param audioFileId 음성 파일 ID
     * @return 음성 바이오마커 분석 결과
     */
    VoiceBiomarker analyzeVoiceBiomarkers(Long audioFileId);

    /**
     * 비디오 감정 분석
     *
     * @param consultationRecordId 상담 기록 ID
     * @param videoFilePath 비디오 파일 경로
     * @return 비디오 감정 분석 결과
     */
    VideoEmotionAnalysis analyzeVideoEmotion(Long consultationRecordId, String videoFilePath);

    /**
     * 텍스트 감정 및 인지 왜곡 분석
     *
     * @param consultationRecordId 상담 기록 ID
     * @param text 분석할 텍스트
     * @param sourceType 텍스트 소스 (TRANSCRIPTION, CHAT, NOTE)
     * @return 텍스트 감정 분석 결과
     */
    TextEmotionAnalysis analyzeTextEmotion(Long consultationRecordId, String text, String sourceType);

    /**
     * 멀티모달 통합 감정 리포트 생성
     *
     * @param consultationRecordId 상담 기록 ID
     * @return 통합 감정 리포트
     */
    MultimodalEmotionReport generateMultimodalReport(Long consultationRecordId);

    /**
     * 감정 변화 추적 기록 생성
     *
     * @param clientId 내담자 ID
     * @param consultationRecordId 상담 기록 ID
     * @param sessionNumber 회기 번호
     */
    void trackEmotionChanges(Long clientId, Long consultationRecordId, Integer sessionNumber);

    /**
     * 내담자의 감정 추이 조회
     *
     * @param clientId 내담자 ID
     * @param emotionType 감정 유형 (anxiety, depression 등)
     * @return 감정 변화 이력
     */
    List<EmotionTrackingHistory> getEmotionTrend(Long clientId, String emotionType);

    /**
     * 멀티모달 리포트 조회
     *
     * @param reportId 리포트 ID
     * @return 멀티모달 리포트
     */
    MultimodalEmotionReport getMultimodalReport(Long reportId);
}
