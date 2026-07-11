package com.coresolution.consultation.service;

import java.util.List;
import java.util.Map;
import java.util.UUID;
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
     * AI provider 컬럼 결측 시 사용할 fallback 라벨 (N3, V20260529_001).
     *
     * <p>{@link AiChatCompletionResult#effectiveProvider()} 가 null/blank 면 {@code UNKNOWN} 으로 저장한다.
     * DB DEFAULT 'OPENAI' 제거에 따른 caller 책임 정착.</p>
     */
    private static final String PROVIDER_UNKNOWN = "UNKNOWN";

    /**
     * AI 호출 실패 시 사용할 회전 fallback 풀 (B3 핫픽스, 2026-05-25).
     *
     * <p>트랙 A 핫픽스 (2026-05-23) — 단일 정적 본문 누적 결함 해소를 위해 dayOfWeek 로 회전 선택.
     * 풀 항목의 {@link WellnessContent#isFallback()} 가 {@code true} 이므로
     * 호출자({@code WellnessTemplateService}) 는 DB 저장을 차단해야 한다.</p>
     *
     * <p>B3 핫픽스 (2026-05-25) — 디자이너 핸드오프
     * ({@code docs/project-management/2026-05-25/WELLNESS_ROTATION_POOL_8_COPY_HANDOFF.md} §3)
     * 의 8가지 테마(호흡휴식 / 시작목표 / 산책자연 / 감사일기 / 마음기록 / 사람연결 /
     * 자기격려 / 명상고요) 와 정확히 일치하도록 동기화. {@code wellness_templates} DB 시드
     * (V20260529_002) 와 1:1 매핑된다. 모든 항목의 {@code title} 은 핸드오프 일관성을 위해
     * 동일 "오늘의 마음 건강 팁" 이며, 변별은 본문(header emoji + headerText + body +
     * checklist + footer) 에서 이루어진다.</p>
     *
     * <p>index 매핑 (ISO {@code java.time.DayOfWeek.getValue()} 기준):
     * 0=Default/특별(🍃 호흡과 휴식), 1=월(☀️ 시작목표), 2=화(🌱 산책자연), 3=수(🌸 감사일기),
     * 4=목(🌊 마음기록), 5=금(✨ 사람연결), 6=토(💚 자기격려), 7=일/대체(🌙 명상고요).</p>
     */
    private static final List<WellnessContent> FALLBACK_POOL = List.of(
            new WellnessContent(
                    "오늘의 마음 건강 팁",
                    "<h3>🍃 마음 건강을 위한 시간</h3>"
                            + "<p>바쁘게 달려온 일주일, 오늘은 온전히 나를 위해 쉬어가는 날입니다. 편안한 자세로 앉아 깊게 숨을 들이마시고 내쉬며, 몸과 마음의 긴장을 부드럽게 풀어주세요.</p>"
                            + "<ul>"
                            + "<li>🌬️ 눈을 감고 3번 깊게 심호흡하기</li>"
                            + "<li>☕ 따뜻한 차 한 잔 마시며 여유 가지기</li>"
                            + "<li>🛋️ 가장 편안한 공간에서 10분간 아무것도 하지 않기</li>"
                            + "</ul>"
                            + "<p><strong>기억하세요:</strong> 충분한 휴식은 내일을 위한 가장 좋은 준비입니다.</p>",
                    true),
            new WellnessContent(
                    "오늘의 마음 건강 팁",
                    "<h3>☀️ 새로운 한 주를 여는 마음</h3>"
                            + "<p>새로운 한 주가 시작되었습니다. 완벽해야 한다는 부담감은 잠시 내려놓고, 오늘 하루 내가 할 수 있는 아주 작은 목표 하나에만 다정하게 집중해 보는 건 어떨까요?</p>"
                            + "<ul>"
                            + "<li>📝 오늘 실천할 수 있는 가장 작은 목표 1개 적어보기</li>"
                            + "<li>💪 아침에 일어나서 가볍게 기지개 켜기</li>"
                            + "<li>😊 거울 속 나에게 다정한 미소 지어주기</li>"
                            + "</ul>"
                            + "<p><strong>기억하세요:</strong> 작은 발걸음이 모여 당신의 아름다운 여정이 됩니다.</p>",
                    true),
            new WellnessContent(
                    "오늘의 마음 건강 팁",
                    "<h3>🌱 자연이 주는 위로</h3>"
                            + "<p>실내에만 머물다 보면 마음도 답답해지기 쉽습니다. 잠시 밖으로 나가 뺨에 닿는 바람을 느끼고, 주변의 나무와 하늘을 바라보며 자연의 에너지를 채워보세요.</p>"
                            + "<ul>"
                            + "<li>🚶 점심시간이나 퇴근 후 15분 동안 가볍게 걷기</li>"
                            + "<li>☁️ 잠시 멈춰서 오늘의 하늘 올려다보기</li>"
                            + "<li>🌿 길가의 작은 풀꽃이나 나무 관찰하기</li>"
                            + "</ul>"
                            + "<p><strong>기억하세요:</strong> 자연은 언제나 당신을 말없이 품어줍니다.</p>",
                    true),
            new WellnessContent(
                    "오늘의 마음 건강 팁",
                    "<h3>🌸 일상을 밝히는 감사의 힘</h3>"
                            + "<p>한 주의 중간, 지치기 쉬운 수요일입니다. 당연하게 여겼던 일상 속에서 작고 소소한 기쁨을 찾아보세요. 감사의 마음은 우리 내면을 단단하고 따뜻하게 만들어줍니다.</p>"
                            + "<ul>"
                            + "<li>📖 오늘 하루 감사했던 일 3가지 기록해보기</li>"
                            + "<li>🍽️ 맛있는 식사나 간식에 온전히 집중하며 음미하기</li>"
                            + "<li>💝 나에게 도움을 준 사람에게 고마움 표현하기</li>"
                            + "</ul>"
                            + "<p><strong>기억하세요:</strong> 행복은 크기가 아니라 발견하는 횟수에 있습니다.</p>",
                    true),
            new WellnessContent(
                    "오늘의 마음 건강 팁",
                    "<h3>🌊 내 감정과 마주하기</h3>"
                            + "<p>마음속에 일어나는 파도를 억누르려 하지 말고 가만히 바라봐주세요. 기쁨, 슬픔, 불안, 분노 모두 당신의 소중한 일부입니다. 있는 그대로의 감정을 인정해주는 시간이 필요합니다.</p>"
                            + "<ul>"
                            + "<li>✍️ 지금 느끼는 감정을 솔직하게 단어로 적어보기</li>"
                            + "<li>🫂 '그럴 수 있어'라고 내 마음 다독여주기</li>"
                            + "<li>🎵 현재 내 감정과 어울리는 음악 한 곡 듣기</li>"
                            + "</ul>"
                            + "<p><strong>기억하세요:</strong> 모든 감정은 흘러가는 구름처럼 자연스러운 것입니다.</p>",
                    true),
            new WellnessContent(
                    "오늘의 마음 건강 팁",
                    "<h3>✨ 따뜻한 마음 나누기</h3>"
                            + "<p>우리는 누군가와 연결되어 있다고 느낄 때 큰 위안을 얻습니다. 바쁜 일상 속에서 잠시 잊고 지냈던 소중한 사람에게 먼저 다가가 따뜻한 안부를 건네보는 건 어떨까요?</p>"
                            + "<ul>"
                            + "<li>📱 생각나는 사람에게 짧은 안부 메시지 보내기</li>"
                            + "<li>🗣️ 주변 사람에게 진심 어린 칭찬 한 마디 건네기</li>"
                            + "<li>🍵 누군가와 함께 차 한 잔 마시며 대화 나누기</li>"
                            + "</ul>"
                            + "<p><strong>기억하세요:</strong> 진심이 담긴 작은 인사가 누군가의 하루를 구원할 수 있습니다.</p>",
                    true),
            new WellnessContent(
                    "오늘의 마음 건강 팁",
                    "<h3>💚 나를 사랑하는 시간</h3>"
                            + "<p>치열하게 한 주를 살아낸 당신, 정말 고생 많으셨습니다. 타인에게는 관대하면서 나에게는 엄격하지 않았나요? 오늘은 나 자신을 가장 친한 친구처럼 다정하게 안아주세요.</p>"
                            + "<ul>"
                            + "<li>🏆 이번 주 내가 잘해낸 일 한 가지 찾아 칭찬하기</li>"
                            + "<li>🎁 나를 위한 작고 기분 좋은 보상 준비하기</li>"
                            + "<li>🛁 따뜻한 물로 샤워하며 몸의 피로 씻어내기</li>"
                            + "</ul>"
                            + "<p><strong>기억하세요:</strong> 당신은 이미 충분히 잘하고 있고, 사랑받을 자격이 있습니다.</p>",
                    true),
            new WellnessContent(
                    "오늘의 마음 건강 팁",
                    "<h3>🌙 내면의 고요함 찾기</h3>"
                            + "<p>외부의 소음과 자극에서 잠시 벗어나, 내 안의 고요한 공간으로 들어가 보세요. 아무런 판단 없이 그저 지금 이 순간에 머무르는 것만으로도 마음은 평온을 되찾습니다.</p>"
                            + "<ul>"
                            + "<li>🧘 조용한 곳에서 5분 동안 눈 감고 명상하기</li>"
                            + "<li>📵 잠들기 전 30분 동안 스마트폰 멀리하기</li>"
                            + "<li>🕯️ 은은한 조명 아래서 차분한 시간 보내기</li>"
                            + "</ul>"
                            + "<p><strong>기억하세요:</strong> 고요함 속에서 당신의 진짜 목소리를 들을 수 있습니다.</p>",
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
        String tenantId = resolveTenantId();
        String systemPrompt = "당신은 마음 건강 전문가이며, 내담자들을 위한 따뜻하고 실용적인 웰니스 팁을 작성합니다.";
        String userPrompt = buildPrompt(dayOfWeek, season, category);
        String combinedPrompt = buildCombinedPromptForLog(systemPrompt, userPrompt);
        try {
            AiCompletionRequest request = AiCompletionRequest.builder()
                    .systemPrompt(systemPrompt)
                    .userPrompt(userPrompt)
                    .maxTokens(800)
                    .temperature(0.7)
                    .responseFormat(AiResponseFormat.JSON)
                    .tenantId(tenantId)
                    .callerId(CALLER_ID)
                    .traceId(UUID.randomUUID().toString())
                    .build();
            AiChatCompletionResult result = aiChatCompletionService.completeChat(request);
            long responseTime = System.currentTimeMillis() - startTime;
            String modelForLog = StringUtils.hasText(result.model()) ? result.model() : "unknown";
            String providerForLog = resolveProviderLabel(result);
            if (!result.hasUsableText()) {
                String errMsg = result.errorMessage() != null ? result.errorMessage() : "empty_or_failed";
                log.warn("⚠️ 웰니스 AI 미사용/실패 — requestedProvider={}, effectiveProvider={}, model={}, isFallback={}, reason={}",
                        result.requestedProvider(), result.effectiveProvider(), modelForLog, result.isFallback(), errMsg);
                logUsage(tenantId, CALLER_ID, providerForLog, modelForLog, false, errMsg,
                        0, 0, 0, responseTime, requestedBy, combinedPrompt, null);
                return getDefaultContent(dayOfWeek);
            }
            logUsage(tenantId, CALLER_ID, providerForLog, modelForLog, true, null,
                    result.promptTokens(), result.completionTokens(), result.totalTokens(),
                    responseTime, requestedBy, combinedPrompt, result.text());
            WellnessContent parsed = parseResponse(result, dayOfWeek);
            log.info("✅ 웰니스 컨텐츠 생성 완료 ({}ms), requestedProvider={}, effectiveProvider={}, model={}, isFallback={}",
                    responseTime, result.requestedProvider(), result.effectiveProvider(), modelForLog, result.isFallback());
            return parsed;
        } catch (Exception e) {
            long responseTime = System.currentTimeMillis() - startTime;
            log.error("❌ 웰니스 컨텐츠 생성 예외 ({}ms)", responseTime, e);
            logUsage(tenantId, CALLER_ID, PROVIDER_UNKNOWN, "unknown", false, e.getMessage(),
                    0, 0, 0, responseTime, requestedBy, combinedPrompt, null);
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
     * AI 사용 로그 저장 (N3 보강, V20260529_001).
     *
     * <p>{@code aiProvider} 는 {@link AiChatCompletionResult#effectiveProvider()} 를 대문자 라벨로
     * 정규화한 값이며, DB DEFAULT 'OPENAI' 제거에 따라 caller 가 반드시 명시적으로 set 한다.
     * {@code promptBody} 는 system + user 결합 본문, {@code responseBody} 는 성공 시 raw text.</p>
     */
    private void logUsage(String tenantId, String requestType, String aiProvider, String model,
            boolean isSuccess, String errorMessage,
            int promptTokens, int completionTokens, int totalTokens,
            long responseTimeMs, String requestedBy, String promptBody, String responseBody) {
        try {
            if (!StringUtils.hasText(tenantId)) {
                log.warn("⚠️ AI 사용 로그 스킵 — tenantId 누락 (requestType={}, model={})",
                        requestType, model);
                return;
            }
            AiUsageLog usageLogRow = AiUsageLog.builder()
                    .tenantId(tenantId.trim())
                    .aiProvider(aiProvider)
                    .requestType(requestType)
                    .model(model)
                    .promptTokens(promptTokens)
                    .completionTokens(completionTokens)
                    .totalTokens(totalTokens)
                    .isSuccess(isSuccess)
                    .errorMessage(errorMessage)
                    .responseTimeMs(responseTimeMs)
                    .requestedBy(requestedBy)
                    .prompt(promptBody)
                    .response(responseBody)
                    .build();

            usageLogRow.calculateCost();
            AiUsageLog savedLog = usageLogRepository.save(usageLogRow);

            if (isSuccess) {
                WellnessAiService.log.info("💰 AI 사용 로그 저장: provider={}, {} 토큰, 예상 비용 ${}",
                        aiProvider, totalTokens,
                        String.format("%.6f", savedLog.getEstimatedCost()));
            }
        } catch (Exception e) {
            log.error("❌ AI 사용 로그 저장 실패", e);
        }
    }

    /**
     * {@link AiChatCompletionResult} 의 effectiveProvider 를 대문자 라벨로 정규화한다.
     *
     * <p>N3 (V20260529_001): {@code ai_provider} 컬럼이 NOT NULL 이므로 null/blank 는
     * {@link #PROVIDER_UNKNOWN} 으로 대체한다.</p>
     */
    private static String resolveProviderLabel(AiChatCompletionResult result) {
        if (result == null) {
            return PROVIDER_UNKNOWN;
        }
        String effective = result.effectiveProvider();
        if (!StringUtils.hasText(effective)) {
            return PROVIDER_UNKNOWN;
        }
        return effective.trim().toUpperCase(java.util.Locale.ROOT);
    }

    /**
     * system + user 프롬프트를 단일 LONGTEXT 문자열로 결합한다 (N3 보강).
     *
     * <p>형식: {@code [system]<systemPrompt>\n\n[user]<userPrompt>}. 어드민 상세 모달에서
     * 사람이 읽기 좋은 raw 형식. null 입력은 빈 문자열로 안전 처리.</p>
     */
    private static String buildCombinedPromptForLog(String systemPrompt, String userPrompt) {
        StringBuilder sb = new StringBuilder();
        sb.append("[system]\n").append(systemPrompt == null ? "" : systemPrompt);
        sb.append("\n\n[user]\n").append(userPrompt == null ? "" : userPrompt);
        return sb.toString();
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
     * 반환되는 {@link WellnessContent} 는 {@code isFallback=true} 이므로 호출자가
     * DB 영속화 차단 등 분기 처리에 활용해야 한다.</p>
     *
     * <p>B3 핫픽스 (2026-05-25) — index 매핑을 디자이너 핸드오프와 일치하도록 정정.
     * 이전에는 {@code (dayOfWeek - 1) % poolSize} 로 매핑되어 일요일(7) 이 index 6
     * (자기 격려) 에 잘못 연결되고 풀 마지막 슬롯(명상과 고요) 이 사용되지 않았다.
     * 신 매핑: index = dayOfWeek (0~7 직접 매핑), 범위 밖이면 index 0 (default).</p>
     *
     * <ul>
     *   <li>dayOfWeek=null 또는 0 / 8 이상 / 음수 → index 0 (호흡과 휴식, 핸드오프 default)</li>
     *   <li>dayOfWeek=1~7 → index 1~7 (월~일요일 핸드오프 매핑)</li>
     * </ul>
     *
     * @param dayOfWeek 요일 (0=default, 1~7=월~일). null/범위 밖이면 index 0.
     * @return 회전 풀에서 선택된 fallback 컨텐츠 (isFallback=true)
     */
    private WellnessContent getDefaultContent(Integer dayOfWeek) {
        int poolSize = FALLBACK_POOL.size();
        int index;
        if (dayOfWeek != null && dayOfWeek >= 0 && dayOfWeek <= 7) {
            index = dayOfWeek;
        } else {
            index = 0;
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
     *
     * <p>Apple 1.4.1 — 의료/건강 콘텐츠는 출처를 함께 노출한다(있을 때).
     * AI 생성 컨텐츠는 출처가 비어 있을 수 있으며, 클라이언트는 `aiGenerated` 플래그로
     * "AI 생성" 배지를 표시한다.</p>
     */
    public static class HealingContent {
        private final String title;
        private final String content;
        private final String category;
        private final String emoji;
        private final String sourceLabel;
        private final String sourceUrl;
        private final String sourceAuthor;
        private final Integer sourcePublishedYear;
        private final boolean aiGenerated;

        public HealingContent(String title, String content, String category, String emoji) {
            this(title, content, category, emoji, null, null, null, null, true);
        }

        public HealingContent(
                String title,
                String content,
                String category,
                String emoji,
                String sourceLabel,
                String sourceUrl,
                String sourceAuthor,
                Integer sourcePublishedYear,
                boolean aiGenerated) {
            this.title = title;
            this.content = content;
            this.category = category;
            this.emoji = emoji;
            this.sourceLabel = sourceLabel;
            this.sourceUrl = sourceUrl;
            this.sourceAuthor = sourceAuthor;
            this.sourcePublishedYear = sourcePublishedYear;
            this.aiGenerated = aiGenerated;
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

        public String getSourceLabel() {
            return sourceLabel;
        }

        public String getSourceUrl() {
            return sourceUrl;
        }

        public String getSourceAuthor() {
            return sourceAuthor;
        }

        public Integer getSourcePublishedYear() {
            return sourcePublishedYear;
        }

        public boolean isAiGenerated() {
            return aiGenerated;
        }
    }
}
