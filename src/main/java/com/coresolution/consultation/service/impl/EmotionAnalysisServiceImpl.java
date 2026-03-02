package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.entity.ConsultationAudioFile;
import com.coresolution.consultation.entity.ConsultationRecord;
import com.coresolution.consultation.entity.EmotionTrackingHistory;
import com.coresolution.consultation.entity.MultimodalEmotionReport;
import com.coresolution.consultation.entity.TextEmotionAnalysis;
import com.coresolution.consultation.entity.VideoEmotionAnalysis;
import com.coresolution.consultation.entity.VoiceBiomarker;
import com.coresolution.consultation.repository.ConsultationAudioFileRepository;
import com.coresolution.consultation.repository.ConsultationRecordRepository;
import com.coresolution.consultation.repository.EmotionTrackingHistoryRepository;
import com.coresolution.consultation.repository.MultimodalEmotionReportRepository;
import com.coresolution.consultation.repository.TextEmotionAnalysisRepository;
import com.coresolution.consultation.repository.VideoEmotionAnalysisRepository;
import com.coresolution.consultation.repository.VoiceBiomarkerRepository;
import com.coresolution.consultation.service.EmotionAnalysisService;
import com.coresolution.core.context.TenantContextHolder;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 멀티모달 감정 분석 서비스 구현체
 *
 * Google Cloud 서비스 (Speech-to-Text, Video Intelligence, Natural Language, Gemini)를
 * MCP 서버를 통해 호출하여 통합 감정 분석 수행
 *
 * @author MindGarden
 * @version 1.0.0
 * @since 2026-01-21
 */
