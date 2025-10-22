package com.mindgarden.consultation.service.impl;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import com.mindgarden.consultation.service.HealingContentService;
import com.mindgarden.consultation.service.OpenAIWellnessService;
import com.mindgarden.consultation.service.OpenAIWellnessService.HealingContent;
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
    
    private final OpenAIWellnessService openAIWellnessService;
    
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
            
            // GPT로 컨텐츠 생성 (웰니스 서비스의 메서드 사용)
            var wellnessContent = openAIWellnessService.generateWellnessContent(1, "GENERAL", "GENERAL", "HEALING_SYSTEM");
            String generatedContent = wellnessContent.getContent();
            
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
}
