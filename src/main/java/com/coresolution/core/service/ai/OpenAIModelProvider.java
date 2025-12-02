package com.coresolution.core.service.ai;

import com.coresolution.consultation.service.SystemConfigService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * OpenAI GPT 모델 제공자
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-12-02
 */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "ai.model.provider", havingValue = "openai", matchIfMissing = true)
public class OpenAIModelProvider implements AIModelProvider {
    
    private final SystemConfigService systemConfigService;
    private final RestTemplate restTemplate = new RestTemplate();
    
    @Override
    public String getModelName() {
        return systemConfigService.getOpenAIModel();
    }
    
    @Override
    public String getModelType() {
        return "OPENAI";
    }
    
    @Override
    public AIResponse analyze(String systemPrompt, String userPrompt, int maxTokens, double temperature) {
        long startTime = System.currentTimeMillis();
        
        try {
            String apiKey = systemConfigService.getOpenAIApiKey();
            String apiUrl = systemConfigService.getOpenAIApiUrl();
            String model = systemConfigService.getOpenAIModel();
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);
            
            Map<String, Object> message1 = new HashMap<>();
            message1.put("role", "system");
            message1.put("content", systemPrompt);
            
            Map<String, Object> message2 = new HashMap<>();
            message2.put("role", "user");
            message2.put("content", userPrompt);
            
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", model);
            requestBody.put("messages", List.of(message1, message2));
            requestBody.put("max_tokens", maxTokens);
            requestBody.put("temperature", temperature);
            
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
                    
                    return new AIResponse(content, promptTokens, completionTokens, totalTokens, responseTime);
                }
            }
            
            long responseTime = System.currentTimeMillis() - startTime;
            return new AIResponse("OpenAI API 응답 파싱 실패", responseTime);
            
        } catch (Exception e) {
            long responseTime = System.currentTimeMillis() - startTime;
            log.error("OpenAI API 호출 실패: {}", e.getMessage(), e);
            return new AIResponse(e.getMessage(), responseTime);
        }
    }
    
    @Override
    public boolean isAvailable() {
        try {
            String apiKey = systemConfigService.getOpenAIApiKey();
            return apiKey != null && !apiKey.isEmpty() && !apiKey.equals("dummy-key-for-development");
        } catch (Exception e) {
            return false;
        }
    }
}

