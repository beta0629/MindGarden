package com.coresolution.consultation.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.Collections;
import com.coresolution.consultation.entity.WellnessTemplate;
import com.coresolution.consultation.repository.WellnessTemplateRepository;
import com.coresolution.consultation.service.OpenAIWellnessService.WellnessContent;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

/**
 * 트랙 A 핫픽스 검증 — AI fallback 시 wellness_templates 영속화 차단.
 *
 * @author CoreSolution
 * @since 2026-05-23
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("WellnessTemplateService — 트랙 A 핫픽스 DB 저장 가드")
class WellnessTemplateServiceTest {

    @Mock
    private WellnessTemplateRepository wellnessTemplateRepository;

    @Mock
    private OpenAIWellnessService openAIWellnessService;

    @InjectMocks
    private WellnessTemplateService service;

    @Test
    @DisplayName("AI fallback (isFallback=true) 일 때 wellness_templates 에 저장하지 않는다")
    void getTodayTemplate_fallback_doesNotPersist() {
        when(wellnessTemplateRepository.findUnusedTemplatesByConditions(
                any(), anyString(), any(LocalDateTime.class)))
                .thenReturn(Collections.emptyList());
        WellnessContent fallback = new WellnessContent("fallback 제목", "<p>fallback 본문</p>", true);
        when(openAIWellnessService.generateWellnessContent(eq(1), eq("SPRING"), eq("GENERAL"), eq("SYSTEM")))
                .thenReturn(fallback);

        WellnessTemplate result = service.getTodayTemplate(1, "SPRING");

        verify(wellnessTemplateRepository, never()).save(any(WellnessTemplate.class));
        assertNotNull(result, "발송 채널은 막지 않으므로 transient 엔티티는 반환되어야 함");
        assertEquals("fallback 제목", result.getTitle());
        assertFalse(Boolean.TRUE.equals(result.getIsActive()),
                "fallback transient 엔티티는 isActive=false 로 표시되어야 함");
    }

    @Test
    @DisplayName("AI 성공 (isFallback=false) 일 때 wellness_templates 에 1회 저장한다")
    void getTodayTemplate_aiSuccess_persistsOnce() {
        when(wellnessTemplateRepository.findUnusedTemplatesByConditions(
                any(), anyString(), any(LocalDateTime.class)))
                .thenReturn(Collections.emptyList());
        WellnessContent aiResult = new WellnessContent("AI 생성 제목", "<p>AI 본문</p>", false);
        when(openAIWellnessService.generateWellnessContent(eq(2), eq("SUMMER"), eq("GENERAL"), eq("SYSTEM")))
                .thenReturn(aiResult);
        when(wellnessTemplateRepository.save(any(WellnessTemplate.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        WellnessTemplate result = service.getTodayTemplate(2, "SUMMER");

        verify(wellnessTemplateRepository).save(any(WellnessTemplate.class));
        assertNotNull(result);
        assertEquals("AI 생성 제목", result.getTitle());
        assertTrue(Boolean.TRUE.equals(result.getIsActive()),
                "AI 성공 시 영속 엔티티는 isActive=true 여야 함");
    }
}
