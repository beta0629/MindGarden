package com.coresolution.core.service;

import com.coresolution.consultation.entity.OpenAIUsageLog;
import com.coresolution.consultation.repository.OpenAIUsageLogRepository;
import com.coresolution.consultation.service.SystemConfigService;
import com.coresolution.core.domain.SystemMetric;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * OpenAI API를 활용한 AI 모니터링 서비스
 * 민감정보 마스킹 적용 (운영 환경)
 * 
 * @author CoreSolution
 * @version 2.0.0
 * @since 2025-12-02
 */
@Slf4j
@Service
@RequiredArgsConstructor
@ConditionalOnProperty(name = "ai.monitoring.enabled", havingValue = "true", matchIfMissing = false)
public class OpenAIMonitoringService {
    
    private final OpenAIUsageLogRepository usageLogRepository;
    private final SystemConfigService systemConfigService;
    private final RestTemplate restTemplate = new RestTemplate();
    
    @Autowired(required = false)
    private SensitiveDataMaskingService maskingService;
    
    /**
     * AI 기반 이상 탐지 분석
     * 
     * @param metrics 최근 메트릭 데이터
     * @param metricType 메트릭 타입 (CPU_LOAD, MEMORY_USAGE, JVM_MEMORY)
     * @return AI 분석 결과
     */
    public AnomalyAnalysisResult analyzeAnomalies(List<SystemMetric> metrics, String metricType) {
        String apiKey = systemConfigService.getOpenAIApiKey();
        if (apiKey == null || apiKey.isEmpty()) {
            log.warn("⚠️ OpenAI API 키가 설정되지 않았습니다. 통계 기반 분석으로 대체합니다.");
            return null;
        }
        
        long startTime = System.currentTimeMillis();
        
        try {
            String prompt = buildAnomalyPrompt(metrics, metricType);
            AnomalyAnalysisResult result = callOpenAIForAnomalyAnalysis(prompt);
            
            long responseTime = System.currentTimeMillis() - startTime;
            log.info("✅ AI 이상 탐지 분석 완료 ({}ms): {}", responseTime, metricType);
            
            return result;
            
        } catch (Exception e) {
            long responseTime = System.currentTimeMillis() - startTime;
            log.error("❌ AI 이상 탐지 분석 실패 ({}ms): {}", responseTime, metricType, e);
            logUsage("anomaly_detection", "unknown", false, e.getMessage(), 0, 0, 0, responseTime);
            return null;
        }
    }
    
    /**
     * AI 기반 보안 위협 분석
     * 민감정보 마스킹 적용 (운영 환경)
     * 
     * @param eventType 이벤트 타입
     * @param eventDetails 이벤트 상세 정보
     * @return AI 분석 결과
     */
    public SecurityThreatAnalysisResult analyzeSecurityThreat(String eventType, Map<String, Object> eventDetails) {
        String apiKey = systemConfigService.getOpenAIApiKey();
        if (apiKey == null || apiKey.isEmpty()) {
            log.warn("⚠️ OpenAI API 키가 설정되지 않았습니다. 규칙 기반 분석으로 대체합니다.");
            return null;
        }
        
        long startTime = System.currentTimeMillis();
        
        try {
            // 민감정보 마스킹 (운영 환경에서만 적용)
            Map<String, Object> maskedDetails = eventDetails;
            if (maskingService != null) {
                maskedDetails = maskingService.maskEventDetails(eventDetails);
                log.debug("🔒 민감정보 마스킹 완료: {} 필드", maskedDetails.size());
            }
            
            String prompt = buildSecurityThreatPrompt(eventType, maskedDetails);
            SecurityThreatAnalysisResult result = callOpenAIForSecurityAnalysis(prompt);
            
            long responseTime = System.currentTimeMillis() - startTime;
            log.info("✅ AI 보안 위협 분석 완료 ({}ms): {}", responseTime, eventType);
            
            return result;
            
        } catch (Exception e) {
            long responseTime = System.currentTimeMillis() - startTime;
            log.error("❌ AI 보안 위협 분석 실패 ({}ms): {}", responseTime, eventType, e);
            logUsage("security_threat_detection", "unknown", false, e.getMessage(), 0, 0, 0, responseTime);
            return null;
        }
    }
    
