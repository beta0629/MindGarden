package com.coresolution.consultation.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.repository.AiUsageLogRepository;
import com.coresolution.consultation.repository.DailyHealingContentRepository;
import com.coresolution.consultation.service.ai.AiChatCompletionResult;
import com.coresolution.consultation.service.ai.AiChatCompletionService;
import com.coresolution.consultation.service.ai.dto.AiCompletionRequest;
import com.coresolution.consultation.service.ai.dto.AiResponseFormat;
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
 * HealingContentServiceImpl — SSOT DTO 경유 검증.
 *
 * @author CoreSolution
 * @since 2026-05-23
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("HealingContentServiceImpl — SSOT DTO 경유")
class HealingContentServiceImplTest {

    @Mock
    private AiUsageLogRepository usageLogRepository;

    @Mock
    private DailyHealingContentRepository dailyHealingContentRepository;

    @Mock
    private AiChatCompletionService aiChatCompletionService;

    @InjectMocks
    private HealingContentServiceImpl service;

    @Test
    @DisplayName("신규 DTO 경유 — completeChat(AiCompletionRequest) callerId=healing")
    void generateNewHealingContent_usesNewDto() {
        AiChatCompletionResult result = new AiChatCompletionResult(
                true,
                "제목: 오늘의 힐링\n내용: <p>힐링 본문</p>\n이모지: 💚",
                "openai", "openai", "gpt-4o-mini",
                10, 5, 15, null, false, null);
        when(aiChatCompletionService.completeChat(any(AiCompletionRequest.class))).thenReturn(result);

        service.generateNewHealingContent("CLIENT", "GENERAL");

        ArgumentCaptor<AiCompletionRequest> captor = ArgumentCaptor.forClass(AiCompletionRequest.class);
        verify(aiChatCompletionService).completeChat(captor.capture());
        AiCompletionRequest request = captor.getValue();
        assertEquals("healing", request.getCallerId());
        assertEquals(AiResponseFormat.TEXT, request.getResponseFormat());
        assertEquals("SYSTEM", request.getTenantId());
        assertEquals(500, request.getMaxTokens());
    }
}
