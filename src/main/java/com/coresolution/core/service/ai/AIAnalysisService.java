package com.coresolution.core.service.ai;

import com.coresolution.consultation.entity.AiUsageLog;
import com.coresolution.consultation.repository.AiUsageLogRepository;
import com.coresolution.core.domain.SystemMetric;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

/**
 * AI 분석 통합 서비스
 * 다양한 AI 모델을 지원하는 Facade 패턴
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-12-02
 */
@Slf4j
@Service
@RequiredArgsConstructor
@ConditionalOnProperty(name = "ai.monitoring.enabled", havingValue = "true", matchIfMissing = false)
public class AIAnalysisService {
    
    private final AIModelProvider modelProvider;
    private final AIPromptService promptService;
    private final AiUsageLogRepository usageLogRepository;
    
    /** 시스템 모니터링 호출의 안전 tenant 라벨 (멀티테넌트 미적용 단일 시스템 컨텍스트). */
    private static final String SYSTEM_TENANT = "SYSTEM";

    /** provider 라벨 fallback. */
    private static final String PROVIDER_UNKNOWN = "UNKNOWN";

    /**
     * 이상 탐지 분석
     */
    public AnomalyAnalysisResult analyzeAnomaly(List<SystemMetric> metrics, String metricType) {
        if (!modelProvider.isAvailable()) {
            log.warn("⚠️ AI 모델을 사용할 수 없습니다: {}", modelProvider.getModelType());
            return null;
        }
        
        try {
            String systemPrompt = promptService.getSystemMonitoringExpertPrompt();
            String userPrompt = promptService.buildAnomalyDetectionPrompt(
                metrics, metricType, getMetricDescription(metricType)
            );
            String combinedPrompt = buildCombinedPromptForLog(systemPrompt, userPrompt);

            AIModelProvider.AIResponse response = modelProvider.analyze(
                systemPrompt, userPrompt, 500, 0.3
            );

            if (!response.isSuccess()) {
                log.error("AI 분석 실패: {}", response.getErrorMessage());
                logUsage("anomaly_detection", false, response, combinedPrompt, null);
                return null;
            }

            logUsage("anomaly_detection", true, response, combinedPrompt, response.getContent());

            return parseAnomalyResponse(response.getContent());

        } catch (Exception e) {
            log.error("이상 탐지 분석 실패", e);
            return null;
        }
    }
    
    /**
     * 보안 위협 분석
     */
    public SecurityThreatAnalysisResult analyzeThreat(String eventType, Map<String, Object> eventDetails) {
        if (!modelProvider.isAvailable()) {
            log.warn("⚠️ AI 모델을 사용할 수 없습니다: {}", modelProvider.getModelType());
            return null;
        }
        
        try {
            String systemPrompt = promptService.getSecurityExpertPrompt();
            String userPrompt = promptService.buildSecurityThreatPrompt(eventType, eventDetails);
            String combinedPrompt = buildCombinedPromptForLog(systemPrompt, userPrompt);

            AIModelProvider.AIResponse response = modelProvider.analyze(
                systemPrompt, userPrompt, 500, 0.3
            );

            if (!response.isSuccess()) {
                log.error("AI 분석 실패: {}", response.getErrorMessage());
                logUsage("security_threat_detection", false, response, combinedPrompt, null);
                return null;
            }

            logUsage("security_threat_detection", true, response, combinedPrompt, response.getContent());

            return parseThreatResponse(response.getContent());

        } catch (Exception e) {
            log.error("보안 위협 분석 실패", e);
            return null;
        }
    }