    /**
     * 이상 탐지용 프롬프트 생성
     */
    private String buildAnomalyPrompt(List<SystemMetric> metrics, String metricType) {
        StringBuilder metricsData = new StringBuilder();
        for (SystemMetric metric : metrics) {
            metricsData.append(String.format("- %s: %.2f%%\n", 
                metric.getCollectedAt().toString(), 
                metric.getMetricValue()));
        }
        
        String metricDescription = getMetricDescription(metricType);
        
        return String.format(
            "당신은 시스템 모니터링 전문가입니다. 다음 시스템 메트릭 데이터를 분석하여 이상 여부를 판단해주세요.\n\n" +
            "메트릭 타입: %s\n" +
            "설명: %s\n\n" +
            "최근 데이터 (시간: 값):\n%s\n" +
            "분석 요청:\n" +
            "1. 이상 패턴이 있는지 판단 (있음/없음)\n" +
            "2. 이상이 있다면 심각도 평가 (CRITICAL/HIGH/MEDIUM/LOW)\n" +
            "3. 이상 점수 (0.0-1.0)\n" +
            "4. 이상 원인 분석 (간단히)\n" +
            "5. 권장 조치사항\n\n" +
            "응답 형식 (JSON):\n" +
            "{\n" +
            "  \"hasAnomaly\": true/false,\n" +
            "  \"severity\": \"CRITICAL/HIGH/MEDIUM/LOW\",\n" +
            "  \"anomalyScore\": 0.0-1.0,\n" +
            "  \"analysis\": \"원인 분석\",\n" +
            "  \"recommendation\": \"권장 조치사항\"\n" +
            "}",
            metricType, metricDescription, metricsData.toString()
        );
    }
    
    /**
     * 보안 위협 분석용 프롬프트 생성
     */
    private String buildSecurityThreatPrompt(String eventType, Map<String, Object> eventDetails) {
        StringBuilder detailsText = new StringBuilder();
        for (Map.Entry<String, Object> entry : eventDetails.entrySet()) {
            detailsText.append(String.format("- %s: %s\n", entry.getKey(), entry.getValue()));
        }
        
        return String.format(
            "당신은 사이버 보안 전문가입니다. 다음 보안 이벤트를 분석하여 위협 수준을 평가해주세요.\n\n" +
            "이벤트 타입: %s\n\n" +
            "이벤트 상세:\n%s\n" +
            "분석 요청:\n" +
            "1. 보안 위협 여부 판단 (있음/없음)\n" +
            "2. 위협이 있다면 심각도 평가 (CRITICAL/HIGH/MEDIUM/LOW)\n" +
            "3. 위협 점수 (0.0-1.0)\n" +
            "4. 위협 분석 (공격 유형, 의도 등)\n" +
            "5. 권장 대응 조치\n\n" +
            "응답 형식 (JSON):\n" +
            "{\n" +
            "  \"isThreat\": true/false,\n" +
            "  \"severity\": \"CRITICAL/HIGH/MEDIUM/LOW\",\n" +
            "  \"threatScore\": 0.0-1.0,\n" +
            "  \"threatType\": \"공격 유형\",\n" +
            "  \"analysis\": \"위협 분석\",\n" +
            "  \"recommendation\": \"권장 대응 조치\"\n" +
            "}",
            eventType, detailsText.toString()
        );
    }
    
    /**
     * OpenAI API 호출 - 이상 탐지 분석
     */
    private AnomalyAnalysisResult callOpenAIForAnomalyAnalysis(String prompt) {
        long startTime = System.currentTimeMillis();
        
        String apiKey = systemConfigService.getOpenAIApiKey();
        String apiUrl = systemConfigService.getOpenAIApiUrl();
        String model = systemConfigService.getOpenAIModel();
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);
        
