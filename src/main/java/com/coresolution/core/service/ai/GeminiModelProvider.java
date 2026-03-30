package com.coresolution.core.service.ai;

import com.coresolution.consultation.service.SystemConfigService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * Google Gemini Pro 모델 제공자
 * AIModelProvider 인터페이스 구현
 *
 * @author MindGarden
 * @version 1.0.0
 * @since 2026-01-21
 */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "ai.model.provider", havingValue = "gemini")
public class GeminiModelProvider implements AIModelProvider {

    private final SystemConfigService systemConfigService;

    @Override
    public String getModelName() {
        return systemConfigService.getConfigValue("GEMINI_MODEL", "gemini-3.1-pro");
    }

    @Override
    public String getModelType() {
        return "GEMINI";
    }

    @Override
    public AIResponse analyze(String systemPrompt, String userPrompt, int maxTokens, double temperature) {
        long startTime = System.currentTimeMillis();

        try {
            // 설정 값 조회
            String projectId = systemConfigService.getConfigValue("GOOGLE_CLOUD_PROJECT_ID", "");
            String location = systemConfigService.getConfigValue("GEMINI_LOCATION", "us-central1");
            String model = getModelName();

            if (projectId.isEmpty()) {
                log.error("Google Cloud Project ID가 설정되지 않았습니다.");
                long responseTime = System.currentTimeMillis() - startTime;
                return new AIResponse("Google Cloud Project ID 미설정", responseTime);
            }

            // 간단한 REST API 방식으로 Gemini 호출 (Vertex AI SDK 대신)
            String apiUrl = String.format(
                "https://%s-aiplatform.googleapis.com/v1/projects/%s/locations/%s/publishers/google/models/%s:predict",
                location, projectId, location, model
            );

            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.setContentType(org.springframework.http.MediaType.APPLICATION_JSON);
            headers.setBearerAuth(systemConfigService.getConfigValue("GEMINI_API_KEY", ""));

            // 프롬프트 구성
            String fullPrompt = systemPrompt + "\n\n" + userPrompt;

            // 요청 본문 구성
            java.util.Map<String, Object> instance = new java.util.HashMap<>();
            instance.put("content", fullPrompt);

            java.util.Map<String, Object> parameters = new java.util.HashMap<>();
            parameters.put("temperature", temperature);
            parameters.put("maxOutputTokens", maxTokens);
            parameters.put("topK", 40);
            parameters.put("topP", 0.95);

            java.util.Map<String, Object> requestBody = new java.util.HashMap<>();
            requestBody.put("instances", java.util.List.of(instance));
            requestBody.put("parameters", parameters);

            org.springframework.http.HttpEntity<java.util.Map<String, Object>> request =
                new org.springframework.http.HttpEntity<>(requestBody, headers);

            org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();

            try {
                @SuppressWarnings("rawtypes")
                org.springframework.http.ResponseEntity<java.util.Map> response = restTemplate.exchange(
                    apiUrl,
                    org.springframework.http.HttpMethod.POST,
                    request,
                    java.util.Map.class
                );

                @SuppressWarnings("unchecked")
                java.util.Map<String, Object> responseBody = response.getBody();

                long responseTime = System.currentTimeMillis() - startTime;

                // 응답 파싱
                if (responseBody != null && responseBody.containsKey("predictions")) {
                    @SuppressWarnings("unchecked")
                    java.util.List<java.util.Map<String, Object>> predictions =
                        (java.util.List<java.util.Map<String, Object>>) responseBody.get("predictions");

                    if (!predictions.isEmpty()) {
                        java.util.Map<String, Object> firstPrediction = predictions.get(0);
                        String responseText = extractContentFromPrediction(firstPrediction);

                        // 토큰 수 추정
                        int estimatedPromptTokens = estimateTokens(fullPrompt);
                        int estimatedCompletionTokens = estimateTokens(responseText);
                        int totalTokens = estimatedPromptTokens + estimatedCompletionTokens;

                        log.info("✅ Gemini API 호출 성공: 모델={}, 응답시간={}ms, 토큰={}",
                            model, responseTime, totalTokens);

                        return new AIResponse(responseText, estimatedPromptTokens,
                            estimatedCompletionTokens, totalTokens, responseTime);
                    }
                }

                log.error("❌ Gemini API 응답이 비어있습니다.");
                return new AIResponse("Gemini API 응답 파싱 실패", responseTime);

            } catch (Exception apiException) {
                long responseTime = System.currentTimeMillis() - startTime;
                log.error("❌ Gemini API 호출 중 예외: {}", apiException.getMessage(), apiException);
                return new AIResponse("Gemini API 호출 오류: " + apiException.getMessage(), responseTime);
            }

        } catch (Exception e) {
            long responseTime = System.currentTimeMillis() - startTime;
            log.error("❌ Gemini API 호출 실패: {}", e.getMessage(), e);
            return new AIResponse("Gemini API 오류: " + e.getMessage(), responseTime);
        }
    }

    @Override
    public boolean isAvailable() {
        try {
            String projectId = systemConfigService.getConfigValue("GOOGLE_CLOUD_PROJECT_ID", "");
            return !projectId.isEmpty() && !projectId.equals("dummy-project");
        } catch (Exception e) {
            log.error("Gemini 가용성 확인 실패: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Gemini 응답에서 텍스트 추출
     */
    @SuppressWarnings("unchecked")
    private String extractContentFromPrediction(java.util.Map<String, Object> prediction) {
        try {
            // 방법 1: content 필드 직접 확인
            if (prediction.containsKey("content")) {
                Object contentObj = prediction.get("content");
                if (contentObj instanceof String) {
                    return (String) contentObj;
                }
            }

            // 방법 2: candidates 배열 확인
            if (prediction.containsKey("candidates")) {
                java.util.List<java.util.Map<String, Object>> candidates =
                    (java.util.List<java.util.Map<String, Object>>) prediction.get("candidates");

                if (!candidates.isEmpty()) {
                    java.util.Map<String, Object> firstCandidate = candidates.get(0);
                    if (firstCandidate.containsKey("content")) {
                        return (String) firstCandidate.get("content");
                    }
                }
            }

            // 방법 3: 전체 응답을 문자열로 변환
            return prediction.toString();

        } catch (Exception e) {
            log.error("응답 파싱 실패: {}", e.getMessage(), e);
            return "";
        }
    }

    /**
     * 토큰 수 추정 (대략적)
     * 한국어: 약 2자당 1토큰, 영어: 약 4자당 1토큰
     */
    private int estimateTokens(String text) {
        if (text == null || text.isEmpty()) {
            return 0;
        }

        // 한글과 영문 혼합 고려
        int koreanChars = 0;
        int otherChars = 0;

        for (char c : text.toCharArray()) {
            if (Character.UnicodeBlock.of(c) == Character.UnicodeBlock.HANGUL_SYLLABLES ||
                Character.UnicodeBlock.of(c) == Character.UnicodeBlock.HANGUL_JAMO ||
                Character.UnicodeBlock.of(c) == Character.UnicodeBlock.HANGUL_COMPATIBILITY_JAMO) {
                koreanChars++;
            } else {
                otherChars++;
            }
        }

        // 한글: 2자당 1토큰, 기타: 4자당 1토큰
        return (koreanChars / 2) + (otherChars / 4) + 10; // +10은 여유분
    }
}