    /**
     * 사용 로그 기록 (N3 보강 — V20260529_001).
     *
     * <p>{@code aiProvider}, {@code prompt}, {@code response} 본문을 함께 적재한다.
     * 모니터링 컨텍스트는 system-level 이므로 tenantId 는 {@link #SYSTEM_TENANT}.</p>
     */
    private void logUsage(String requestType, boolean isSuccess, AIModelProvider.AIResponse response,
                          String promptBody, String responseBody) {
        try {
            String providerForLog = resolveProviderLabel();
            AiUsageLog usageLog = AiUsageLog.builder()
                .tenantId(SYSTEM_TENANT)
                .aiProvider(providerForLog)
                .requestType(requestType)
                .model(modelProvider.getModelName())
                .promptTokens(response.getPromptTokens())
                .completionTokens(response.getCompletionTokens())
                .totalTokens(response.getTotalTokens())
                .isSuccess(isSuccess)
                .errorMessage(response.getErrorMessage())
                .responseTimeMs(response.getResponseTimeMs())
                .requestedBy("AI_MONITORING_SYSTEM")
                .prompt(promptBody)
                .response(responseBody)
                .build();

            usageLog.calculateCost();
            AiUsageLog savedLog = usageLogRepository.save(usageLog);

            if (isSuccess) {
                log.info("💰 AI 사용 로그: provider={}, 모델={}, 토큰={}, 비용=${}",
                    providerForLog,
                    modelProvider.getModelName(),
                    response.getTotalTokens(),
                    String.format("%.6f", savedLog.getEstimatedCost()));
            }
        } catch (Exception e) {
            log.error("AI 사용 로그 저장 실패", e);
        }
    }

    /**
     * AIModelProvider 의 modelType 을 대문자 라벨로 정규화한다 (N3, 2026-05-25).
     *
     * <p>{@code AIModelProvider#getModelType()} 가 보통 "openai" / "gemini" 등을 반환한다.
     * 비어있으면 {@link #PROVIDER_UNKNOWN}.</p>
     */
    private String resolveProviderLabel() {
        String type = modelProvider != null ? modelProvider.getModelType() : null;
        if (type == null || type.isBlank()) {
            return PROVIDER_UNKNOWN;
        }
        return type.trim().toUpperCase(java.util.Locale.ROOT);
    }

    /**
     * system + user 프롬프트 결합 본문 (V20260529_001 prompt 컬럼 저장용).
     */
    private static String buildCombinedPromptForLog(String systemPrompt, String userPrompt) {
        StringBuilder sb = new StringBuilder();
        if (systemPrompt != null && !systemPrompt.isBlank()) {
            sb.append("[system]\n").append(systemPrompt.trim());
        }
        if (userPrompt != null && !userPrompt.isBlank()) {
            if (sb.length() > 0) {
                sb.append("\n\n");
            }
            sb.append("[user]\n").append(userPrompt.trim());
        }
        return sb.length() == 0 ? null : sb.toString();
    }
    
    /**
     * 이상 탐지 응답 파싱
     */
    private AnomalyAnalysisResult parseAnomalyResponse(String response) {
        try {
            response = cleanJsonResponse(response);
            
            boolean hasAnomaly = response.contains("\"hasAnomaly\": true") || 
                                response.contains("\"hasAnomaly\":true");
            
            String severity = extractJsonValue(response, "severity");
            double anomalyScore = Double.parseDouble(extractJsonValue(response, "anomalyScore"));
            String analysis = extractJsonValue(response, "analysis");
            String recommendation = extractJsonValue(response, "recommendation");
            
            return new AnomalyAnalysisResult(hasAnomaly, severity, anomalyScore, analysis, recommendation);
            
        } catch (Exception e) {
            log.error("이상 탐지 응답 파싱 실패: {}", response, e);
            return null;
        }
    }
    