        Map<String, Object> message1 = new HashMap<>();
        message1.put("role", "system");
        message1.put("content", "당신은 시스템 모니터링 및 이상 탐지 전문가입니다. 메트릭 데이터를 분석하여 이상 패턴을 정확하게 식별합니다.");
        
        Map<String, Object> message2 = new HashMap<>();
        message2.put("role", "user");
        message2.put("content", prompt);
        
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", model);
        requestBody.put("messages", List.of(message1, message2));
        requestBody.put("max_tokens", 500);
        requestBody.put("temperature", 0.3); // 낮은 temperature로 일관된 분석
        
        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
        
        @SuppressWarnings("rawtypes")
        ResponseEntity<Map> response = restTemplate.exchange(
            apiUrl,
            HttpMethod.POST,
            request,
            Map.class
        );
        
        @SuppressWarnings("unchecked")
        Map<String, Object> responseBody = response.getBody();
        
        if (responseBody != null && responseBody.containsKey("choices")) {
            // 토큰 사용량 추출
            int promptTokens = 0;
            int completionTokens = 0;
            int totalTokens = 0;
            
            if (responseBody.containsKey("usage")) {
                @SuppressWarnings("unchecked")
                Map<String, Object> usage = (Map<String, Object>) responseBody.get("usage");
                promptTokens = (Integer) usage.getOrDefault("prompt_tokens", 0);
                completionTokens = (Integer) usage.getOrDefault("completion_tokens", 0);
                totalTokens = (Integer) usage.getOrDefault("total_tokens", 0);
            }
            
            long responseTime = System.currentTimeMillis() - startTime;
            
            // 응답 파싱
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> choices = (List<Map<String, Object>>) responseBody.get("choices");
            if (!choices.isEmpty()) {
                Map<String, Object> choice = choices.get(0);
                @SuppressWarnings("unchecked")
                Map<String, Object> message = (Map<String, Object>) choice.get("message");
                String content = (String) message.get("content");
                
                // 로깅
                logUsage("anomaly_detection", model, true, null, promptTokens, completionTokens, totalTokens, responseTime);
                
                // 파싱
                return parseAnomalyAnalysisResponse(content);
            }
        }
        
