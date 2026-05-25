package com.coresolution.consultation.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.entity.AiUsageLog;
import com.coresolution.consultation.repository.AiUsageLogRepository;
import com.coresolution.consultation.repository.DailyHealingContentRepository;
import com.coresolution.consultation.service.WellnessAiService.HealingContent;
import com.coresolution.consultation.service.ai.AiChatCompletionResult;
import com.coresolution.consultation.service.ai.AiChatCompletionService;
import com.coresolution.consultation.service.ai.dto.AiCompletionRequest;
import com.coresolution.consultation.service.ai.dto.AiResponseFormat;
import com.coresolution.core.context.TenantContextHolder;
import java.util.List;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

/**
 * {@link HealingContentServiceImpl} — SSOT DTO 경유 + tenantId 회귀 가드 검증.
 *
 * <p>핫픽스 (2026-05-24, B2): 6 회 healing AI 호출 loop 에서 첫 호출 후 ThreadLocal 이
 * 비워져도 동일 tenantId 가 보존되어야 한다. 이전 구현은 SYSTEM fallback 으로 회귀했으나
 * 본 픽스에서 fail-fast + 호출 시점 캡처로 보호한다.</p>
 *
 * @author CoreSolution
 * @since 2026-05-23
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("HealingContentServiceImpl — SSOT DTO 경유 + tenantId 회귀 가드")
class HealingContentServiceImplTest {

    private static final String TENANT_ID = "tenant-incheon-counseling-001";

    @Mock
    private AiUsageLogRepository usageLogRepository;

    @Mock
    private DailyHealingContentRepository dailyHealingContentRepository;

    @Mock
    private AiChatCompletionService aiChatCompletionService;

    @InjectMocks
    private HealingContentServiceImpl service;

    @BeforeEach
    void setUp() {
        TenantContextHolder.clear();
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    private AiChatCompletionResult successResult() {
        return new AiChatCompletionResult(
                true,
                "제목: 오늘의 힐링\n내용: <p>힐링 본문</p>\n이모지: 💚",
                "gemini", "gemini", "gemini-2.5-flash",
                10, 5, 15, null, false, null);
    }

    @Test
    @DisplayName("신규 DTO 경유 — completeChat(AiCompletionRequest) callerId=healing + tenantId 전파")
    void generateNewHealingContent_usesNewDto() {
        TenantContextHolder.setTenantId(TENANT_ID);
        when(aiChatCompletionService.completeChat(any(AiCompletionRequest.class))).thenReturn(successResult());

        service.generateNewHealingContent("CLIENT", "GENERAL");

        ArgumentCaptor<AiCompletionRequest> captor = ArgumentCaptor.forClass(AiCompletionRequest.class);
        verify(aiChatCompletionService).completeChat(captor.capture());
        AiCompletionRequest request = captor.getValue();
        assertEquals("healing", request.getCallerId());
        assertEquals(AiResponseFormat.TEXT, request.getResponseFormat());
        assertEquals(TENANT_ID, request.getTenantId());
        assertEquals(500, request.getMaxTokens());
    }

    @Test
    @DisplayName("회귀 가드 (B2) — 6회 loop 에서 호출자 ThreadLocal 이 SSOT 호출 직후 비워져도 모든 호출이 동일 tenantId 사용")
    void generateNewHealingContent_sixCallsRetainTenantId_evenWhenSsotClearsContext() {
        TenantContextHolder.setTenantId(TENANT_ID);
        // SSOT 가 finally 에서 ThreadLocal 을 clear 하던 회귀를 시뮬레이션.
        // 본 시나리오에서도 호출 시점 캡처 덕분에 모든 6회 호출이 동일 tenantId 를 보내야 한다.
        when(aiChatCompletionService.completeChat(any(AiCompletionRequest.class))).thenAnswer(invocation -> {
            TenantContextHolder.clear();
            return successResult();
        });

        // healing 6회 호출 시뮬레이션 (CLIENT/CONSULTANT × GENERAL/HUMOR/WARM_WORDS).
        // 각 iteration 진입 직전에 스케줄러가 setTenantId 를 재설정하는 운영 동작을 모사.
        List<String[]> matrix = List.of(
                new String[]{"CLIENT", "GENERAL"},
                new String[]{"CLIENT", "HUMOR"},
                new String[]{"CLIENT", "WARM_WORDS"},
                new String[]{"CONSULTANT", "GENERAL"},
                new String[]{"CONSULTANT", "HUMOR"},
                new String[]{"CONSULTANT", "WARM_WORDS"}
        );
        for (String[] pair : matrix) {
            TenantContextHolder.setTenantId(TENANT_ID);
            HealingContent content = service.generateNewHealingContent(pair[0], pair[1]);
            assertNotNull(content);
        }

        ArgumentCaptor<AiCompletionRequest> captor = ArgumentCaptor.forClass(AiCompletionRequest.class);
        verify(aiChatCompletionService, times(6)).completeChat(captor.capture());
        for (AiCompletionRequest request : captor.getAllValues()) {
            assertEquals(TENANT_ID, request.getTenantId(),
                    "모든 healing AI 호출이 동일 tenantId 를 사용해야 한다 (B2 회귀 가드)");
            assertEquals("healing", request.getCallerId());
        }
    }

    @Test
    @DisplayName("AiUsageLog 에 tenant_id 가 명시 저장된다 (B6 관측성)")
    void logHealingUsage_persistsTenantId() {
        TenantContextHolder.setTenantId(TENANT_ID);
        when(aiChatCompletionService.completeChat(any(AiCompletionRequest.class))).thenReturn(successResult());

        service.generateNewHealingContent("CLIENT", "GENERAL");

        ArgumentCaptor<AiUsageLog> logCaptor = ArgumentCaptor.forClass(AiUsageLog.class);
        verify(usageLogRepository).save(logCaptor.capture());
        AiUsageLog persisted = logCaptor.getValue();
        assertEquals(TENANT_ID, persisted.getTenantId(),
                "ai_usage_logs.tenant_id 는 NULL 이 아니어야 한다 (B6 관측성)");
        assertEquals("healing", persisted.getRequestedBy());
        assertEquals("HEALING_CONTENT", persisted.getRequestType());
    }

    @Test
    @DisplayName("AI 호출 실패 시에도 tenant_id 가 채워져 저장된다")
    void logHealingUsage_persistsTenantIdOnFailure() {
        TenantContextHolder.setTenantId(TENANT_ID);
        AiChatCompletionResult failure = new AiChatCompletionResult(
                false, "", "openai", "", "unknown",
                0, 0, 0, "no_openai_or_gemini_api_key", false, null);
        when(aiChatCompletionService.completeChat(any(AiCompletionRequest.class))).thenReturn(failure);

        service.generateNewHealingContent("CLIENT", "GENERAL");

        ArgumentCaptor<AiUsageLog> logCaptor = ArgumentCaptor.forClass(AiUsageLog.class);
        verify(usageLogRepository).save(logCaptor.capture());
        AiUsageLog persisted = logCaptor.getValue();
        assertEquals(TENANT_ID, persisted.getTenantId());
        assertEquals(Boolean.FALSE, persisted.getIsSuccess());
        assertEquals("no_openai_or_gemini_api_key", persisted.getErrorMessage());
    }

    @Test
    @DisplayName("N3 — 성공 시 ai_provider/prompt/response 가 AiUsageLog 에 저장된다 (V20260529_001)")
    void logHealingUsage_persistsProviderPromptResponse() {
        TenantContextHolder.setTenantId(TENANT_ID);
        when(aiChatCompletionService.completeChat(any(AiCompletionRequest.class))).thenReturn(successResult());

        service.generateNewHealingContent("CLIENT", "GENERAL");

        ArgumentCaptor<AiUsageLog> logCaptor = ArgumentCaptor.forClass(AiUsageLog.class);
        verify(usageLogRepository).save(logCaptor.capture());
        AiUsageLog persisted = logCaptor.getValue();
        assertEquals("GEMINI", persisted.getAiProvider(),
                "N3 — effectiveProvider=gemini → 대문자 GEMINI 저장 (default 'OPENAI' 회귀 차단)");
        assertEquals("gemini-2.5-flash", persisted.getModel());
        assertNotNull(persisted.getPrompt(), "system + user 결합 본문이 prompt 컬럼에 저장되어야 함");
        assertTrue(persisted.getPrompt().contains("[system]"));
        assertTrue(persisted.getPrompt().contains("[user]"));
        assertNotNull(persisted.getResponse(), "성공 시 응답 본문이 response 컬럼에 저장되어야 함");
        assertTrue(persisted.getResponse().contains("힐링"));
    }

    @Test
    @DisplayName("N3 — 실패 시 ai_provider 는 저장되고 response 는 null (V20260529_001)")
    void logHealingUsage_failure_persistsProviderWithNullResponse() {
        TenantContextHolder.setTenantId(TENANT_ID);
        AiChatCompletionResult failure = new AiChatCompletionResult(
                false, "", "openai", "openai", "gpt-4o-mini",
                0, 0, 0, "rate_limited", false, null);
        when(aiChatCompletionService.completeChat(any(AiCompletionRequest.class))).thenReturn(failure);

        service.generateNewHealingContent("CLIENT", "GENERAL");

        ArgumentCaptor<AiUsageLog> logCaptor = ArgumentCaptor.forClass(AiUsageLog.class);
        verify(usageLogRepository).save(logCaptor.capture());
        AiUsageLog persisted = logCaptor.getValue();
        assertEquals("OPENAI", persisted.getAiProvider(),
                "실패 케이스도 effectiveProvider 가 정규화되어 저장되어야 함");
        assertTrue(Boolean.FALSE.equals(persisted.getIsSuccess()));
        assertNotNull(persisted.getPrompt(),
                "실패해도 prompt 본문은 저장 (디버깅 컨텍스트 보존)");
        assertNull(persisted.getResponse(),
                "실패 시 response 는 null");
    }

    @Test
    @DisplayName("tenantId 미설정 — fail-fast 후 fallback 컨텐츠 반환 (SYSTEM fallback 제거 검증)")
    void generateNewHealingContent_blankTenantId_fallbackContent() {
        // ThreadLocal 미설정 상태 — 이전 구현은 SYSTEM fallback 으로 호출했으나
        // 핫픽스 후에는 IllegalStateException → catch → createFallbackContent 로 흐른다.
        HealingContent content = service.generateNewHealingContent("CLIENT", "GENERAL");

        assertNotNull(content);
        // SSOT 가 호출되지 않아야 한다 (회귀: 이전엔 tenantId="SYSTEM" 으로 호출되었음).
        verify(aiChatCompletionService, never()).completeChat(any(AiCompletionRequest.class));
        // usage 로깅도 호출되지 않아야 한다 (AI 호출 자체가 차단되었으므로).
        verify(usageLogRepository, never()).save(any());
    }
}
