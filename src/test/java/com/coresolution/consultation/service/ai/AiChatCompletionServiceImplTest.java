package com.coresolution.consultation.service.ai;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.service.SystemConfigService;
import com.coresolution.consultation.service.ai.dto.AiCompletionRequest;
import com.coresolution.consultation.service.ai.dto.AiResponseFormat;
import com.coresolution.consultation.service.ai.parser.AiJsonResponseParser;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

/**
 * {@link AiChatCompletionServiceImpl} — 활성 프로바이더·폴백·외부 호출 URL 검증.
 *
 * @author CoreSolution
 * @since 2026-05-13
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AiChatCompletionServiceImpl")
class AiChatCompletionServiceImplTest {

    private static final String TENANT_ID = "tenant-impl-test";

    @Mock
    private SystemConfigService systemConfigService;

    @Mock
    private AiProviderResolver providerResolver;

    @Mock
    private RestTemplate restTemplate;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private AiJsonResponseParser jsonResponseParser;
    private AiChatCompletionServiceImpl service;

    @BeforeEach
    void setUp() {
        jsonResponseParser = new AiJsonResponseParser(objectMapper);
        service = new AiChatCompletionServiceImpl(
                systemConfigService, providerResolver, jsonResponseParser, restTemplate, objectMapper);
    }

    @Test
    @DisplayName("기본 gemini이면 Gemini generateContent URL로 POST")
    void completeChat_geminiProvider_callsGeminiUrl() {
        when(systemConfigService.getAiDefaultProvider()).thenReturn("gemini");
        when(systemConfigService.getApiKeyForProvider("gemini")).thenReturn("gk");
        when(systemConfigService.getApiUrlForProvider("gemini"))
                .thenReturn("https://generativelanguage.googleapis.com/v1beta");
        when(systemConfigService.getModelForProvider("gemini")).thenReturn("gemini-2.5-flash");

        Map<String, Object> part = Map.of("text", "제목:테스트\n이모지:💚\n내용:본문");
        Map<String, Object> content = Map.of("parts", List.of(part));
        Map<String, Object> candidate = Map.of("content", content);
        Map<String, Object> body = new HashMap<>();
        body.put("candidates", List.of(candidate));
        body.put("usageMetadata", Map.of("promptTokenCount", 1, "candidatesTokenCount", 2, "totalTokenCount", 3));

        when(restTemplate.exchange(contains("generativelanguage.googleapis.com"), eq(HttpMethod.POST), any(), eq(Map.class)))
                .thenReturn(ResponseEntity.ok(body));

        AiChatCompletionResult r = service.completeChat("sys", "user", 100, 0.5, false);
        assertTrue(r.success());
        assertTrue(r.text().contains("제목"));
        assertEquals("gemini", r.effectiveProviderId());
        assertEquals("gemini-2.5-flash", r.model());
        assertEquals(3, r.totalTokens());
    }

    @Test
    @DisplayName("claude 기본이면 openai 키가 있을 때 OpenAI Chat Completions로 POST")
    void completeChat_claudeFallbackOpenai_callsOpenAiUrl() {
        when(systemConfigService.getAiDefaultProvider()).thenReturn("claude");
        when(systemConfigService.getApiKeyForProvider("openai")).thenReturn("sk");
        when(systemConfigService.getApiUrlForProvider("openai")).thenReturn("https://api.openai.com/v1/chat/completions");
        when(systemConfigService.getModelForProvider("openai")).thenReturn("gpt-4o-mini");

        Map<String, Object> msg = Map.of("role", "assistant", "content", "{\"title\":\"t\",\"content\":\"c\"}");
        Map<String, Object> choice = Map.of("message", msg);
        Map<String, Object> usage = Map.of("prompt_tokens", 1, "completion_tokens", 2, "total_tokens", 3);
        Map<String, Object> body = Map.of("choices", List.of(choice), "usage", usage);

        when(restTemplate.exchange(contains("api.openai.com"), eq(HttpMethod.POST), any(), eq(Map.class)))
                .thenReturn(ResponseEntity.ok(body));

        AiChatCompletionResult r = service.completeChat("sys", "u", 50, 0.2, true);
        assertTrue(r.success());
        assertEquals("openai", r.effectiveProviderId());
        assertEquals("claude", r.requestedProviderId());
    }

    @Test
    @DisplayName("신규 DTO 메서드 — tenantId resolver + JSON 파싱")
    void completeChat_dtoRequest_resolvesProviderAndParsesJson() {
        when(providerResolver.resolveProvider(TENANT_ID)).thenReturn("openai");
        when(systemConfigService.getApiKeyForProvider("openai")).thenReturn("sk");
        when(systemConfigService.getApiUrlForProvider("openai")).thenReturn("https://api.openai.com/v1/chat/completions");
        when(systemConfigService.getModelForProvider("openai")).thenReturn("gpt-4o-mini");

        Map<String, Object> msg = Map.of("role", "assistant", "content", "{\"title\":\"웰니스\",\"content\":\"본문\"}");
        Map<String, Object> choice = Map.of("message", msg);
        Map<String, Object> usage = Map.of("prompt_tokens", 10, "completion_tokens", 20, "total_tokens", 30);
        Map<String, Object> body = Map.of("choices", List.of(choice), "usage", usage);

        when(restTemplate.exchange(contains("api.openai.com"), eq(HttpMethod.POST), any(), eq(Map.class)))
                .thenReturn(ResponseEntity.ok(body));

        AiCompletionRequest request = AiCompletionRequest.builder()
                .systemPrompt("sys")
                .userPrompt("user")
                .maxTokens(800)
                .temperature(0.7)
                .responseFormat(AiResponseFormat.JSON)
                .tenantId(TENANT_ID)
                .callerId("wellness")
                .build();

        AiChatCompletionResult r = service.completeChat(request);
        assertTrue(r.success());
        assertNotNull(r.parsedJson());
        assertEquals("웰니스", r.parsedJson().path("title").asText());
        assertFalse(r.isFallback());
    }

    @Test
    @DisplayName("신규 DTO — requestedProvider override")
    void completeChat_dtoRequest_providerOverride() {
        when(systemConfigService.getApiKeyForProvider("gemini")).thenReturn("gk");
        when(systemConfigService.getApiUrlForProvider("gemini"))
                .thenReturn("https://generativelanguage.googleapis.com/v1beta");
        when(systemConfigService.getModelForProvider("gemini")).thenReturn("gemini-2.5-flash");

        Map<String, Object> part = Map.of("text", "hello");
        Map<String, Object> content = Map.of("parts", List.of(part));
        Map<String, Object> candidate = Map.of("content", content);
        Map<String, Object> body = new HashMap<>();
        body.put("candidates", List.of(candidate));
        body.put("usageMetadata", Map.of("promptTokenCount", 1, "candidatesTokenCount", 1, "totalTokenCount", 2));

        when(restTemplate.exchange(contains("generativelanguage.googleapis.com"), eq(HttpMethod.POST), any(), eq(Map.class)))
                .thenReturn(ResponseEntity.ok(body));

        AiCompletionRequest request = AiCompletionRequest.builder()
                .systemPrompt("sys")
                .userPrompt("user")
                .requestedProvider("GEMINI")
                .tenantId(TENANT_ID)
                .build();

        AiChatCompletionResult r = service.completeChat(request);
        assertTrue(r.success());
        assertEquals("gemini", r.effectiveProviderId());
    }

    @Test
    @DisplayName("신규 DTO — null tenantId 예외")
    void completeChat_dtoRequest_nullTenantId() {
        AiCompletionRequest request = AiCompletionRequest.builder()
                .systemPrompt("sys")
                .userPrompt("user")
                .build();

        assertThrows(IllegalArgumentException.class, () -> service.completeChat(request));
    }

    @Test
    @DisplayName("신규 DTO — fallback 감지 (claude → openai)")
    void completeChat_dtoRequest_fallbackDetected() {
        when(providerResolver.resolveProvider(TENANT_ID)).thenReturn("claude");
        when(systemConfigService.getApiKeyForProvider("openai")).thenReturn("sk");
        when(systemConfigService.getApiUrlForProvider("openai")).thenReturn("https://api.openai.com/v1/chat/completions");
        when(systemConfigService.getModelForProvider("openai")).thenReturn("gpt-4o-mini");

        Map<String, Object> msg = Map.of("role", "assistant", "content", "text");
        Map<String, Object> choice = Map.of("message", msg);
        Map<String, Object> body = Map.of("choices", List.of(choice), "usage", Map.of());

        when(restTemplate.exchange(contains("api.openai.com"), eq(HttpMethod.POST), any(), eq(Map.class)))
                .thenReturn(ResponseEntity.ok(body));

        AiCompletionRequest request = AiCompletionRequest.builder()
                .systemPrompt("sys")
                .userPrompt("user")
                .tenantId(TENANT_ID)
                .build();

        AiChatCompletionResult r = service.completeChat(request);
        assertTrue(r.isFallback());
        assertEquals("claude", r.requestedProviderId());
        assertEquals("openai", r.effectiveProviderId());
    }
}
