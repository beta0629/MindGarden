package com.mindgarden.consultation.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.mindgarden.consultation.entity.OpenAIUsageLog;
import com.mindgarden.consultation.repository.OpenAIUsageLogRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * OpenAI API를 활용한 웰니스 컨텐츠 생성 서비스
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-21
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OpenAIWellnessService {
    
    private final OpenAIUsageLogRepository usageLogRepository;
    private final RestTemplate restTemplate = new RestTemplate();
    
    @Value("${openai.api.key:}")
    private String apiKey;
    
    @Value("${openai.api.url:https://api.openai.com/v1/chat/completions}")
    private String apiUrl;
    
    @Value("${openai.model:gpt-3.5-turbo}")
    private String model;
    
    /**
     * 웰니스 컨텐츠 생성
     * 
     * @param dayOfWeek 요일 (1-7: 월-일)
     * @param season 계절 (SPRING, SUMMER, FALL, WINTER)
     * @param category 카테고리 (MENTAL, EXERCISE, SLEEP, NUTRITION, GENERAL)
     * @return 생성된 컨텐츠 (제목과 내용)
     */
    public WellnessContent generateWellnessContent(Integer dayOfWeek, String season, String category) {
        return generateWellnessContent(dayOfWeek, season, category, "SYSTEM");
    }
    
    /**
     * 웰니스 컨텐츠 생성 (사용자 추적)
     */
    public WellnessContent generateWellnessContent(Integer dayOfWeek, String season, String category, String requestedBy) {
        if (apiKey == null || apiKey.isEmpty()) {
            log.warn("⚠️ OpenAI API 키가 설정되지 않았습니다. 기본 컨텐츠를 반환합니다.");
            logUsage("wellness", false, "API 키 미설정", 0, 0, 0, 0L, requestedBy);
            return getDefaultContent();
        }
        
        long startTime = System.currentTimeMillis();
        
        try {
            String prompt = buildPrompt(dayOfWeek, season, category);
            WellnessContent content = callOpenAIWithLogging(prompt, requestedBy);
            
            long responseTime = System.currentTimeMillis() - startTime;
            log.info("✅ OpenAI API 호출 성공 ({}ms)", responseTime);
            
            return content;
            
        } catch (Exception e) {
            long responseTime = System.currentTimeMillis() - startTime;
            log.error("❌ OpenAI API 호출 실패 ({}ms)", responseTime, e);
            logUsage("wellness", false, e.getMessage(), 0, 0, 0, responseTime, requestedBy);
            return getDefaultContent();
        }
    }
    
    /**
     * 프롬프트 생성
     */
    private String buildPrompt(Integer dayOfWeek, String season, String category) {
        String dayName = getDayName(dayOfWeek);
        String seasonName = getSeasonName(season);
        String categoryName = getCategoryName(category);
        
        return String.format(
            "당신은 마음 건강 전문가입니다. 내담자들을 위한 따뜻하고 실용적인 웰니스 팁을 작성해주세요.\n\n" +
            "조건:\n" +
            "- 요일: %s\n" +
            "- 계절: %s\n" +
            "- 주제: %s\n" +
            "- 형식: JSON 형식으로 반환 {\"title\": \"제목\", \"content\": \"HTML 내용\"}\n" +
            "- 제목: 20자 이내, 따뜻하고 격려하는 느낌\n" +
            "- 내용: HTML 형식 (h3, p, ul, li 태그 사용), 200-300자\n" +
            "- 톤: 친근하고 따뜻한 말투\n" +
            "- 구성: 인사말 + 설명 + 실천 가능한 3-5개 팁 + 마무리 격려\n" +
            "- 이모지 적절히 사용\n\n" +
            "예시:\n" +
            "{\n" +
            "  \"title\": \"새로운 한 주를 시작하는 마음가짐\",\n" +
            "  \"content\": \"<h3>💪 월요일, 새로운 시작</h3><p>새로운 한 주가 시작되었습니다...</p>\"\n" +
            "}",
            dayName, seasonName, categoryName
        );
    }
    
    /**
     * OpenAI API 호출 (로깅 포함)
     */
    private WellnessContent callOpenAIWithLogging(String prompt, String requestedBy) {
        long startTime = System.currentTimeMillis();
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);
        
        Map<String, Object> message1 = new HashMap<>();
        message1.put("role", "system");
        message1.put("content", "당신은 마음 건강 전문가이며, 내담자들을 위한 따뜻하고 실용적인 웰니스 팁을 작성합니다.");
        
        Map<String, Object> message2 = new HashMap<>();
        message2.put("role", "user");
        message2.put("content", prompt);
        
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", model);
        requestBody.put("messages", List.of(message1, message2));
        requestBody.put("max_tokens", 800);
        requestBody.put("temperature", 0.7);
        
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
                logUsage("wellness", true, null, promptTokens, completionTokens, totalTokens, responseTime, requestedBy);
                
                // 파싱
                return parseResponse(content);
            }
        }
        
        throw new RuntimeException("OpenAI API 응답 파싱 실패");
    }
    
    /**
     * API 사용 로그 저장
     */
    private void logUsage(String requestType, boolean isSuccess, String errorMessage, 
                         int promptTokens, int completionTokens, int totalTokens, 
                         long responseTimeMs, String requestedBy) {
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
                .requestedBy(requestedBy)
                .build();
            
            log.calculateCost();
            OpenAIUsageLog savedLog = usageLogRepository.save(log);
            
            if (isSuccess) {
                OpenAIWellnessService.log.info("💰 API 사용 로그 저장: {} 토큰, 예상 비용 ${}", totalTokens, 
                    String.format("%.6f", savedLog.getEstimatedCost()));
            }
        } catch (Exception e) {
            log.error("❌ API 사용 로그 저장 실패", e);
        }
    }
    
    /**
     * 응답 파싱
     */
    private WellnessContent parseResponse(String response) {
        try {
            // JSON 파싱 (간단한 방식)
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
            response = response.trim();
            
            // 간단한 JSON 파싱 (ObjectMapper 사용 권장)
            int titleStart = response.indexOf("\"title\"") + 9;
            int titleEnd = response.indexOf("\"", titleStart + 1);
            String title = response.substring(titleStart, titleEnd);
            
            int contentStart = response.indexOf("\"content\"") + 11;
            int contentEnd = response.lastIndexOf("\"");
            String content = response.substring(contentStart, contentEnd);
            
            // 이스케이프 문자 처리
            content = content.replace("\\n", "\n").replace("\\\"", "\"");
            
            return new WellnessContent(title, content);
            
        } catch (Exception e) {
            log.error("❌ 응답 파싱 실패: {}", response, e);
            return getDefaultContent();
        }
    }
    
    /**
     * 기본 컨텐츠 (API 실패 시)
     */
    private WellnessContent getDefaultContent() {
        return new WellnessContent(
            "오늘의 마음 건강 팁",
            "<h3>💚 마음 건강을 위한 시간</h3>" +
            "<p>잠시 멈춰서 깊은 호흡을 해보세요. 천천히 들이마시고, 천천히 내쉬며 마음을 가라앉혀보세요.</p>" +
            "<ul>" +
            "<li>🌬️ 깊은 호흡 5회 반복하기</li>" +
            "<li>💭 현재 순간에 집중하기</li>" +
            "<li>😊 자신에게 긍정적인 말 건네기</li>" +
            "</ul>" +
            "<p><strong>기억하세요:</strong> 작은 실천이 큰 변화를 만듭니다.</p>"
        );
    }
    
    // 헬퍼 메서드들
    
    private String getDayName(Integer dayOfWeek) {
        if (dayOfWeek == null) return "모든 요일";
        String[] days = {"", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일", "일요일"};
        return dayOfWeek >= 1 && dayOfWeek <= 7 ? days[dayOfWeek] : "모든 요일";
    }
    
    private String getSeasonName(String season) {
        if (season == null || "ALL".equals(season)) return "모든 계절";
        Map<String, String> seasons = Map.of(
            "SPRING", "봄",
            "SUMMER", "여름",
            "FALL", "가을",
            "WINTER", "겨울"
        );
        return seasons.getOrDefault(season, "모든 계절");
    }
    
    private String getCategoryName(String category) {
        if (category == null) return "일반";
        Map<String, String> categories = Map.of(
            "MENTAL", "마음 건강",
            "EXERCISE", "운동",
            "SLEEP", "수면",
            "NUTRITION", "영양",
            "GENERAL", "일반"
        );
        return categories.getOrDefault(category, "일반");
    }
    
    /**
     * 웰니스 컨텐츠 DTO
     */
    public static class WellnessContent {
        private final String title;
        private final String content;
        
        public WellnessContent(String title, String content) {
            this.title = title;
            this.content = content;
        }
        
        public String getTitle() { return title; }
        public String getContent() { return content; }
    }
}

