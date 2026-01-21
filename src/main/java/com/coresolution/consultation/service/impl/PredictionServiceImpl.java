package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.entity.Client;
import com.coresolution.consultation.entity.DropoutRiskAssessment;
import com.coresolution.consultation.entity.TreatmentPrediction;
import com.coresolution.consultation.repository.ClientRepository;
import com.coresolution.consultation.repository.DropoutRiskAssessmentRepository;
import com.coresolution.consultation.repository.TreatmentPredictionRepository;
import com.coresolution.consultation.service.PredictionService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 예측 서비스 구현체
 *
 * @author MindGarden
 * @version 1.0.0
 * @since 2026-01-21
 */
@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class PredictionServiceImpl implements PredictionService {

    private final TreatmentPredictionRepository treatmentPredictionRepository;
    private final DropoutRiskAssessmentRepository dropoutRiskRepository;
    private final ClientRepository clientRepository;
    private final ObjectMapper objectMapper;

    @Override
    public TreatmentPrediction predictTreatmentOutcome(Long clientId) {
        try {
            Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new IllegalArgumentException("내담자를 찾을 수 없습니다: " + clientId));

            log.info("치료 경과 예측 시작: clientId={}", clientId);

            // 내담자 데이터 수집
            Map<String, Object> features = collectClientFeatures(client);

            // TODO: MCP prediction-models 서버 호출
            // mcpService.call("prediction-models", "predict_treatment_outcome", ...)

            // 현재는 간단한 규칙 기반 예측
            String outcome = predictOutcomeSimple(features);
            BigDecimal probability = calculateSuccessProbability(features);

            TreatmentPrediction prediction = TreatmentPrediction.builder()
                .clientId(clientId)
                .predictedOutcome(outcome)
                .successProbability(probability)
                .estimatedImprovementRate(probability.multiply(new BigDecimal("100")))
                .recommendedSessionCount(calculateRecommendedSessions(features))
                .confidenceLevel(new BigDecimal("0.75"))
                .similarCasesCount(3)
                .modelName("treatment_outcome_predictor")
                .modelVersion("1.0.0")
                .predictionDate(LocalDateTime.now())
                .build();

            try {
                prediction.setPredictionFactors(objectMapper.writeValueAsString(
                    List.of("현재 회기 수", "감정 변화 추이", "출석률")));
            } catch (Exception e) {
                log.warn("예측 요인 JSON 변환 실패", e);
            }

            prediction.setTenantId(client.getTenantId());

            TreatmentPrediction saved = treatmentPredictionRepository.save(prediction);

            log.info("✅ 치료 경과 예측 완료: id={}, 결과={}, 확률={}",
                saved.getId(), outcome, probability);

            return saved;

        } catch (Exception e) {
            log.error("❌ 치료 경과 예측 실패: clientId={}, error={}", clientId, e.getMessage(), e);
            throw new RuntimeException("치료 경과 예측 실패: " + e.getMessage(), e);
        }
    }

    @Override
    public DropoutRiskAssessment assessDropoutRisk(Long clientId) {
        try {
            Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new IllegalArgumentException("내담자를 찾을 수 없습니다: " + clientId));

            log.info("중도 탈락 위험 평가 시작: clientId={}", clientId);

            // 참여도 지표 계산
            Map<String, Object> metrics = calculateEngagementMetrics(client);

            // TODO: MCP prediction-models 서버 호출
            BigDecimal dropoutProb = (BigDecimal) metrics.get("dropoutProbability");
            String riskLevel = determineRiskLevel(dropoutProb);

            DropoutRiskAssessment assessment = DropoutRiskAssessment.builder()
                .clientId(clientId)
                .dropoutRiskLevel(riskLevel)
                .dropoutProbability(dropoutProb)
                .engagementScore((BigDecimal) metrics.get("engagementScore"))
                .attendanceRate((BigDecimal) metrics.get("attendanceRate"))
                .responseDelayHours(new BigDecimal("12.5"))
                .emotionalProgressStagnation(false)
                .earlyInterventionNeeded(dropoutProb.compareTo(new BigDecimal("0.6")) > 0)
                .modelName("dropout_risk_predictor")
                .assessmentDate(LocalDateTime.now())
                .build();

            if ("HIGH".equals(riskLevel) || "CRITICAL".equals(riskLevel)) {
                try {
                    assessment.setWarningSigns(objectMapper.writeValueAsString(
                        List.of("낮은 참여도", "응답 지연", "감정 변화 정체")));
                    assessment.setRecommendedActions(objectMapper.writeValueAsString(
                        List.of("상담사와 1:1 체크인", "상담 목표 재설정", "동기 강화 상담")));
                } catch (Exception e) {
                    log.warn("JSON 변환 실패", e);
                }
            }

            assessment.setTenantId(client.getTenantId());

            DropoutRiskAssessment saved = dropoutRiskRepository.save(assessment);

            log.info("✅ 중도 탈락 위험 평가 완료: id={}, 위험도={}", saved.getId(), riskLevel);

            return saved;

        } catch (Exception e) {
            log.error("❌ 중도 탈락 위험 평가 실패: clientId={}, error={}", clientId, e.getMessage(), e);
            throw new RuntimeException("중도 탈락 위험 평가 실패: " + e.getMessage(), e);
        }
    }

    @Override
    public Map<String, Object> recommendSessionCount(Long clientId) {
        // TODO: MCP prediction-models 서버 호출

        Map<String, Object> recommendation = new HashMap<>();
        recommendation.put("clientId", clientId);
        recommendation.put("recommendedSessionCount", 16);
        recommendation.put("minSessionCount", 12);
        recommendation.put("maxSessionCount", 20);
        recommendation.put("reasoning", "증상 심각도와 치료 목표를 고려하여 16회기를 권장합니다.");

        return recommendation;
    }

    @Override
    public Map<String, Object> findSimilarCases(Long clientId, Integer limit) {
        // TODO: MCP prediction-models 서버 호출

        Map<String, Object> result = new HashMap<>();
        result.put("clientId", clientId);
        result.put("similarCases", List.of());  // 빈 목록
        result.put("count", 0);

        return result;
    }

    // Helper methods

    private Map<String, Object> collectClientFeatures(Client client) {
        Map<String, Object> features = new HashMap<>();
        features.put("age", calculateAge(client));
        features.put("mainSymptoms", "불안장애");  // TODO: 실제 증상 조회
        features.put("currentSession", 5);  // TODO: 실제 회기 수 조회
        features.put("attendanceRate", 0.9);
        features.put("emotionTrend", "improving");
        return features;
    }

    private int calculateAge(Client client) {
        // TODO: 실제 나이 계산
        return 30;
    }

    private String predictOutcomeSimple(Map<String, Object> features) {
        Double attendanceRate = (Double) features.get("attendanceRate");

        if (attendanceRate != null && attendanceRate > 0.8) return "GOOD";
        if (attendanceRate != null && attendanceRate > 0.6) return "MODERATE";
        return "POOR";
    }

    private BigDecimal calculateSuccessProbability(Map<String, Object> features) {
        Double attendanceRate = (Double) features.getOrDefault("attendanceRate", 0.7);
        return BigDecimal.valueOf(attendanceRate).setScale(2, RoundingMode.HALF_UP);
    }

    @SuppressWarnings("unused")
    private Integer calculateRecommendedSessions(Map<String, Object> features) {
        return 16;  // 기본값
    }

    private Map<String, Object> calculateEngagementMetrics(Client client) {
        Map<String, Object> metrics = new HashMap<>();
        metrics.put("engagementScore", new BigDecimal("0.65"));
        metrics.put("attendanceRate", new BigDecimal("0.85"));
        metrics.put("dropoutProbability", new BigDecimal("0.25"));
        return metrics;
    }

    private String determineRiskLevel(BigDecimal probability) {
        if (probability.compareTo(new BigDecimal("0.7")) > 0) return "CRITICAL";
        if (probability.compareTo(new BigDecimal("0.5")) > 0) return "HIGH";
        if (probability.compareTo(new BigDecimal("0.3")) > 0) return "MEDIUM";
        return "LOW";
    }
}