    /**
     * 보안 위협 응답 파싱
     */
    private SecurityThreatAnalysisResult parseThreatResponse(String response) {
        try {
            response = cleanJsonResponse(response);
            
            boolean isThreat = response.contains("\"isThreat\": true") || 
                              response.contains("\"isThreat\":true");
            
            String severity = extractJsonValue(response, "severity");
            double threatScore = Double.parseDouble(extractJsonValue(response, "threatScore"));
            String threatType = extractJsonValue(response, "threatType");
            String analysis = extractJsonValue(response, "analysis");
            String recommendation = extractJsonValue(response, "recommendation");
            
            return new SecurityThreatAnalysisResult(isThreat, severity, threatScore, 
                                                   threatType, analysis, recommendation);
            
        } catch (Exception e) {
            log.error("보안 위협 응답 파싱 실패: {}", response, e);
            return null;
        }
    }
    
    private String cleanJsonResponse(String response) {
        response = response.trim();
        if (response.startsWith("```json")) {
            response = response.substring(7);
        }
        if (response.startsWith("```")) {
            response = response.substring(3);
        }
        if (response.endsWith("```")) {
            response = response.substring(0, response.length() - 3);
        }
        return response.trim();
    }
    
    private String extractJsonValue(String json, String key) {
        int keyIndex = json.indexOf("\"" + key + "\"");
        if (keyIndex == -1) return "";
        
        int colonIndex = json.indexOf(":", keyIndex);
        int valueStart = json.indexOf("\"", colonIndex) + 1;
        int valueEnd = json.indexOf("\"", valueStart);
        
        if (valueStart > 0 && valueEnd > valueStart) {
            return json.substring(valueStart, valueEnd);
        }
        
        // 숫자인 경우
        valueStart = colonIndex + 1;
        valueEnd = json.indexOf(",", valueStart);
        if (valueEnd == -1) {
            valueEnd = json.indexOf("}", valueStart);
        }
        
        return json.substring(valueStart, valueEnd).trim();
    }
    
    private String getMetricDescription(String metricType) {
        Map<String, String> descriptions = Map.of(
            "CPU_LOAD", "CPU 사용률 - 시스템 프로세서 부하",
            "MEMORY_USAGE", "메모리 사용률 - 시스템 RAM 사용량",
            "JVM_MEMORY", "JVM 메모리 사용률 - Java 힙 메모리 사용량"
        );
        return descriptions.getOrDefault(metricType, "시스템 메트릭");
    }
    
    /**
     * 이상 탐지 분석 결과 DTO
     */
    public static class AnomalyAnalysisResult {
        private final boolean hasAnomaly;
        private final String severity;
        private final double anomalyScore;
        private final String analysis;
        private final String recommendation;
        
        public AnomalyAnalysisResult(boolean hasAnomaly, String severity, double anomalyScore,
                                    String analysis, String recommendation) {
            this.hasAnomaly = hasAnomaly;
            this.severity = severity;
            this.anomalyScore = anomalyScore;
            this.analysis = analysis;
            this.recommendation = recommendation;
        }
        
        public boolean hasAnomaly() { return hasAnomaly; }
        public String getSeverity() { return severity; }
        public double getAnomalyScore() { return anomalyScore; }
        public String getAnalysis() { return analysis; }
        public String getRecommendation() { return recommendation; }
    }
    
    /**
     * 보안 위협 분석 결과 DTO
     */
    public static class SecurityThreatAnalysisResult {
        private final boolean isThreat;
        private final String severity;
        private final double threatScore;
        private final String threatType;
        private final String analysis;
        private final String recommendation;
        
        public SecurityThreatAnalysisResult(boolean isThreat, String severity, double threatScore,
                                          String threatType, String analysis, String recommendation) {
            this.isThreat = isThreat;
            this.severity = severity;
            this.threatScore = threatScore;
            this.threatType = threatType;
            this.analysis = analysis;
            this.recommendation = recommendation;
        }
        
        public boolean isThreat() { return isThreat; }
        public String getSeverity() { return severity; }
        public double getThreatScore() { return threatScore; }
        public String getThreatType() { return threatType; }
        public String getAnalysis() { return analysis; }
        public String getRecommendation() { return recommendation; }
    }
}

