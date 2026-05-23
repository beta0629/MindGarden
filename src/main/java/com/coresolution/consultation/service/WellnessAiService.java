package com.coresolution.consultation.service;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;
import com.coresolution.consultation.entity.AiUsageLog;
import com.coresolution.consultation.repository.AiUsageLogRepository;
import com.coresolution.consultation.service.ai.AiChatCompletionResult;
import com.coresolution.consultation.service.ai.AiChatCompletionService;
import com.coresolution.consultation.service.ai.dto.AiCompletionRequest;
import com.coresolution.consultation.service.ai.dto.AiResponseFormat;
import com.coresolution.consultation.service.ai.parser.AiJsonResponseParser;
import com.coresolution.core.context.TenantContextHolder;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 웰니스 컨텐츠 생성 서비스 (테넌트별 AI 프로바이더 SSOT 경유).
 *
 * <p>트랙 B PR-2 리네임 + 마이그레이션 (기획서 §4 단계 3·4, §7 Q5=a):
 * 기존 {@code OpenAIWellnessService} 는 provider-prefix 가 OpenAI 로 고정되어 있어
 * Gemini 등으로의 라우팅 의도와 불일치했다. {@link AiChatCompletionService} 단일 진입점
 * + {@link AiCompletionRequest} DTO 를 사용하도록 전환한다. JSON 파싱은 공통 파서
 * {@link AiJsonResponseParser} 결과 ({@link AiChatCompletionResult#parsedJson()}) 를
 * 우선 활용한다.</p>
 *
 * <p>트랙 A 회전 fallback 풀은 그대로 보존한다 (1a5b672f2). AI 호출 실패 또는 파싱 실패 시
 * {@link #getDefaultContent(Integer)} 가 호출되며 결과 {@link WellnessContent#isFallback()}
 * 가 {@code true} 로 설정된다.</p>
 *
 * @author MindGarden
 * @author CoreSolution
 * @since 2025-01-21
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class WellnessAiService {

    /**
     * caller 라벨 — 사용 로그 분류 + AI SSOT 메트릭 라벨.
     */
    private static final String CALLER_ID = "wellness";

    /**
     * 시스템 스케줄러 컨텍스트에서 {@link TenantContextHolder} 가 비어있는 경우의 안전 fallback.
     * SSOT {@link AiChatCompletionService} 는 tenantId 가 필수이므로 빈 값으로 호출하면 즉시 예외.
     * 대다수 호출은 {@link com.coresolution.consultation.scheduler.WellnessNotificationScheduler}
     * 가 {@code setTenantId(tenantId)} 를 설정한 후 진입한다.
     */
    private static final String SYSTEM_TENANT_FALLBACK = "SYSTEM";

    /**
     * AI 호출 실패 시 사용할 회전 fallback 풀.
     * 트랙 A 핫픽스 (2026-05-23) — 단일 정적 본문 누적 결함 해소를 위해
     * dayOfWeek/random 으로 회전 선택. 풀 항목의 isFallback=true 로 호출자가
     * DB 저장 차단 등 분기를 결정할 수 있도록 한다.
     */
    private static final List<WellnessContent> FALLBACK_POOL = List.of(
            new WellnessContent(
                    "오늘의 마음 건강 팁",
                    "<h3>💚 마음 건강을 위한 시간</h3>"
                            + "<p>잠시 멈춰서 깊은 호흡을 해보세요. 천천히 들이마시고, 천천히 내쉬며 마음을 가라앉혀보세요.</p>"
                            + "<ul>"
                            + "<li>🌬️ 깊은 호흡 5회 반복하기</li>"
                            + "<li>💭 현재 순간에 집중하기</li>"
                            + "<li>😊 자신에게 긍정적인 말 건네기</li>"
                            + "</ul>"
                            + "<p><strong>기억하세요:</strong> 작은 실천이 큰 변화를 만듭니다.</p>",
                    true),
            new WellnessContent(
                    "오늘의 감사 일기",
                    "<h3>🙏 감사의 마음 채우기</h3>"
                            + "<p>오늘 하루를 돌아보며 감사했던 순간을 떠올려보세요. 작은 순간이라도 좋습니다.</p>"
                            + "<ul>"
                            + "<li>📝 감사했던 일 3가지 적기</li>"
                            + "<li>🌟 그 순간의 감정 떠올리기</li>"
                            + "<li>💌 누군가에게 고마움 표현하기</li>"
                            + "</ul>"
                            + "<p><strong>기억하세요:</strong> 감사는 마음의 근육을 단단하게 만듭니다.</p>",
                    true),
            new WellnessContent(
                    "오늘의 가벼운 산책",
                    "<h3>🚶 햇볕 한 줌 챙기기</h3>"
                            + "<p>잠깐이라도 햇볕을 쬐며 가볍게 걸어보세요. 몸과 마음이 함께 환기됩니다.</p>"
                            + "<ul>"
                            + "<li>🌤️ 햇볕 쬐며 10분 걷기</li>"
                            + "<li>👂 주변 소리에 귀 기울이기</li>"
                            + "<li>🌿 보이는 풍경 한 가지 마음에 담기</li>"
                            + "</ul>"
                            + "<p><strong>기억하세요:</strong> 짧은 걸음도 충분한 회복입니다.</p>",
                    true),
            new WellnessContent(
                    "오늘의 따뜻한 차 한 잔",
                    "<h3>☕ 잠시의 멈춤</h3>"
                            + "<p>좋아하는 차나 따뜻한 음료를 천천히 마셔보세요. 향과 온기에 집중해보세요.</p>"
                            + "<ul>"
                            + "<li>🍵 차의 향 깊이 들이마시기</li>"
                            + "<li>🤲 컵의 온도 손끝으로 느끼기</li>"
                            + "<li>🧘 한 모금마다 마음 쉬기</li>"
                            + "</ul>"
                            + "<p><strong>기억하세요:</strong> 멈춤이 가장 빠른 회복이 됩니다.</p>",
                    true),
            new WellnessContent(
                    "오늘의 가벼운 스트레칭",
                    "<h3>🧘 몸의 긴장 풀기</h3>"
                            + "<p>책상 앞이라면 잠시 일어나 어깨와 목을 천천히 풀어주세요.</p>"
                            + "<ul>"
                            + "<li>🙆 어깨 으쓱하며 천천히 떨구기</li>"
                            + "<li>🦒 목 좌우로 부드럽게 돌리기</li>"
                            + "<li>🤸 깍지 끼고 팔 위로 쭉 펴기</li>"
                            + "</ul>"
                            + "<p><strong>기억하세요:</strong> 5분의 스트레칭이 하루의 컨디션을 바꿉니다.</p>",
                    true),
            new WellnessContent(
                    "오늘의 마음 일기",
                    "<h3>📝 지금 감정을 한 줄로</h3>"
                            + "<p>지금 이 순간 떠오르는 감정을 한 줄로 적어보세요. 좋고 나쁨을 판단하지 않아도 됩니다.</p>"
                            + "<ul>"
                            + "<li>✍️ 감정 단어 1개 적기</li>"
                            + "<li>🔍 그 감정이 어디서 왔는지 떠올리기</li>"
                            + "<li>🌱 나에게 필요한 한 마디 건네기</li>"
                            + "</ul>"
                            + "<p><strong>기억하세요:</strong> 알아차림만으로도 마음은 한결 가벼워집니다.</p>",
                    true),
            new WellnessContent(
                    "오늘의 따뜻한 연결",
                    "<h3>📞 소중한 사람에게 안부</h3>"
                            + "<p>오랜만에 떠오른 사람에게 짧은 안부를 전해보세요. 관계는 작은 메시지에서 자랍니다.</p>"
                            + "<ul>"
                            + "<li>💬 짧은 안부 메시지 보내기</li>"
                            + "<li>📷 함께한 사진 한 장 떠올리기</li>"
                            + "<li>🤝 다음에 함께할 일 한 가지 정하기</li>"
                            + "</ul>"
                            + "<p><strong>기억하세요:</strong> 연결은 마음 건강의 가장 든든한 토대입니다.</p>",
                    true),
            new WellnessContent(
                    "오늘의 충분한 휴식",
                    "<h3>🛌 잠시 눈 감기</h3>"
                            + "<p>10분만 모든 화면을 끄고 눈을 감아보세요. 짧은 휴식이 큰 회복을 만듭니다.</p>"
                            + "<ul>"
                            + "<li>👀 눈 감고 천천히 호흡하기</li>"
                            + "<li>🔕 알림 끄고 조용한 시간 갖기</li>"
                            + "<li>🌙 좋아하는 장소 떠올리기</li>"
                            + "</ul>"
                            + "<p><strong>기억하세요:</strong> 잘 쉬는 것도 중요한 실천입니다.</p>",
                    true)
    );

    private final AiUsageLogRepository usageLogRepository;
    private final AiChatCompletionService aiChatCompletionService;
    private final AiJsonResponseParser jsonResponseParser;

    /**
     * 웰니스 컨텐츠 생성 (기본 호출자 "SYSTEM").
     *
     * @param dayOfWeek 요일 (1-7: 월-일)
     * @param season 계절 (SPRING, SUMMER, FALL, WINTER)
     * @param category 카테고리 (MENTAL, EXERCISE, SLEEP, NUTRITION, GENERAL)
     * @return 생성된 컨텐츠 (제목과 내용)
     */
    public WellnessContent generateWellnessContent(Integer dayOfWeek, String season, String category) {
        return generateWellnessContent(dayOfWeek, season, category, SYSTEM_TENANT_FALLBACK);
    }

    /**
     * 웰니스 컨텐츠 생성 (호출자 추적 + 신 SSOT 경유).
     *
     * @param dayOfWeek 요일 (1-7)
     * @param season 계절
     * @param category 카테고리
     * @param requestedBy 요청 주체 식별 (사용 로그용)
     * @return 생성된 컨텐츠 또는 회전 fallback 컨텐츠
     */
    public WellnessContent generateWellnessContent(Integer dayOfWeek, String season, String category, String requestedBy) {
        long startTime = System.currentTimeMillis();
        try {
            String prompt = buildPrompt(dayOfWeek, season, category);
            String systemPrompt = "당신은 마음 건강 전문가이며, 내담자들을 위한 따뜻하고 실용적인 웰니스 팁을 작성합니다.";
            AiCompletionRequest request = AiCompletionRequest.builder()
                    .systemPrompt(systemPrompt)
                    .userPrompt(prompt)
                    .maxTokens(800)
                    .temperature(0.7)
                    .responseFormat(AiResponseFormat.JSON)
                    .tenantId(resolveTenantId())
                    .callerId(CALLER_ID)
                    .traceId(UUID.randomUUID().toString())
                    .build();
            AiChatCompletionResult result = aiChatCompletionService.completeChat(request);
            long responseTime = System.currentTimeMillis() - startTime;
            String modelForLog = StringUtils.hasText(result.model()) ? result.model() : "unknown";
            if (!result.hasUsableText()) {
                String errMsg = result.errorMessage() != null ? result.errorMessage() : "empty_or_failed";
                log.warn("⚠️ 웰니스 AI 미사용/실패 — requestedProvider={}, effectiveProvider={}, model={}, isFallback={}, reason={}",
                        result.requestedProvider(), result.effectiveProvider(), modelForLog, result.isFallback(), errMsg);
                logUsage(CALLER_ID, modelForLog, false, errMsg, 0, 0, 0, responseTime, requestedBy);
                return getDefaultContent(dayOfWeek);
            }
            logUsage(CALLER_ID, modelForLog, true, null,
                    result.promptTokens(), result.completionTokens(), result.totalTokens(), responseTime, requestedBy);
            WellnessContent parsed = parseResponse(result, dayOfWeek);
            log.info("✅ 웰니스 컨텐츠 생성 완료 ({}ms), requestedProvider={}, effectiveProvider={}, model={}, isFallback={}",
                    responseTime, result.requestedProvider(), result.effectiveProvider(), modelForLog, result.isFallback());
            return parsed;
        } catch (Exception e) {
            long responseTime = System.currentTimeMillis() - startTime;
            log.error("❌ 웰니스 컨텐츠 생성 예외 ({}ms)", responseTime, e);
            logUsage(CALLER_ID, "unknown", false, e.getMessage(), 0, 0, 0, responseTime, requestedBy);
            return getDefaultContent(dayOfWeek);
        }
    }

    /**
     * 현재 테넌트 ID 해석.
     *
     * <p>스케줄러는 호출 전 {@code TenantContextHolder.setTenantId(tenantId)} 로 컨텍스트를 설정한다.
     * 컨텍스트가 비어 있는 경우 (예: 어드민 테스트 호출 일부 경로) {@link #SYSTEM_TENANT_FALLBACK} 으로
     * 대체한다. {@link AiChatCompletionService} 는 tenantId 가 빈 값이면 즉시 예외이므로 null 전달 금지.</p>
     */
    private String resolveTenantId() {
        String tenantId = TenantContextHolder.getTenantId();
        if (!StringUtils.hasText(tenantId)) {
            log.debug("⚠️ 웰니스 호출 — TenantContext 비어있음, SYSTEM fallback 사용");
            return SYSTEM_TENANT_FALLBACK;
        }
        return tenantId;
    }

    /**
     * 프롬프트 생성.
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
     * API 사용 로그 저장.
     */
    private void logUsage(String requestType, String model, boolean isSuccess, String errorMessage,
            int promptTokens, int completionTokens, int totalTokens,
            long responseTimeMs, String requestedBy) {
        try {
            AiUsageLog usageLogRow = AiUsageLog.builder()
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
            AiUsageLog savedLog = usageLogRepository.save(usageLogRow);

            if (isSuccess) {
                WellnessAiService.log.info("💰 AI 사용 로그 저장: {} 토큰, 예상 비용 ${}", totalTokens,
                        String.format("%.6f", savedLog.getEstimatedCost()));
            }
        } catch (Exception e) {
            log.error("❌ AI 사용 로그 저장 실패", e);
        }
    }

    /**
     * 응답 파싱 — 공통 {@link AiJsonResponseParser} 결과를 우선 활용한다.
     *
     * <p>{@link AiCompletionRequest#getResponseFormat()} 이 JSON 일 때 SSOT 가
     * {@link AiChatCompletionResult#parsedJson()} 을 채워준다. 파서가 실패한 경우 (parsedJson=null)
     * 본 메서드가 동일 파서를 한 번 더 호출하여 회수한 뒤, 그래도 실패하면 회전 fallback 으로 안내한다.</p>
     */
    private WellnessContent parseResponse(AiChatCompletionResult result, Integer dayOfWeek) {
        JsonNode node = result.parsedJson();
        if (node == null) {
            node = jsonResponseParser.parseJson(result.text()).orElse(null);
        }
        if (node == null || !node.has("title") || !node.has("content")) {
            log.warn("❌ 웰니스 AI 응답 JSON 파싱 실패 (회전 fallback 사용)");
            return getDefaultContent(dayOfWeek);
        }
        String title = node.path("title").asText("");
        String content = node.path("content").asText("");
        if (!StringUtils.hasText(title) || !StringUtils.hasText(content)) {
            log.warn("❌ 웰니스 AI 응답 title/content 비어있음 (회전 fallback 사용)");
            return getDefaultContent(dayOfWeek);
        }
        return new WellnessContent(title, content);
    }

    /**
     * AI 호출 실패 시 사용할 fallback 컨텐츠를 회전 풀에서 선택한다.
     *
     * <p>트랙 A 핫픽스 (2026-05-23) — 매일 동일 본문 누적을 막기 위해 dayOfWeek 기반 회전.
     * dayOfWeek 가 null 이면 (예: parseResponse 실패) 풀에서 무작위 선택한다.
     * 반환되는 {@link WellnessContent} 는 {@code isFallback=true} 이므로 호출자가
     * DB 영속화 차단 등 분기 처리에 활용해야 한다.</p>
     *
     * @param dayOfWeek 요일 (1-7). null 이면 random.
     * @return 회전 풀에서 선택된 fallback 컨텐츠 (isFallback=true)
     */
    private WellnessContent getDefaultContent(Integer dayOfWeek) {
        int poolSize = FALLBACK_POOL.size();
        int index;
        if (dayOfWeek != null && dayOfWeek >= 1 && dayOfWeek <= 7) {
            index = (dayOfWeek - 1) % poolSize;
        } else {
            index = ThreadLocalRandom.current().nextInt(poolSize);
        }
        return FALLBACK_POOL.get(index);
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
     * 웰니스 컨텐츠 DTO.
     *
     * <p>{@code isFallback} 플래그는 AI 호출 실패로 정적 회전 풀에서 선택된 응답인지 여부를
     * 호출자에게 알리기 위한 신호다 (트랙 A 핫픽스, 2026-05-23). 호출자는 이 값이 {@code true}
     * 일 때 DB 영속화·재사용 카운트 갱신 등 부수 효과를 차단해야 한다.</p>
     */
    public static class WellnessContent {
        private final String title;
        private final String content;
        private final boolean isFallback;

        public WellnessContent(String title, String content) {
            this(title, content, false);
        }

        public WellnessContent(String title, String content, boolean isFallback) {
            this.title = title;
            this.content = content;
            this.isFallback = isFallback;
        }

        public String getTitle() {
            return title;
        }

        public String getContent() {
            return content;
        }

        public boolean isFallback() {
            return isFallback;
        }
    }

    /**
     * 힐링 컨텐츠 DTO.
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
