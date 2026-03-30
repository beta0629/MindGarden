package com.coresolution.consultation.service;

import com.coresolution.consultation.entity.AudioTranscription;
import com.coresolution.consultation.entity.ConsultationRecordAlert;

import java.util.List;

/**
 * 위험 징후 자동 감지 서비스 인터페이스
 * 음성 전사 텍스트에서 자살, 자해 등 위험 키워드 감지 및 AI 분석
 *
 * @author MindGarden
 * @version 1.0.0
 * @since 2026-01-21
 */
public interface RiskDetectionService {

    /**
     * 음성 전사 텍스트에서 위험 징후 분석
     *
     * @param transcription 음성 전사 결과
     * @return 생성된 위험 알림 (없으면 null)
     */
    ConsultationRecordAlert analyzeTranscriptionForRisks(AudioTranscription transcription);

    /**
     * 텍스트에서 위험 키워드 검색
     *
     * @param text 분석할 텍스트
     * @return 발견된 위험 키워드 목록
     */
    List<String> detectRiskKeywords(String text);

    /**
     * AI를 통한 문맥 기반 위험도 평가
     *
     * @param text 분석할 텍스트
     * @param detectedKeywords 발견된 키워드
     * @return 위험 분석 결과
     */
    RiskAnalysisResult analyzeRiskWithAI(String text, List<String> detectedKeywords);

    /**
     * 고위험 알림 발송
     *
     * @param alert 위험 알림
     */
    void sendHighRiskAlert(ConsultationRecordAlert alert);

    /**
     * 위험 징후 알림 생성 및 저장
     *
     * @param consultationRecordId 상담 기록 ID
     * @param riskAnalysis 위험 분석 결과
     * @return 생성된 알림
     */
    ConsultationRecordAlert createRiskAlert(Long consultationRecordId, RiskAnalysisResult riskAnalysis);

    /**
     * 위험 분석 결과 DTO
     */
    class RiskAnalysisResult {
        private final boolean hasRisk;
        private final String severity; // LOW, MEDIUM, HIGH, CRITICAL
        private final double riskScore; // 0.0-1.0
        private final List<String> detectedKeywords;
        private final String aiAnalysis;
        private final String recommendation;

        public RiskAnalysisResult(boolean hasRisk, String severity, double riskScore,
                                 List<String> detectedKeywords, String aiAnalysis, String recommendation) {
            this.hasRisk = hasRisk;
            this.severity = severity;
            this.riskScore = riskScore;
            this.detectedKeywords = detectedKeywords;
            this.aiAnalysis = aiAnalysis;
            this.recommendation = recommendation;
        }

        public boolean hasRisk() { return hasRisk; }
        public String getSeverity() { return severity; }
        public double getRiskScore() { return riskScore; }
        public List<String> getDetectedKeywords() { return detectedKeywords; }
        public String getAiAnalysis() { return aiAnalysis; }
        public String getRecommendation() { return recommendation; }

        public boolean isCritical() {
            return "CRITICAL".equalsIgnoreCase(severity);
        }

        public boolean isHighRisk() {
            return "HIGH".equalsIgnoreCase(severity) || "CRITICAL".equalsIgnoreCase(severity);
        }
    }
}