        throw new RuntimeException("OpenAI API 응답 파싱 실패");
    }
    
    /**
     * OpenAI API 호출 - 보안 위협 분석
     */
    private SecurityThreatAnalysisResult callOpenAIForSecurityAnalysis(String prompt) {
        long startTime = System.currentTimeMillis();
        
        String apiKey = systemConfigService.getOpenAIApiKey();
        String apiUrl = systemConfigService.getOpenAIApiUrl();
        String model = systemConfigService.getOpenAIModel();
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);
        
        Map<String, Object> message1 = new HashMap<>();
        message1.put("role", "system");
        message1.put("content", "당신은 사이버 보안 전문가입니다. 보안 이벤트를 분석하여 위협을 정확하게 평가합니다.");
        
        Map<String, Object> message2 = new HashMap<>();
        message2.put("role", "user");
        message2.put("content", prompt);
        
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", model);
        requestBody.put("messages", List.of(message1, message2));
        requestBody.put("max_tokens", 500);
        requestBody.put("temperature", 0.3);
        
        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
        
        @SuppressWarnings("rawtypes")
        ResponseEntity<Map> response = restTemplate.exchange(
            apiUrl,
            HttpMethod.POST,
            request,
            Map.class
        );
        
        @SuppressWarnings("unchecked")
        Map<String, Object> responseBody = response.getBody();
        
        if (responseBody != null && responseBody.containsKey("choices")) {
            int promptTokens = 0;
            int completionTokens = 0;
            int totalTokens = 0;
            
            if (responseBody.containsKey("usage")) {
                @SuppressWarnings("unchecked")
                Map<String, Object> usage = (Map<String, Object>) responseBody.get("usage");
                promptTokens = (Integer) usage.getOrDefault("prompt_tokens", 0);
                completionTokens = (Integer) usage.getOrDefault("completion_tokens", 0);
                totalTokens = (Integer) usage.getOrDefault("total_tokens", 0);
            }
            
            long responseTime = System.currentTimeMillis() - startTime;
            
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> choices = (List<Map<String, Object>>) responseBody.get("choices");
            if (!choices.isEmpty()) {
                Map<String, Object> choice = choices.get(0);
                @SuppressWarnings("unchecked")
                Map<String, Object> message = (Map<String, Object>) choice.get("message");
                String content = (String) message.get("content");
                
                logUsage("security_threat_detection", model, true, null, promptTokens, completionTokens, totalTokens, responseTime);
                
                return parseSecurityThreatAnalysisResponse(content);
            }
        }
        
        throw new RuntimeException("OpenAI API 응답 파싱 실패");
    }
    
    /**
     * API 사용 로그 저장
     */
    private void logUsage(String requestType, String model, boolean isSuccess, String errorMessage, 
                         int promptTokens, int completionTokens, int totalTokens, long responseTimeMs) {
        try {
            OpenAIUsageLog log = OpenAIUsageLog.builder()
                .requestType(requestType)
                .model(model)
                .promptTokens(promptTokens)
                .completionTokens(completionTokens)
                .totalTokens(totalTokens)
                .isSuccess(isSuccess)
                .errorMessage(errorMessage)
                .responseTimeMs(responseTimeMs)
                .requestedBy("AI_MONITORING_SYSTEM")
                .build();
            
            log.calculateCost();
            OpenAIUsageLog savedLog = usageLogRepository.save(log);
            
            if (isSuccess) {
                OpenAIMonitoringService.log.info("💰 AI 모니터링 API 사용: {} 토큰, 예상 비용 ${}", 
                    totalTokens, String.format("%.6f", savedLog.getEstimatedCost()));
            }
        } catch (Exception e) {
            log.error("❌ API 사용 로그 저장 실패", e);
        }
    }
    
    /**
     * 이상 탐지 응답 파싱
     */
    private AnomalyAnalysisResult parseAnomalyAnalysisResponse(String response) {
        try {
            response = cleanJsonResponse(response);
            
            // 간단한 JSON 파싱
            boolean hasAnomaly = response.contains("\"hasAnomaly\": true") || response.contains("\"hasAnomaly\":true");
            
            String severity = extractJsonValue(response, "severity");
            double anomalyScore = Double.parseDouble(extractJsonValue(response, "anomalyScore"));
            String analysis = extractJsonValue(response, "analysis");
            String recommendation = extractJsonValue(response, "recommendation");
            
            return new AnomalyAnalysisResult(hasAnomaly, severity, anomalyScore, analysis, recommendation);
            
        } catch (Exception e) {
            log.error("❌ 이상 탐지 응답 파싱 실패: {}", response, e);
            return null;
        }
    }
    
    /**
     * 보안 위협 응답 파싱
     */
    private SecurityThreatAnalysisResult parseSecurityThreatAnalysisResponse(String response) {
        try {
            response = cleanJsonResponse(response);
            
            boolean isThreat = response.contains("\"isThreat\": true") || response.contains("\"isThreat\":true");
            
            String severity = extractJsonValue(response, "severity");
            double threatScore = Double.parseDouble(extractJsonValue(response, "threatScore"));
            String threatType = extractJsonValue(response, "threatType");
            String analysis = extractJsonValue(response, "analysis");
            String recommendation = extractJsonValue(response, "recommendation");
            
            return new SecurityThreatAnalysisResult(isThreat, severity, threatScore, threatType, analysis, recommendation);
            
        } catch (Exception e) {
            log.error("❌ 보안 위협 응답 파싱 실패: {}", response, e);
            return null;
        }
    }
    
    /**
     * JSON 응답 정리
     */
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
    
    /**
     * JSON 값 추출
     */
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
    
    /**
     * 메트릭 설명
     */
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