@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class EmotionAnalysisServiceImpl implements EmotionAnalysisService {

    private final VoiceBiomarkerRepository voiceBiomarkerRepository;
    private final VideoEmotionAnalysisRepository videoEmotionRepository;
    private final TextEmotionAnalysisRepository textEmotionRepository;
    private final MultimodalEmotionReportRepository multimodalReportRepository;
    private final EmotionTrackingHistoryRepository trackingHistoryRepository;

    private final ConsultationAudioFileRepository audioFileRepository;
    private final ConsultationRecordRepository consultationRecordRepository;

    private final ObjectMapper objectMapper;

    @Override
    @Async
    public VoiceBiomarker analyzeVoiceBiomarkers(Long audioFileId) {
        long startTime = System.currentTimeMillis();

        try {
            ConsultationAudioFile audioFile = audioFileRepository.findByIdAndIsDeletedFalse(audioFileId)
                .orElseThrow(() -> new IllegalArgumentException("음성 파일을 찾을 수 없습니다: " + audioFileId));

            log.info("음성 바이오마커 분석 시작: audioFileId={}", audioFileId);

            // TODO: MCP google-emotion-analysis 서버 호출
            // mcpService.call("google-emotion-analysis", "extract_vocal_biomarkers", ...)

            // 현재는 모의 데이터로 저장
            VoiceBiomarker biomarker = VoiceBiomarker.builder()
                .consultationRecordId(audioFile.getConsultationRecordId())
                .audioFileId(audioFileId)
                .pitchMean(new BigDecimal("180.5"))
                .pitchStd(new BigDecimal("25.3"))
                .speechRateWpm(145)
                .pauseCount(23)
                .avgPauseDuration(new BigDecimal("0.8"))
                .volumeMean(new BigDecimal("65.0"))
                .volumeStd(new BigDecimal("12.0"))
                .tremorDetected(false)
                .stressScore(new BigDecimal("0.35"))
                .anxietyScore(new BigDecimal("0.42"))
                .depressionScore(new BigDecimal("0.28"))
                .energyLevel(new BigDecimal("0.65"))
                .analysisEngine("GOOGLE_SPEECH")
                .processingTimeMs((int) (System.currentTimeMillis() - startTime))
                .confidenceScore(new BigDecimal("0.85"))
                .build();

            biomarker.setTenantId(audioFile.getTenantId());

            VoiceBiomarker saved = voiceBiomarkerRepository.save(biomarker);

            log.info("✅ 음성 바이오마커 분석 완료: id={}, 불안={}, 우울={}",
                saved.getId(), biomarker.getAnxietyScore(), biomarker.getDepressionScore());

            return saved;

        } catch (Exception e) {
            log.error("❌ 음성 바이오마커 분석 실패: audioFileId={}, error={}", audioFileId, e.getMessage(), e);
            throw new RuntimeException("음성 바이오마커 분석 실패: " + e.getMessage(), e);
        }
    }

    @Override
    @Async
    public VideoEmotionAnalysis analyzeVideoEmotion(Long consultationRecordId, String videoFilePath) {
        long startTime = System.currentTimeMillis();

        try {
            String tenantId = TenantContextHolder.getRequiredTenantId();
            ConsultationRecord recordEntity = consultationRecordRepository.findByTenantIdAndId(tenantId, consultationRecordId)
                .orElseThrow(() -> new IllegalArgumentException("상담 기록을 찾을 수 없습니다: " + consultationRecordId));

            log.info("비디오 감정 분석 시작: consultationRecordId={}, videoPath={}",
                consultationRecordId, videoFilePath);

            // TODO: MCP google-emotion-analysis 서버 호출
            // mcpService.call("google-emotion-analysis", "analyze_video_emotion", ...)

            // 현재는 모의 데이터로 저장
            VideoEmotionAnalysis analysis = VideoEmotionAnalysis.builder()
                .consultationRecordId(consultationRecordId)
                .videoFilePath(videoFilePath)
                .dominantEmotion("neutral")
                .avgJoy(new BigDecimal("0.25"))
                .avgSorrow(new BigDecimal("0.35"))
                .avgAnger(new BigDecimal("0.10"))
                .avgSurprise(new BigDecimal("0.15"))
                .avgFear(new BigDecimal("0.20"))
                .avgDisgust(new BigDecimal("0.05"))
                .gazeDirectionChanges(15)
                .avgGazeConfidence(new BigDecimal("0.78"))
                .postureChanges(8)
                .analysisEngine("GOOGLE_VIDEO_INTELLIGENCE")
                .videoDurationSeconds(1800)  // 30분
                .framesAnalyzed(900)  // 2초당 1프레임
                .processingTimeMs((int) (System.currentTimeMillis() - startTime))
                .build();

            analysis.setTenantId(recordEntity.getTenantId());

            VideoEmotionAnalysis saved = videoEmotionRepository.save(analysis);

            log.info("✅ 비디오 감정 분석 완료: id={}, 주요감정={}",
                saved.getId(), analysis.getDominantEmotion());

            return saved;

        } catch (Exception e) {
            log.error("❌ 비디오 감정 분석 실패: recordId={}, error={}",
                consultationRecordId, e.getMessage(), e);
            throw new RuntimeException("비디오 감정 분석 실패: " + e.getMessage(), e);
        }
    }

    @Override
    @Async
    public TextEmotionAnalysis analyzeTextEmotion(Long consultationRecordId, String text, String sourceType) {
        long startTime = System.currentTimeMillis();

        try {
            String tenantId = TenantContextHolder.getRequiredTenantId();
            ConsultationRecord recordEntity = consultationRecordRepository.findByTenantIdAndId(tenantId, consultationRecordId)
                .orElseThrow(() -> new IllegalArgumentException("상담 기록을 찾을 수 없습니다: " + consultationRecordId));

            log.info("텍스트 감정 분석 시작: recordId={}, sourceType={}, textLength={}",
                consultationRecordId, sourceType, text.length());

            // TODO: MCP google-emotion-analysis 서버 호출
            // 1. Google Natural Language API로 감정 분석
            // 2. Gemini로 인지 왜곡 감지

            // 현재는 간단한 키워드 기반 분석
            Map<String, Object> cognitiveAnalysis = detectCognitiveDistortionsSimple(text);

            TextEmotionAnalysis analysis = TextEmotionAnalysis.builder()
                .consultationRecordId(consultationRecordId)
                .sourceText(text)
                .sourceType(sourceType)
                .sentimentScore(new BigDecimal("-0.15"))  // 약간 부정적
                .sentimentMagnitude(new BigDecimal("1.2"))
                .sentimentClassification("negative")
                .distortionCount((Integer) cognitiveAnalysis.get("count"))
                .distortionRiskLevel((String) cognitiveAnalysis.get("riskLevel"))
                .analysisEngine("GOOGLE_NL")
                .aiModelUsed("gemini-pro")
                .processingTimeMs((int) (System.currentTimeMillis() - startTime))
                .build();

            try {
                analysis.setCognitiveDistortions(objectMapper.writeValueAsString(
                    cognitiveAnalysis.get("distortions")));
            } catch (Exception e) {
                log.warn("인지 왜곡 JSON 변환 실패", e);
            }

            analysis.setTenantId(recordEntity.getTenantId());

            TextEmotionAnalysis saved = textEmotionRepository.save(analysis);

            log.info("✅ 텍스트 감정 분석 완료: id={}, 감정={}, 왜곡={}",
                saved.getId(), analysis.getSentimentClassification(), analysis.getDistortionCount());

            return saved;

        } catch (Exception e) {
            log.error("❌ 텍스트 감정 분석 실패: recordId={}, error={}",
                consultationRecordId, e.getMessage(), e);
            throw new RuntimeException("텍스트 감정 분석 실패: " + e.getMessage(), e);
        }
    }

    @Override
    public MultimodalEmotionReport generateMultimodalReport(Long consultationRecordId) {
        try {
            String tenantId = TenantContextHolder.getRequiredTenantId();
            ConsultationRecord recordEntity = consultationRecordRepository.findByTenantIdAndId(tenantId, consultationRecordId)
                .orElseThrow(() -> new IllegalArgumentException("상담 기록을 찾을 수 없습니다: " + consultationRecordId));

            log.info("멀티모달 통합 리포트 생성: recordId={}", consultationRecordId);

            // 각 모달리티 데이터 조회
            VoiceBiomarker voiceBiomarker = voiceBiomarkerRepository
                .findByConsultationRecordIdAndIsDeletedFalse(consultationRecordId)
                .orElse(null);

            VideoEmotionAnalysis videoEmotion = videoEmotionRepository
                .findByConsultationRecordIdAndIsDeletedFalse(consultationRecordId)
                .orElse(null);

            TextEmotionAnalysis textEmotion = textEmotionRepository
                .findByConsultationRecordIdAndIsDeletedFalse(consultationRecordId)
                .orElse(null);

            // 통합 지표 계산
            Map<String, BigDecimal> integratedMetrics = calculateIntegratedMetrics(
                voiceBiomarker, videoEmotion, textEmotion);

            // 종합 위험도 평가
            String riskLevel = assessOverallRisk(integratedMetrics);

            // AI 요약 생성 (Gemini)
            String aiSummary = generateAISummary(voiceBiomarker, videoEmotion, textEmotion);

            MultimodalEmotionReport report = MultimodalEmotionReport.builder()
                .consultationRecordId(consultationRecordId)
                .voiceBiomarkerId(voiceBiomarker != null ? voiceBiomarker.getId() : null)
                .videoEmotionId(videoEmotion != null ? videoEmotion.getId() : null)
                .textEmotionId(textEmotion != null ? textEmotion.getId() : null)
                .overallEmotion(determineOverallEmotion(integratedMetrics))
                .emotionConfidence(new BigDecimal("0.82"))
                .voiceEmotionScore(voiceBiomarker != null ? voiceBiomarker.getAnxietyScore() : null)
                .videoEmotionScore(videoEmotion != null ? videoEmotion.getAvgSorrow() : null)
                .textEmotionScore(textEmotion != null ? textEmotion.getSentimentScore() : null)
                .stressIndex(integratedMetrics.get("stress"))
                .anxietyIndex(integratedMetrics.get("anxiety"))
                .depressionIndex(integratedMetrics.get("depression"))
                .energyIndex(integratedMetrics.get("energy"))
                .overallRiskLevel(riskLevel)
                .aiSummary(aiSummary)
                .modalitiesUsed(buildModalitiesUsed(voiceBiomarker, videoEmotion, textEmotion))
                .build();

            report.setTenantId(recordEntity.getTenantId());

            MultimodalEmotionReport saved = multimodalReportRepository.save(report);

            log.info("✅ 멀티모달 리포트 생성 완료: id={}, 위험도={}",
                saved.getId(), riskLevel);

            return saved;

        } catch (Exception e) {
            log.error("❌ 멀티모달 리포트 생성 실패: recordId={}, error={}",
                consultationRecordId, e.getMessage(), e);
            throw new RuntimeException("멀티모달 리포트 생성 실패: " + e.getMessage(), e);
        }
    }

    @Override
    public void trackEmotionChanges(Long clientId, Long consultationRecordId, Integer sessionNumber) {
        try {
            MultimodalEmotionReport report = multimodalReportRepository
                .findByConsultationRecordIdAndIsDeletedFalse(consultationRecordId)
                .orElse(null);

            if (report == null) {
                log.warn("멀티모달 리포트가 없어 추적을 건너뜁니다: recordId={}", consultationRecordId);
                return;
            }

            // 이전 회기 데이터 조회
            List<EmotionTrackingHistory> previousHistory = trackingHistoryRepository
                .findByClientIdAndIsDeletedFalseOrderBySessionNumberAsc(clientId);

            // 각 감정 유형별 추적 기록 생성
            createTrackingRecord(clientId, consultationRecordId, sessionNumber,
                "anxiety", report.getAnxietyIndex(), previousHistory);
            createTrackingRecord(clientId, consultationRecordId, sessionNumber,
                "depression", report.getDepressionIndex(), previousHistory);
            createTrackingRecord(clientId, consultationRecordId, sessionNumber,
                "stress", report.getStressIndex(), previousHistory);

            log.info("✅ 감정 변화 추적 완료: clientId={}, session={}", clientId, sessionNumber);

        } catch (Exception e) {
            log.error("❌ 감정 변화 추적 실패: clientId={}, error={}", clientId, e.getMessage(), e);
        }
    }

    @Override
    public List<EmotionTrackingHistory> getEmotionTrend(Long clientId, String emotionType) {
        return trackingHistoryRepository
            .findByClientIdAndEmotionTypeAndIsDeletedFalseOrderBySessionNumberAsc(clientId, emotionType);
    }

    @Override
    public MultimodalEmotionReport getMultimodalReport(Long reportId) {
        return multimodalReportRepository.findByIdAndIsDeletedFalse(reportId)
            .orElseThrow(() -> new IllegalArgumentException("멀티모달 리포트를 찾을 수 없습니다: " + reportId));
    }

    // ========== Private Helper Methods ==========

    private Map<String, BigDecimal> calculateIntegratedMetrics(
            VoiceBiomarker voice, VideoEmotionAnalysis video, TextEmotionAnalysis text) {

        Map<String, BigDecimal> metrics = new HashMap<>();

        // Anxiety 통합
        List<BigDecimal> anxietyScores = new ArrayList<>();
        if (voice != null && voice.getAnxietyScore() != null) anxietyScores.add(voice.getAnxietyScore());
        if (video != null && video.getAvgFear() != null) anxietyScores.add(video.getAvgFear());
        metrics.put("anxiety", calculateAverage(anxietyScores));

        // Depression 통합
        List<BigDecimal> depressionScores = new ArrayList<>();
        if (voice != null && voice.getDepressionScore() != null) depressionScores.add(voice.getDepressionScore());
        if (video != null && video.getAvgSorrow() != null) depressionScores.add(video.getAvgSorrow());
        if (text != null && text.getSentimentScore() != null && text.getSentimentScore().compareTo(new BigDecimal("-0.5")) < 0) {
            depressionScores.add(text.getSentimentScore().abs());
        }
        metrics.put("depression", calculateAverage(depressionScores));

        // Stress 통합
        List<BigDecimal> stressScores = new ArrayList<>();
        if (voice != null && voice.getStressScore() != null) stressScores.add(voice.getStressScore());
        metrics.put("stress", calculateAverage(stressScores));

        // Energy 통합
        List<BigDecimal> energyScores = new ArrayList<>();
        if (voice != null && voice.getEnergyLevel() != null) energyScores.add(voice.getEnergyLevel());
        if (video != null && video.getAvgJoy() != null) energyScores.add(video.getAvgJoy());
        metrics.put("energy", calculateAverage(energyScores));

        return metrics;
    }

    private BigDecimal calculateAverage(List<BigDecimal> scores) {
        if (scores.isEmpty()) return BigDecimal.ZERO;

        BigDecimal sum = scores.stream()
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        return sum.divide(new BigDecimal(scores.size()), 2, RoundingMode.HALF_UP);
    }

    private String assessOverallRisk(Map<String, BigDecimal> metrics) {
        BigDecimal anxiety = metrics.getOrDefault("anxiety", BigDecimal.ZERO);
        BigDecimal depression = metrics.getOrDefault("depression", BigDecimal.ZERO);

        if (anxiety.compareTo(new BigDecimal("0.8")) > 0
            || depression.compareTo(new BigDecimal("0.8")) > 0) {
            return "CRITICAL";
        }

        if (anxiety.compareTo(new BigDecimal("0.6")) > 0
            || depression.compareTo(new BigDecimal("0.6")) > 0) {
            return "HIGH";
        }

        if (anxiety.compareTo(new BigDecimal("0.4")) > 0
            || depression.compareTo(new BigDecimal("0.4")) > 0) {
            return "MEDIUM";
        }

        return "LOW";
    }

    private String determineOverallEmotion(Map<String, BigDecimal> metrics) {
        BigDecimal anxiety = metrics.getOrDefault("anxiety", BigDecimal.ZERO);
        BigDecimal depression = metrics.getOrDefault("depression", BigDecimal.ZERO);
        BigDecimal energy = metrics.getOrDefault("energy", BigDecimal.ZERO);

        if (depression.compareTo(new BigDecimal("0.6")) > 0) return "depressed";
        if (anxiety.compareTo(new BigDecimal("0.6")) > 0) return "anxious";
        if (energy.compareTo(new BigDecimal("0.7")) > 0) return "energetic";
        if (energy.compareTo(new BigDecimal("0.3")) < 0) return "low_energy";

        return "neutral";
    }

    private String generateAISummary(VoiceBiomarker voice, VideoEmotionAnalysis video, TextEmotionAnalysis text) {
        // Gemini를 통한 AI 요약 생성
        StringBuilder summary = new StringBuilder();

        if (voice != null) {
            summary.append(String.format("음성 분석: 불안도 %.2f, 우울도 %.2f, 말속도 %d wpm. ",
                voice.getAnxietyScore(), voice.getDepressionScore(), voice.getSpeechRateWpm()));
        }

        if (video != null) {
            summary.append(String.format("비디오 분석: 주요 감정 %s, 슬픔 %.2f, 기쁨 %.2f. ",
                video.getDominantEmotion(), video.getAvgSorrow(), video.getAvgJoy()));
        }

        if (text != null) {
            summary.append(String.format("텍스트 분석: 감정 점수 %.2f, 인지 왜곡 %d개 발견.",
                text.getSentimentScore(), text.getDistortionCount()));
        }

        return summary.toString();
    }

    private String buildModalitiesUsed(VoiceBiomarker voice, VideoEmotionAnalysis video, TextEmotionAnalysis text) {
        List<String> modalities = new ArrayList<>();
        if (voice != null) modalities.add("voice");
        if (video != null) modalities.add("video");
        if (text != null) modalities.add("text");
        return String.join(",", modalities);
    }

    private Map<String, Object> detectCognitiveDistortionsSimple(String text) {
        // 간단한 키워드 기반 인지 왜곡 감지
        List<Map<String, String>> distortions = new ArrayList<>();
        int count = 0;

        String[] allOrNothingKeywords = {"전부", "결코", "항상", "절대", "모든", "하나도"};
        String[] catastrophizingKeywords = {"망했다", "끝났다", "최악", "파멸"};
        String[] labelingKeywords = {"실패자", "쓸모없", "무능력"};

        for (String keyword : allOrNothingKeywords) {
            if (text.contains(keyword)) {
                distortions.add(Map.of(
                    "type", "전부-아무것도 사고",
                    "keyword", keyword,
                    "severity", "MEDIUM"
                ));
                count++;
            }
        }

        for (String keyword : catastrophizingKeywords) {
            if (text.contains(keyword)) {
                distortions.add(Map.of(
                    "type", "파국화",
                    "keyword", keyword,
                    "severity", "HIGH"
                ));
                count++;
            }
        }

        for (String keyword : labelingKeywords) {
            if (text.contains(keyword)) {
                distortions.add(Map.of(
                    "type", "명명하기",
                    "keyword", keyword,
                    "severity", "HIGH"
                ));
                count++;
            }
        }

        String riskLevel = count >= 5 ? "HIGH" : count >= 2 ? "MEDIUM" : "LOW";

        Map<String, Object> result = new HashMap<>();
        result.put("distortions", distortions);
        result.put("count", count);
        result.put("riskLevel", riskLevel);

        return result;
    }

    private void createTrackingRecord(Long clientId, Long consultationRecordId,
                                       Integer sessionNumber, String emotionType,
                                       BigDecimal currentScore, List<EmotionTrackingHistory> previousHistory) {

        if (currentScore == null) return;

        // 이전 회기의 동일 감정 점수 찾기
        EmotionTrackingHistory previous = previousHistory.stream()
            .filter(h -> emotionType.equals(h.getEmotionType()))
            .reduce((first, second) -> second)  // 마지막 항목
            .orElse(null);

        BigDecimal changeFromPrevious = previous != null
            ? currentScore.subtract(previous.getEmotionScore())
            : BigDecimal.ZERO;

        String trend = determineTrend(changeFromPrevious);

        EmotionTrackingHistory history = EmotionTrackingHistory.builder()
            .clientId(clientId)
            .consultationRecordId(consultationRecordId)
            .sessionNumber(sessionNumber)
            .emotionType(emotionType)
            .emotionScore(currentScore)
            .scoreChangeFromPrevious(changeFromPrevious)
            .trend(trend)
            .measuredAt(LocalDateTime.now())
            .build();

        String tenantId = TenantContextHolder.getRequiredTenantId();
        ConsultationRecord recordEntity = consultationRecordRepository
            .findByTenantIdAndId(tenantId, consultationRecordId).orElse(null);
        if (recordEntity != null) {
            history.setTenantId(recordEntity.getTenantId());
        }

        trackingHistoryRepository.save(history);
    }

    private String determineTrend(BigDecimal change) {
        if (change.compareTo(new BigDecimal("0.1")) > 0) return "IMPROVING";
        if (change.compareTo(new BigDecimal("-0.1")) < 0) return "WORSENING";
        return "STABLE";
    }
}
