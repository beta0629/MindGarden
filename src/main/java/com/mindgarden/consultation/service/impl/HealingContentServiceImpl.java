package com.mindgarden.consultation.service.impl;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.HashMap;
import java.util.List;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;
import com.mindgarden.consultation.entity.OpenAIUsageLog;
import com.mindgarden.consultation.repository.OpenAIUsageLogRepository;
import com.mindgarden.consultation.service.HealingContentService;
import com.mindgarden.consultation.service.OpenAIWellnessService.HealingContent;
import com.mindgarden.consultation.service.SystemConfigService;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 힐링 컨텐츠 서비스 구현체
 * GPT를 사용하여 다양한 힐링 컨텐츠 생성
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-22
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class HealingContentServiceImpl implements HealingContentService {

    private final OpenAIUsageLogRepository usageLogRepository;
    private final SystemConfigService systemConfigService;
    private final RestTemplate restTemplate;
    
    // 메모리 캐시 (실제 운영에서는 Redis 등 사용 권장)
    private final Map<String, HealingContent> contentCache = new ConcurrentHashMap<>();
    
    @Override
    public HealingContent getHealingContent(String userRole, String category) {
        String cacheKey = generateCacheKey(userRole, category);
        
        // 캐시에서 조회
        HealingContent cachedContent = contentCache.get(cacheKey);
        if (cachedContent != null) {
            log.info("💚 캐시된 힐링 컨텐츠 반환 - 역할: {}, 카테고리: {}", userRole, category);
            return cachedContent;
        }
        
        // 캐시에 없으면 새로 생성
        return generateNewHealingContent(userRole, category);
    }
    
    @Override
    public HealingContent generateNewHealingContent(String userRole, String category) {
        try {
            log.info("🎨 새로운 힐링 컨텐츠 생성 시작 - 역할: {}, 카테고리: {}", userRole, category);
            
            // 힐링 컨텐츠 전용 GPT API 호출
            String generatedContent = callHealingContentAPI(userRole, category);
            
            // 컨텐츠 파싱 및 DTO 생성
            HealingContent content = parseHealingContent(generatedContent, category);
            
            // 캐시에 저장
            String cacheKey = generateCacheKey(userRole, category);
            contentCache.put(cacheKey, content);
            
            log.info("✅ 힐링 컨텐츠 생성 완료 - 제목: {}", content.getTitle());
            
            return content;
            
        } catch (Exception e) {
            log.error("❌ 힐링 컨텐츠 생성 실패", e);
            
            // 실패 시 기본 컨텐츠 반환
            return createFallbackContent(category);
        }
    }
    
    
    /**
     * GPT 응답을 HealingContent DTO로 파싱
     */
    private HealingContent parseHealingContent(String generatedContent, String category) {
        try {
            String[] lines = generatedContent.split("\n");
            String title = "오늘의 힐링";
            String content = generatedContent;
            String emoji = "💚";
            
            for (String line : lines) {
                if (line.startsWith("제목:")) {
                    title = line.substring(3).trim();
                } else if (line.startsWith("이모지:")) {
                    emoji = line.substring(3).trim();
                } else if (line.startsWith("내용:")) {
                    content = line.substring(3).trim();
                }
            }
            
            // 제목이 기본값이면 카테고리별 기본 제목 설정
            if (title.equals("오늘의 힐링")) {
                title = getDefaultTitle(category);
            }
            
            // 이모지가 기본값이면 카테고리별 기본 이모지 설정
            if (emoji.equals("💚")) {
                emoji = getDefaultEmoji(category);
            }
            
            return new HealingContent(title, content, category, emoji);
            
        } catch (Exception e) {
            log.warn("⚠️ 힐링 컨텐츠 파싱 실패, 기본값 사용: {}", e.getMessage());
            return createFallbackContent(category);
        }
    }
    
    /**
     * 카테고리별 기본 제목 반환
     */
    private String getDefaultTitle(String category) {
        if (category == null) {
            return "오늘의 힐링";
        }
        
        switch (category) {
            case "HUMOR":
                return "오늘의 유머";
            case "WARM_WORDS":
                return "따뜻한 말 한마디";
            case "MEDITATION":
                return "오늘의 명상";
            case "MOTIVATION":
                return "오늘의 격려";
            default:
                return "오늘의 힐링";
        }
    }
    
    /**
     * 카테고리별 기본 이모지 반환
     */
    private String getDefaultEmoji(String category) {
        if (category == null) {
            return "💚";
        }
        
        switch (category) {
            case "HUMOR":
                return "😄";
            case "WARM_WORDS":
                return "🤗";
            case "MEDITATION":
                return "🧘";
            case "MOTIVATION":
                return "💪";
            default:
                return "💚";
        }
    }
    
    /**
     * 실패 시 기본 컨텐츠 생성
     */
    private HealingContent createFallbackContent(String category) {
        if (category == null) {
            category = "GENERAL";
        }
        
        String title = getDefaultTitle(category);
        String emoji = getDefaultEmoji(category);
        String content;
        
        switch (category) {
            case "HUMOR":
                content = "오늘도 수고하셨습니다! 작은 웃음이 큰 힘이 됩니다. 😊";
                break;
            case "WARM_WORDS":
                content = "당신은 충분히 잘하고 있습니다. 오늘도 고생하셨습니다. 💕";
                break;
            case "MEDITATION":
                content = "잠깐만요. 깊게 숨을 쉬며 마음의 평정을 찾아보세요. 🌸";
                break;
            case "MOTIVATION":
                content = "작은 걸음이 모여 큰 변화를 만듭니다. 오늘도 한 걸음씩 나아가세요! 🌟";
                break;
            default:
                content = "마음의 평화를 찾는 하루가 되시길 바랍니다. 💚";
                break;
        }
        
        return new HealingContent(title, content, category, emoji);
    }
    
    /**
     * 캐시 키 생성
     */
    private String generateCacheKey(String userRole, String category) {
        String today = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
        return String.format("%s_%s_%s", userRole, category != null ? category : "GENERAL", today);
    }
    
    /**
     * 힐링 컨텐츠 전용 GPT API 호출
     */
    private String callHealingContentAPI(String userRole, String category) {
        String apiKey = systemConfigService.getOpenAIApiKey();
        if (apiKey == null || apiKey.isEmpty()) {
            log.warn("⚠️ OpenAI API 키가 설정되지 않았습니다. 기본 컨텐츠를 반환합니다.");
            logHealingUsage("HEALING_CONTENT", "unknown", false, "API 키 미설정", 0, 0, 0, 0L, "SYSTEM");
            return "마음의 평화를 찾는 하루가 되시길 바랍니다. 💚";
        }
        
        long startTime = System.currentTimeMillis();
        
        try {
            String prompt = buildHealingPrompt(userRole, category);
            String apiUrl = systemConfigService.getOpenAIApiUrl();
            String model = systemConfigService.getOpenAIModel();
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);
            
            Map<String, Object> message1 = new HashMap<>();
            message1.put("role", "system");
            message1.put("content", "당신은 마음 건강 전문가이며, 내담자와 상담사를 위한 따뜻하고 실용적인 힐링 컨텐츠를 작성합니다.");
            
            Map<String, Object> message2 = new HashMap<>();
            message2.put("role", "user");
            message2.put("content", prompt);
            
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", model);
            requestBody.put("messages", List.of(message1, message2));
            requestBody.put("max_tokens", 500);
            requestBody.put("temperature", 0.8);
            
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
                    logHealingUsage("HEALING_CONTENT", model, true, null, promptTokens, completionTokens, totalTokens, responseTime, "SYSTEM");
                    
                    return content;
                }
            }
            
            throw new RuntimeException("OpenAI API 응답 파싱 실패");
            
        } catch (Exception e) {
            long responseTime = System.currentTimeMillis() - startTime;
            log.error("❌ 힐링 컨텐츠 GPT API 호출 실패 ({}ms)", responseTime, e);
            logHealingUsage("HEALING_CONTENT", "unknown", false, e.getMessage(), 0, 0, 0, responseTime, "SYSTEM");
            throw e;
        }
    }
    
    /**
     * 힐링 컨텐츠 전용 프롬프트 생성
     */
    private String buildHealingPrompt(String userRole, String category) {
        String roleText = "CLIENT".equals(userRole) ? "내담자" : "상담사";
        String categoryText = getCategoryText(category);
        
        return String.format(
            "다음 조건에 맞는 힐링 컨텐츠를 작성해주세요:\n\n" +
            "- 대상: %s\n" +
            "- 카테고리: %s\n" +
            "- 형식: HTML 형식으로 작성 (h3, p, ul, li 태그 사용)\n" +
            "- 내용: 마음의 평화와 힐링을 주는 따뜻한 메시지\n" +
            "- 길이: 200-300자 내외\n\n" +
            "HTML 태그를 포함하여 작성해주세요.",
            roleText, categoryText
        );
    }
    
    /**
     * 카테고리 텍스트 변환
     */
    private String getCategoryText(String category) {
        if (category == null) return "일반 힐링";
        
        switch (category) {
            case "HUMOR": return "유머";
            case "WARM_WORDS": return "따뜻한 말";
            case "MEDITATION": return "명상";
            case "MOTIVATION": return "격려";
            default: return "일반 힐링";
        }
    }
    
    /**
     * 힐링 컨텐츠 사용량 로깅
     */
    private void logHealingUsage(String requestType, String model, boolean isSuccess, String errorMessage, 
                                int promptTokens, int completionTokens, int totalTokens, 
                                long responseTimeMs, String requestedBy) {
        try {
            OpenAIUsageLog usageLog = OpenAIUsageLog.builder()
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
            
            usageLog.calculateCost();
            OpenAIUsageLog savedLog = usageLogRepository.save(usageLog);
            
            if (isSuccess) {
                log.info("💚 힐링 컨텐츠 사용량 로깅: {} 토큰, 예상 비용 ${}", totalTokens, 
                    String.format("%.6f", savedLog.getEstimatedCost()));
            }
        } catch (Exception e) {
            log.error("❌ 힐링 컨텐츠 사용량 로깅 실패", e);
        }
    }
}
