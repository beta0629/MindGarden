package com.coresolution.consultation.service.ai;

import com.coresolution.consultation.service.SystemConfigService;
import com.coresolution.consultation.service.ai.dto.AiCompletionRequest;
import com.coresolution.consultation.service.ai.dto.AiResponseFormat;
import com.coresolution.consultation.service.ai.parser.AiJsonResponseParser;
import com.coresolution.core.context.TenantContextHolder;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

/**
 * 활성 AI 설정 기반 채팅 완성( OpenAI 호환 Chat Completions / Gemini generateContent ).
 *
 * @author CoreSolution
 * @since 2026-05-13
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AiChatCompletionServiceImpl implements AiChatCompletionService {

    private static final String PROVIDER_OPENAI = "openai";
    private static final String PROVIDER_GEMINI = "gemini";

    private static final String GEMINI_FALLBACK_MODEL = "gemini-2.5-flash";
    private static final String GEMINI_DEFAULT_URL = "https://generativelanguage.googleapis.com/v1beta";
    private static final String OPENAI_FALLBACK_MODEL = "gpt-4o-mini";

    private final SystemConfigService systemConfigService;
    private final AiProviderResolver providerResolver;
    private final AiJsonResponseParser jsonResponseParser;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Override
    public AiChatCompletionResult completeChat(
            String systemPrompt,
            String userPrompt,
            int maxTokens,
            double temperature,
            boolean geminiJsonResponseMimeType) {
        return completeChatInternal(
                systemPrompt,
                userPrompt,
                maxTokens,
                temperature,
                geminiJsonResponseMimeType,
                systemConfigService.getAiDefaultProvider());
    }

    @Override
    public AiChatCompletionResult completeChat(AiCompletionRequest request) {
        if (request == null || request.getTenantId() == null || request.getTenantId().isBlank()) {
            throw new IllegalArgumentException("tenantId 는 필수입니다 (멀티테넌트 격리).");
        }
        String tenantId = request.getTenantId();
        String requestedProvider;
        if (request.getRequestedProvider() != null && !request.getRequestedProvider().isBlank()) {
            requestedProvider = request.getRequestedProvider().trim().toLowerCase();
        } else {
            requestedProvider = providerResolver.resolveProvider(tenantId);
        }
        boolean jsonMime = request.getResponseFormatOrDefault() == AiResponseFormat.JSON;
        // 호출자가 이미 설정한 ThreadLocal 컨텍스트를 침범하지 않도록 진입 시점 값을 백업.
        // 핫픽스 (2026-05-24, B2): 이전 구현은 finally { clear() } 로 외부 루프의 컨텍스트까지
        // 비워버려, 스케줄러의 6회 healing AI 호출 중 1회차 직후 ThreadLocal 이 소실되고
        // 2~6회차가 "no_openai_or_gemini_api_key" 로 회귀하는 원인이 되었다.
        String previousTenantId = TenantContextHolder.getTenantId();
        try {
            TenantContextHolder.setTenantId(tenantId);
            AiChatCompletionResult raw = completeChatInternal(
                    request.getSystemPrompt(),
                    request.getUserPrompt(),
                    request.getMaxTokensOrDefault(),
                    request.getTemperatureOrDefault(),
                    jsonMime,
                    requestedProvider);
            return enrichResult(raw, request.getResponseFormatOrDefault());
        } finally {
            if (previousTenantId != null && !previousTenantId.isBlank()) {
                TenantContextHolder.setTenantId(previousTenantId);
            } else {
                TenantContextHolder.clear();
            }
        }
    }

    private AiChatCompletionResult enrichResult(AiChatCompletionResult raw, AiResponseFormat format) {
        boolean isFallback = raw.effectiveProviderId() != null
                && raw.requestedProviderId() != null
                && !raw.effectiveProviderId().equalsIgnoreCase(raw.requestedProviderId());
        JsonNode parsedJson = null;
        if (format == AiResponseFormat.JSON && raw.hasUsableText()) {
            parsedJson = jsonResponseParser.parseJson(raw.text()).orElse(null);
        }
        return new AiChatCompletionResult(
                raw.success(),
                raw.text(),
                raw.requestedProviderId(),
                raw.effectiveProviderId(),
                raw.model(),
                raw.promptTokens(),
                raw.completionTokens(),
                raw.totalTokens(),
                raw.errorMessage(),
                isFallback,
                parsedJson);
    }

    private AiChatCompletionResult completeChatInternal(
            String systemPrompt,
            String userPrompt,
            int maxTokens,
            double temperature,
            boolean geminiJsonResponseMimeType,
            String requestedProvider) {
        String requested = requestedProvider != null ? requestedProvider : systemConfigService.getAiDefaultProvider();
        try {
            Optional<EffectiveTarget> target = resolveEffectiveTarget(requested);
            if (target.isEmpty()) {
                log.warn("AI chat: requestedProvider={}, no openai/gemini API key available", requested);
                return new AiChatCompletionResult(
                        false,
                        "",
                        requested,
                        "",
                        "unknown",
                        0,
                        0,
                        0,
                        "no_openai_or_gemini_api_key");
            }
            EffectiveTarget t = target.get();
            if (PROVIDER_GEMINI.equalsIgnoreCase(t.effectiveProviderId())) {
                return callGeminiPath(
                        requested,
                        t,
                        systemPrompt,
                        userPrompt,
                        maxTokens,
                        temperature,
                        geminiJsonResponseMimeType);
            }
            return callOpenAiCompatiblePath(
                    requested,
                    t,
                    systemPrompt,
                    userPrompt,
                    maxTokens,
                    temperature);
        } catch (Exception e) {
            log.error("AI chat completion failed: requestedProvider={}, error={}", requested, e.getMessage(), e);
            String reason = e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName();
            if (reason.length() > 400) {
                reason = reason.substring(0, 400) + "...";
            }
            return new AiChatCompletionResult(
                    false,
                    "",
                    requested,
                    "",
                    "unknown",
                    0,
                    0,
                    0,
                    reason);
        }
    }

    private Optional<EffectiveTarget> resolveEffectiveTarget(String requestedProviderId) {
        String req = requestedProviderId != null ? requestedProviderId.trim().toLowerCase() : "";
        List<String> order = buildCandidateOrder(req);
        for (String p : order) {
            String key = systemConfigService.getApiKeyForProvider(p);
            if (StringUtils.hasText(key)) {
                if (!p.equalsIgnoreCase(req)) {
                    log.info("AI chat: requestedProvider={} effectiveProvider={} (fallback; no dedicated protocol for {})",
                            req, p, req);
                } else {
                    log.info("AI chat: requestedProvider={} effectiveProvider={}", req, p);
                }
                String apiUrl = systemConfigService.getApiUrlForProvider(p);
                String model = systemConfigService.getModelForProvider(p);
                return Optional.of(new EffectiveTarget(p, key, apiUrl, model));
            }
        }
        return Optional.empty();
    }

    private static List<String> buildCandidateOrder(String requestedLower) {
        if (PROVIDER_GEMINI.equals(requestedLower)) {
            return List.of(PROVIDER_GEMINI, PROVIDER_OPENAI);
        }
        return List.of(PROVIDER_OPENAI, PROVIDER_GEMINI);
    }

    private AiChatCompletionResult callGeminiPath(
            String requested,
            EffectiveTarget t,
            String systemPrompt,
            String userPrompt,
            int maxTokens,
            double temperature,
            boolean jsonMimeType) {
        String apiKey = t.apiKey();
        String baseUrl = StringUtils.hasText(t.apiUrl()) ? t.apiUrl() : GEMINI_DEFAULT_URL;
        String modelRaw = t.model();
        String modelId = normalizeGeminiModelId(modelRaw);
        if (!StringUtils.hasText(modelId)) {
            return new AiChatCompletionResult(
                    false,
                    "",
                    requested,
                    PROVIDER_GEMINI,
                    modelRaw != null ? modelRaw : "",
                    0,
                    0,
                    0,
                    "gemini_model_empty");
        }
        try {
            GeminiOutcome outcome = callGeminiApiWithOutcomeFallback(
                    apiKey, baseUrl, modelId, systemPrompt, userPrompt, maxTokens, temperature, jsonMimeType);
            if (outcome == null || !StringUtils.hasText(outcome.text())) {
                String usedModel = outcome != null ? outcome.modelUsed() : modelId;
                log.warn("AI chat Gemini empty response: requestedProvider={}, model={}", requested, usedModel);
                return new AiChatCompletionResult(
                        false,
                        "",
                        requested,
                        PROVIDER_GEMINI,
                        usedModel != null ? usedModel : modelId,
                        0,
                        0,
                        0,
                        "empty_response");
            }
            return new AiChatCompletionResult(
                    true,
                    outcome.text(),
                    requested,
                    PROVIDER_GEMINI,
                    outcome.modelUsed(),
                    outcome.promptTokens(),
                    outcome.completionTokens(),
                    outcome.totalTokens(),
                    null);
        } catch (Exception e) {
            throw e instanceof RuntimeException re ? re : new RuntimeException(e);
        }
    }

    private GeminiOutcome callGeminiApiWithOutcomeFallback(
            String apiKey,
            String baseUrl,
            String modelId,
            String systemPrompt,
            String userPrompt,
            int maxTokens,
            double temperature,
            boolean jsonMimeType) {
        try {
            return callGeminiApiSingle(apiKey, baseUrl, modelId, systemPrompt, userPrompt,
                    maxTokens, temperature, jsonMimeType);
        } catch (Exception e) {
            if (!isGeminiModelNotFoundOrUnsupported(e)) {
                throw e instanceof RuntimeException re ? re : new RuntimeException(e);
            }
            if (!GEMINI_FALLBACK_MODEL.equals(modelId)) {
                log.info("AI chat Gemini model not found (model={}), retrying with {}", modelId, GEMINI_FALLBACK_MODEL);
                return callGeminiApiSingle(apiKey, baseUrl, GEMINI_FALLBACK_MODEL, systemPrompt, userPrompt,
                        maxTokens, temperature, jsonMimeType);
            }
            if (!GEMINI_DEFAULT_URL.equals(baseUrl)) {
                log.info("AI chat Gemini retry with default URL and {}", GEMINI_FALLBACK_MODEL);
                return callGeminiApiSingle(apiKey, GEMINI_DEFAULT_URL, GEMINI_FALLBACK_MODEL, systemPrompt, userPrompt,
                        maxTokens, temperature, jsonMimeType);
            }
            throw e instanceof RuntimeException re ? re : new RuntimeException(e);
        }
    }

    private GeminiOutcome callGeminiApiSingle(
            String apiKey,
            String baseUrl,
            String model,
            String systemPrompt,
            String userPrompt,
            int maxTokens,
            double temperature,
            boolean jsonMimeType) {
        String url = (baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl)
                + "/models/" + model + ":generateContent";
        log.debug("AI chat Gemini call: url={}", url);

        String fullPrompt = systemPrompt + "\n\n" + userPrompt;

        Map<String, Object> contents = new HashMap<>();
        contents.put("parts", List.of(Map.of("text", fullPrompt)));

        Map<String, Object> generationConfig = new HashMap<>();
        generationConfig.put("maxOutputTokens", maxTokens);
        generationConfig.put("temperature", temperature);
        if (jsonMimeType) {
            generationConfig.put("responseMimeType", "application/json");
        }

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("contents", List.of(contents));
        requestBody.put("generationConfig", generationConfig);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-goog-api-key", apiKey);

        HttpEntity<Map<String, Object>> req = new HttpEntity<>(requestBody, headers);
        @SuppressWarnings("rawtypes")
        ResponseEntity<Map> res = restTemplate.exchange(url, HttpMethod.POST, req, Map.class);
        JsonNode root = objectMapper.valueToTree(res.getBody());
        JsonNode candidates = root.path("candidates");
        if (!candidates.isArray() || candidates.isEmpty()) {
            log.warn("AI chat Gemini: candidates empty");
            return new GeminiOutcome(null, model, 0, 0, 0);
        }
        JsonNode parts = candidates.path(0).path("content").path("parts");
        if (!parts.isArray() || parts.isEmpty()) {
            log.warn("AI chat Gemini: parts empty");
            return new GeminiOutcome(null, model, 0, 0, 0);
        }
        String text = parts.path(0).path("text").asText(null);
        JsonNode um = root.path("usageMetadata");
        int pt = um.path("promptTokenCount").asInt(0);
        int ct = um.path("candidatesTokenCount").asInt(0);
        int tt = um.path("totalTokenCount").asInt(0);
        if (tt == 0 && (pt > 0 || ct > 0)) {
            tt = pt + ct;
        }
        log.info("AI chat Gemini success: model={}, responseLen={}", model, text != null ? text.length() : 0);
        return new GeminiOutcome(text, model, pt, ct, tt);
    }

    private record GeminiOutcome(String text, String modelUsed, int promptTokens, int completionTokens, int totalTokens) {
    }

    private AiChatCompletionResult callOpenAiCompatiblePath(
            String requested,
            EffectiveTarget t,
            String systemPrompt,
            String userPrompt,
            int maxTokens,
            double temperature) {
        String apiKey = t.apiKey();
        String apiUrl = t.apiUrl();
        String model = t.model();
        if (!StringUtils.hasText(apiUrl)) {
            apiUrl = systemConfigService.getOpenAIApiUrl();
        }
        if (!StringUtils.hasText(model)) {
            model = systemConfigService.getOpenAIModel();
        }
        try {
            String usedModel = model;
            JsonNode root;
            try {
                root = callOpenAiFormatApiRaw(apiKey, apiUrl, usedModel, systemPrompt, userPrompt, maxTokens, temperature);
            } catch (Exception e) {
                String msg = e.getMessage() != null ? e.getMessage() : "";
                boolean modelError = e instanceof HttpClientErrorException
                        || msg.contains("404")
                        || (msg.contains("model") && (msg.contains("not found") || msg.contains("invalid")
                        || msg.contains("does not exist")));
                if (modelError && !OPENAI_FALLBACK_MODEL.equals(usedModel)) {
                    log.info("AI chat OpenAI model error (model={}), retrying with {}", usedModel, OPENAI_FALLBACK_MODEL);
                    usedModel = OPENAI_FALLBACK_MODEL;
                    root = callOpenAiFormatApiRaw(apiKey, apiUrl, usedModel, systemPrompt, userPrompt,
                            maxTokens, temperature);
                } else {
                    throw e instanceof RuntimeException re ? re : new RuntimeException(e);
                }
            }
            String text = root.path("choices").path(0).path("message").path("content").asText(null);
            if (!StringUtils.hasText(text)) {
                return new AiChatCompletionResult(
                        false,
                        "",
                        requested,
                        PROVIDER_OPENAI,
                        usedModel,
                        0,
                        0,
                        0,
                        "empty_response");
            }
            int pt = 0;
            int ct = 0;
            int tt = 0;
            JsonNode usage = root.path("usage");
            if (!usage.isMissingNode()) {
                pt = usage.path("prompt_tokens").asInt(0);
                ct = usage.path("completion_tokens").asInt(0);
                tt = usage.path("total_tokens").asInt(0);
            }
            return new AiChatCompletionResult(
                    true,
                    text,
                    requested,
                    PROVIDER_OPENAI,
                    usedModel,
                    pt,
                    ct,
                    tt,
                    null);
        } catch (Exception e) {
            throw e instanceof RuntimeException re ? re : new RuntimeException(e);
        }
    }

    private JsonNode callOpenAiFormatApiRaw(
            String apiKey,
            String apiUrl,
            String model,
            String systemPrompt,
            String userPrompt,
            int maxTokens,
            double temperature) {
        Map<String, Object> msg1 = new HashMap<>();
        msg1.put("role", "system");
        msg1.put("content", systemPrompt);

        Map<String, Object> msg2 = new HashMap<>();
        msg2.put("role", "user");
        msg2.put("content", userPrompt);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", model);
        requestBody.put("messages", List.of(msg1, msg2));
        requestBody.put("max_tokens", maxTokens);
        requestBody.put("temperature", temperature);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        HttpEntity<Map<String, Object>> req = new HttpEntity<>(requestBody, headers);
        @SuppressWarnings("rawtypes")
        ResponseEntity<Map> res = restTemplate.exchange(apiUrl, HttpMethod.POST, req, Map.class);
        return objectMapper.valueToTree(res.getBody());
    }

    private static String normalizeGeminiModelId(String model) {
        if (!StringUtils.hasText(model)) {
            return "";
        }
        String m = model.trim();
        if (m.startsWith("models/")) {
            m = m.substring("models/".length()).trim();
        }
        return m;
    }

    private static boolean isGeminiModelNotFoundOrUnsupported(Exception e) {
        if (e instanceof HttpClientErrorException he) {
            int sc = he.getStatusCode().value();
            if (sc == 404) {
                return true;
            }
        }
        String msg = e.getMessage() != null ? e.getMessage() : "";
        return msg.contains("404") || msg.contains("NOT_FOUND") || msg.contains("\"status\": \"NOT_FOUND\"");
    }

    private record EffectiveTarget(String effectiveProviderId, String apiKey, String apiUrl, String model) {
    }
}
