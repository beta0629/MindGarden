package com.coresolution.consultation.service.impl;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.AiUsageLog;
import com.coresolution.consultation.entity.DailyHealingContent;
import com.coresolution.consultation.repository.AiUsageLogRepository;
import com.coresolution.consultation.repository.DailyHealingContentRepository;
import com.coresolution.consultation.service.HealingContentService;
import com.coresolution.consultation.service.WellnessAiService.HealingContent;
import com.coresolution.consultation.service.ai.AiChatCompletionResult;
import com.coresolution.consultation.service.ai.AiChatCompletionService;
import com.coresolution.consultation.service.ai.dto.AiCompletionRequest;
import com.coresolution.consultation.service.ai.dto.AiResponseFormat;
import com.coresolution.core.context.TenantContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
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

    private static final String CALLER_ID = "healing";

    /**
     * AI provider 컬럼 결측 시 사용할 fallback 라벨 (N3, V20260529_001).
     */
    private static final String PROVIDER_UNKNOWN = "UNKNOWN";

    private final AiUsageLogRepository usageLogRepository;
    private final DailyHealingContentRepository dailyHealingContentRepository;
    private final AiChatCompletionService aiChatCompletionService;
    
    // 메모리 캐시 (실제 운영에서는 Redis 등 사용 권장)
    private final Map<String, HealingContent> contentCache = new ConcurrentHashMap<>();
    
    @Override
    public HealingContent getHealingContent(String userRole, String category) {
        log.info("🔍 힐링 컨텐츠 요청 - 역할: {}, 카테고리: {}", userRole, category);
        
        try {
            // DB에서 오늘의 힐링 컨텐츠 조회
            LocalDate today = LocalDate.now();
            String categoryToSearch = category != null ? category : "GENERAL";
            
            var dailyContent = dailyHealingContentRepository.findByDateAndUserRoleAndCategory(
                today, userRole, categoryToSearch
            );
            
            if (dailyContent.isPresent()) {
                DailyHealingContent content = dailyContent.get();
                log.info("💚 DB에서 힐링 컨텐츠 조회 성공 - 역할: {}, 카테고리: {}, 제목: {}", 
                    userRole, category, content.getTitle());
                
                return new HealingContent(
                    content.getTitle(),
                    content.getContent(),
                    content.getCategory(),
                    content.getEmoji()
                );
            }
            
            log.info("🆕 DB에 오늘의 힐링 컨텐츠 없음 - 새로 생성 시작 - 역할: {}, 카테고리: {}", userRole, category);
            // DB에 없으면 새로 생성 (fallback)
            return generateNewHealingContent(userRole, category);
            
        } catch (Exception e) {
            log.error("❌ 힐링 컨텐츠 조회 실패 - 역할: {}, 카테고리: {}", userRole, category, e);
            // 오류 시 새로 생성
            return generateNewHealingContent(userRole, category);
        }
    }
    
    @Override
    public HealingContent generateNewHealingContent(String userRole, String category) {
        try {
            log.info("🎨 새로운 힐링 컨텐츠 생성 시작 - 역할: {}, 카테고리: {}", userRole, category);

            // 핫픽스 (2026-05-24, B2): tenantId 를 호출 시점에 한 번 캡처하여 lazy resolve 회귀 차단.
            // 이전 구현은 매 SSOT 호출마다 ThreadLocal 을 다시 읽었고, AiChatCompletionServiceImpl
            // finally clear 와 결합되어 2회차부터 "SYSTEM" fallback 으로 빠지는 원인이었다.
            String tenantId = resolveTenantId();

            // 힐링 컨텐츠 전용 GPT API 호출
            String generatedContent = callHealingContentAPI(userRole, category, tenantId);
            
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
     * 힐링 컨텐츠 전용 GPT API 호출.
     *
     * @param userRole 사용자 역할 (CLIENT/CONSULTANT)
     * @param category 카테고리 (GENERAL/HUMOR/WARM_WORDS 등)
     * @param tenantId 테넌트 ID (호출 시점에 캡처된 값, blank 금지)
     * @return AI 생성 텍스트 또는 fallback 문구
     */
    private String callHealingContentAPI(String userRole, String category, String tenantId) {
        long startTime = System.currentTimeMillis();
        String systemPrompt = "당신은 마음 건강 전문가이며, 내담자와 상담사를 위한 따뜻하고 실용적인 힐링 컨텐츠를 작성합니다.";
        String prompt = buildHealingPrompt(userRole, category);
        String combinedPrompt = buildCombinedPromptForLog(systemPrompt, prompt);
        AiCompletionRequest request = AiCompletionRequest.builder()
                .systemPrompt(systemPrompt)
                .userPrompt(prompt)
                .maxTokens(500)
                .temperature(0.8)
                .responseFormat(AiResponseFormat.TEXT)
                .tenantId(tenantId)
                .callerId(CALLER_ID)
                .traceId(UUID.randomUUID().toString())
                .build();
        AiChatCompletionResult result = aiChatCompletionService.completeChat(request);
        long responseTime = System.currentTimeMillis() - startTime;
        String modelForLog = StringUtils.hasText(result.model()) ? result.model() : "unknown";
        String providerForLog = resolveProviderLabel(result);
        if (!result.success() || !StringUtils.hasText(result.text())) {
            String err = result.errorMessage() != null ? result.errorMessage() : "call_failed";
            log.warn("⚠️ 힐링 AI 호출 실패 — tenantId={}, requestedProvider={}, effectiveProvider={}, model={}, reason={}",
                    tenantId, result.requestedProvider(), result.effectiveProvider(), modelForLog, err);
            logHealingUsage(tenantId, "HEALING_CONTENT", providerForLog, modelForLog, false, err,
                    0, 0, 0, responseTime, combinedPrompt, null);
            return "마음의 평화를 찾는 하루가 되시길 바랍니다. 💚";
        }
        log.info("💚 힐링 AI 생성 완료 — tenantId={}, requestedProvider={}, effectiveProvider={}, model={}",
                tenantId, result.requestedProvider(), result.effectiveProvider(), modelForLog);
        logHealingUsage(tenantId, "HEALING_CONTENT", providerForLog, modelForLog, true, null,
                result.promptTokens(), result.completionTokens(), result.totalTokens(),
                responseTime, combinedPrompt, result.text());
        return result.text();
    }

    /**
     * 호출 시점의 TenantContextHolder 값을 캡처한다.
     * 핫픽스 (2026-05-24, B2): blank 일 경우 fail-fast — 이전 SYSTEM fallback 은
     * system_config 미존재로 인한 "no_openai_or_gemini_api_key" 회귀의 트리거였다.
     * 호출자(스케줄러/컨트롤러)는 진입 직전에 명시적으로 setTenantId 를 보장해야 한다.
     *
     * @return 현재 ThreadLocal 의 tenantId
     * @throws IllegalStateException tenantId 가 설정되지 않은 경우
     */
    private String resolveTenantId() {
        String tenantId = TenantContextHolder.getTenantId();
        if (!StringUtils.hasText(tenantId)) {
            log.error("❌ HEALING tenantId 미설정 — 호출자에서 TenantContextHolder.setTenantId() 보장 필요");
            throw new IllegalStateException("HEALING 호출에 tenantId 가 설정되지 않았습니다 (멀티테넌트 격리).");
        }
        return tenantId;
    }
    
    /**
     * 힐링 컨텐츠 전용 프롬프트 생성
     */
    private String buildHealingPrompt(String userRole, String category) {
        // 표준화 2025-12-05: enum 활용
        UserRole role = UserRole.fromString(userRole);
        String roleText = (role == UserRole.CLIENT) ? "내담자" : "상담사";
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
     * 힐링 컨텐츠 사용량 로깅 (tenant_id + N3 보강 컬럼 명시 저장).
     *
     * <p>핫픽스 (2026-05-24, B6): 이전 구현은 tenant_id 컬럼을 set 하지 않아 운영 관측 불가.</p>
     * <p>2026-05-25 N3 보강 (V20260529_001): {@code aiProvider} + {@code prompt}/{@code response}
     * 본문을 함께 저장한다. aiProvider 는 entity NOT NULL — caller 가 반드시 effectiveProvider 정규화 결과 전달.</p>
     */
    private void logHealingUsage(String tenantId, String requestType, String aiProvider, String model,
                                boolean isSuccess, String errorMessage, int promptTokens, int completionTokens,
                                int totalTokens, long responseTimeMs,
                                String promptBody, String responseBody) {
        try {
            AiUsageLog usageLog = AiUsageLog.builder()
                .tenantId(tenantId)
                .aiProvider(aiProvider)
                .requestType(requestType)
                .model(model)
                .promptTokens(promptTokens)
                .completionTokens(completionTokens)
                .totalTokens(totalTokens)
                .isSuccess(isSuccess)
                .errorMessage(errorMessage)
                .responseTimeMs(responseTimeMs)
                .requestedBy(CALLER_ID)
                .prompt(promptBody)
                .response(responseBody)
                .build();

            usageLog.calculateCost();
            AiUsageLog savedLog = usageLogRepository.save(usageLog);

            if (isSuccess && savedLog != null && savedLog.getEstimatedCost() != null) {
                log.info("💚 힐링 컨텐츠 사용량 로깅: tenantId={}, provider={}, {} 토큰, 예상 비용 ${}",
                    tenantId, aiProvider, totalTokens, String.format("%.6f", savedLog.getEstimatedCost()));
            }
        } catch (Exception e) {
            log.error("❌ 힐링 컨텐츠 사용량 로깅 실패", e);
        }
    }

    /**
     * SSOT 결과의 effectiveProvider 를 대문자 라벨로 정규화 (N3 — 2026-05-25).
     */
    private static String resolveProviderLabel(AiChatCompletionResult result) {
        String effective = result != null ? result.effectiveProvider() : null;
        if (StringUtils.hasText(effective)) {
            return effective.trim().toUpperCase(java.util.Locale.ROOT);
        }
        String requested = result != null ? result.requestedProvider() : null;
        if (StringUtils.hasText(requested)) {
            return requested.trim().toUpperCase(java.util.Locale.ROOT);
        }
        return PROVIDER_UNKNOWN;
    }

    /**
     * system + user 프롬프트를 결합한 본문을 생성한다 (V20260529_001 prompt 컬럼 저장용).
     */
    private static String buildCombinedPromptForLog(String systemPrompt, String userPrompt) {
        StringBuilder sb = new StringBuilder();
        if (StringUtils.hasText(systemPrompt)) {
            sb.append("[system]\n").append(systemPrompt.trim());
        }
        if (StringUtils.hasText(userPrompt)) {
            if (sb.length() > 0) {
                sb.append("\n\n");
            }
            sb.append("[user]\n").append(userPrompt.trim());
        }
        return sb.length() == 0 ? null : sb.toString();
    }
}
