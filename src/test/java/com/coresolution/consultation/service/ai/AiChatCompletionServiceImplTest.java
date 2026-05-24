package com.coresolution.consultation.service.ai;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
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
import com.coresolution.core.context.TenantContextHolder;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.AfterEach;
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
        TenantContextHolder.clear();
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
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
    @DisplayName("회귀 가드 (B2) — 호출자가 set 한 ThreadLocal tenantId 가 메서드 종료 후에도 보존된다")
    void completeChat_dtoRequest_preservesCallerThreadLocalTenantId() {
        TenantContextHolder.setTenantId("tenant-outer-loop");
        when(providerResolver.resolveProvider("tenant-inner-call")).thenReturn("openai");
        when(systemConfigService.getApiKeyForProvider("openai")).thenReturn("sk");
        when(systemConfigService.getApiUrlForProvider("openai")).thenReturn("https://api.openai.com/v1/chat/completions");
        when(systemConfigService.getModelForProvider("openai")).thenReturn("gpt-4o-mini");

        Map<String, Object> msg = Map.of("role", "assistant", "content", "ok");
        Map<String, Object> choice = Map.of("message", msg);
        Map<String, Object> body = Map.of("choices", List.of(choice), "usage", Map.of());
        when(restTemplate.exchange(contains("api.openai.com"), eq(HttpMethod.POST), any(), eq(Map.class)))
                .thenReturn(ResponseEntity.ok(body));

        AiCompletionRequest request = AiCompletionRequest.builder()
                .systemPrompt("sys").userPrompt("user").tenantId("tenant-inner-call").build();
        service.completeChat(request);

        // 핵심 회귀 가드: 호출 종료 후에도 외부 루프의 tenantId 가 그대로 보존되어야 한다.
        // 이전 구현은 finally { clear() } 였고, 이 때문에 6 회 healing 호출 중 1회차 직후
        // 외부 ThreadLocal 이 비워져 2~6회차가 SYSTEM fallback 으로 회귀했다.
        assertEquals("tenant-outer-loop", TenantContextHolder.getTenantId(),
                "completeChat 종료 후 호출자의 ThreadLocal tenantId 가 보존되어야 한다 (B2)");
    }

    @Test
    @DisplayName("회귀 가드 (B2) — 진입 시 ThreadLocal 이 비어 있었다면 종료 시에도 비어 있어야 한다")
    void completeChat_dtoRequest_clearsContextWhenEnteredEmpty() {
        // 진입 전 ThreadLocal 비어 있음을 명시.
        assertNull(TenantContextHolder.getTenantId(), "사전 조건: ThreadLocal 비어 있음");
        when(providerResolver.resolveProvider("tenant-only")).thenReturn("openai");
        when(systemConfigService.getApiKeyForProvider("openai")).thenReturn("sk");
        when(systemConfigService.getApiUrlForProvider("openai")).thenReturn("https://api.openai.com/v1/chat/completions");
        when(systemConfigService.getModelForProvider("openai")).thenReturn("gpt-4o-mini");

        Map<String, Object> msg = Map.of("role", "assistant", "content", "ok");
        Map<String, Object> choice = Map.of("message", msg);
        Map<String, Object> body = Map.of("choices", List.of(choice), "usage", Map.of());
        when(restTemplate.exchange(contains("api.openai.com"), eq(HttpMethod.POST), any(), eq(Map.class)))
                .thenReturn(ResponseEntity.ok(body));

        AiCompletionRequest request = AiCompletionRequest.builder()
                .systemPrompt("sys").userPrompt("user").tenantId("tenant-only").build();
        service.completeChat(request);

        assertNull(TenantContextHolder.getTenantId(),
                "진입 시 비어 있던 ThreadLocal 은 종료 후에도 비어 있어야 한다");
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
