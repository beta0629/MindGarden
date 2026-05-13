package com.coresolution.consultation.service;

import java.util.Map;
import com.coresolution.consultation.entity.OpenAIUsageLog;
import com.coresolution.consultation.repository.OpenAIUsageLogRepository;
import com.coresolution.consultation.service.ai.AiChatCompletionResult;
import com.coresolution.consultation.service.ai.AiChatCompletionService;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
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
    private final AiChatCompletionService aiChatCompletionService;

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
     *
     * @param requestedBy 요청 주체 식별
     * @return 생성된 컨텐츠 또는 기본 컨텐츠
     */
    public WellnessContent generateWellnessContent(Integer dayOfWeek, String season, String category, String requestedBy) {
        long startTime = System.currentTimeMillis();
        try {
            String prompt = buildPrompt(dayOfWeek, season, category);
            String systemPrompt = "당신은 마음 건강 전문가이며, 내담자들을 위한 따뜻하고 실용적인 웰니스 팁을 작성합니다.";
            AiChatCompletionResult result = aiChatCompletionService.completeChat(
                    systemPrompt, prompt, 800, 0.7, true);
            long responseTime = System.currentTimeMillis() - startTime;
            String modelForLog = StringUtils.hasText(result.model()) ? result.model() : "unknown";
            if (!result.hasUsableText()) {
                String errMsg = result.errorMessage() != null ? result.errorMessage() : "empty_or_failed";
                log.warn("⚠️ 웰니스 AI 미사용/실패 — requestedProvider={}, effectiveProvider={}, model={}, reason={}",
                        result.requestedProviderId(), result.effectiveProviderId(), modelForLog, errMsg);
                logUsage("wellness", modelForLog, false, errMsg, 0, 0, 0, responseTime, requestedBy);
                return getDefaultContent();
            }
            logUsage("wellness", modelForLog, true, null,
                    result.promptTokens(), result.completionTokens(), result.totalTokens(), responseTime, requestedBy);
            WellnessContent parsed = parseResponse(result.text());
            log.info("✅ 웰니스 컨텐츠 생성 완료 ({}ms), requestedProvider={}, effectiveProvider={}, model={}",
                    responseTime, result.requestedProviderId(), result.effectiveProviderId(), modelForLog);
            return parsed;
        } catch (Exception e) {
            long responseTime = System.currentTimeMillis() - startTime;
            log.error("❌ 웰니스 컨텐츠 생성 예외 ({}ms)", responseTime, e);
            logUsage("wellness", "unknown", false, e.getMessage(), 0, 0, 0, responseTime, requestedBy);
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
                "당신은 마음 건강 전문가입니다. 내담자들을 위한 따뜻하고 실용적인 웰니스 팁을 작성해주세요.\n\n"
                        + "조건:\n"
                        + "- 요일: %s\n"
                        + "- 계절: %s\n"
                        + "- 주제: %s\n"
                        + "- 형식: JSON 형식으로 반환 {\"title\": \"제목\", \"content\": \"HTML 내용\"}\n"
                        + "- 제목: 20자 이내, 따뜻하고 격려하는 느낌\n"
                        + "- 내용: HTML 형식 (h3, p, ul, li 태그 사용), 200-300자\n"
                        + "- 톤: 친근하고 따뜻한 말투\n"
                        + "- 구성: 인사말 + 설명 + 실천 가능한 3-5개 팁 + 마무리 격려\n"
                        + "- 이모지 적절히 사용\n\n"
                        + "예시:\n"
                        + "{\n"
                        + "  \"title\": \"새로운 한 주를 시작하는 마음가짐\",\n"
                        + "  \"content\": \"<h3>💪 월요일, 새로운 시작</h3><p>새로운 한 주가 시작되었습니다...</p>\"\n"
                        + "}",
                dayName, seasonName, categoryName);
    }

    /**
     * API 사용 로그 저장
     */
    private void logUsage(String requestType, String model, boolean isSuccess, String errorMessage,
            int promptTokens, int completionTokens, int totalTokens,
            long responseTimeMs, String requestedBy) {
        try {
            OpenAIUsageLog usageLogRow = OpenAIUsageLog.builder()
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

            usageLogRow.calculateCost();
            OpenAIUsageLog savedLog = usageLogRepository.save(usageLogRow);

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
            String trimmed = response.trim();
            if (trimmed.startsWith("```json")) {
                trimmed = trimmed.substring(7);
            }
            if (trimmed.startsWith("```")) {
                trimmed = trimmed.substring(3);
            }
            if (trimmed.endsWith("```")) {
                trimmed = trimmed.substring(0, trimmed.length() - 3);
            }
            trimmed = trimmed.trim();

            int titleStart = trimmed.indexOf("\"title\"") + 9;
            int titleEnd = trimmed.indexOf("\"", titleStart + 1);
            String title = trimmed.substring(titleStart, titleEnd);

            int contentStart = trimmed.indexOf("\"content\"") + 11;
            int contentEnd = trimmed.lastIndexOf("\"");
            String content = trimmed.substring(contentStart, contentEnd);

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
                "<h3>💚 마음 건강을 위한 시간</h3>"
                        + "<p>잠시 멈춰서 깊은 호흡을 해보세요. 천천히 들이마시고, 천천히 내쉬며 마음을 가라앉혀보세요.</p>"
                        + "<ul>"
                        + "<li>🌬️ 깊은 호흡 5회 반복하기</li>"
                        + "<li>💭 현재 순간에 집중하기</li>"
                        + "<li>😊 자신에게 긍정적인 말 건네기</li>"
                        + "</ul>"
                        + "<p><strong>기억하세요:</strong> 작은 실천이 큰 변화를 만듭니다.</p>");
    }

    private String getDayName(Integer dayOfWeek) {
        if (dayOfWeek == null) {
            return "모든 요일";
        }
        String[] days = {"", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일", "일요일"};
        return dayOfWeek >= 1 && dayOfWeek <= 7 ? days[dayOfWeek] : "모든 요일";
    }

    private String getSeasonName(String season) {
        if (season == null || "ALL".equals(season)) {
            return "모든 계절";
        }
        Map<String, String> seasons = Map.of(
                "SPRING", "봄",
                "SUMMER", "여름",
                "FALL", "가을",
                "WINTER", "겨울");
        return seasons.getOrDefault(season, "모든 계절");
    }

    private String getCategoryName(String category) {
        if (category == null) {
            return "일반";
        }
        Map<String, String> categories = Map.of(
                "MENTAL", "마음 건강",
                "EXERCISE", "운동",
                "SLEEP", "수면",
                "NUTRITION", "영양",
                "GENERAL", "일반");
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

        public String getTitle() {
            return title;
        }

        public String getContent() {
            return content;
        }
    }

    /**
     * 힐링 컨텐츠 DTO
     */
    public static class HealingContent {
        private final String title;
        private final String content;
        private final String category;
        private final String emoji;

        public HealingContent(String title, String content, String category, String emoji) {
            this.title = title;
            this.content = content;
            this.category = category;
            this.emoji = emoji;
        }

        public String getTitle() {
            return title;
        }

        public String getContent() {
            return content;
        }

        public String getCategory() {
            return category;
        }

        public String getEmoji() {
            return emoji;
        }
    }
}
