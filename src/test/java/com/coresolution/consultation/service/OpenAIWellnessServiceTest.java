package com.coresolution.consultation.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

import java.util.HashSet;
import java.util.Set;
import com.coresolution.consultation.repository.OpenAIUsageLogRepository;
import com.coresolution.consultation.service.OpenAIWellnessService.WellnessContent;
import com.coresolution.consultation.service.ai.AiChatCompletionResult;
import com.coresolution.consultation.service.ai.AiChatCompletionService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

/**
 * 트랙 A 핫픽스 검증 — fallback 회전 풀 + isFallback 플래그.
 *
 * @author CoreSolution
 * @since 2026-05-23
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("OpenAIWellnessService — 트랙 A 핫픽스 fallback 회전")
class OpenAIWellnessServiceTest {

    @Mock
    private OpenAIUsageLogRepository usageLogRepository;

    @Mock
    private AiChatCompletionService aiChatCompletionService;

    @InjectMocks
    private OpenAIWellnessService service;

    private static AiChatCompletionResult failure(String reason) {
        return new AiChatCompletionResult(
                false, "", "gemini", "gemini", "unknown",
                0, 0, 0, reason);
    }

    @Test
    @DisplayName("AI 실패 시 fallback 결과의 isFallback=true 가 전파된다")
    void generateWellnessContent_fallback_isFallbackTrue() {
        when(aiChatCompletionService.completeChat(
                anyString(), anyString(), anyInt(), anyDouble(), anyBoolean()))
                .thenReturn(failure("no_openai_or_gemini_api_key"));

        WellnessContent content = service.generateWellnessContent(1, "SPRING", "GENERAL", "TEST");

        assertTrue(content.isFallback(),
                "AI 호출 실패 시 fallback 풀에서 선택된 컨텐츠는 isFallback=true 여야 함");
    }

    @Test
    @DisplayName("요일별 fallback 본문은 풀에서 회전되며 첫 7요일 중 최소 4종 이상이어야 한다")
    void generateWellnessContent_rotatesByDayOfWeek() {
        when(aiChatCompletionService.completeChat(
                anyString(), anyString(), anyInt(), anyDouble(), anyBoolean()))
                .thenReturn(failure("api_error"));

        Set<String> distinctTitles = new HashSet<>();
        for (int dayOfWeek = 1; dayOfWeek <= 7; dayOfWeek++) {
            WellnessContent content = service.generateWellnessContent(dayOfWeek, "SPRING", "GENERAL", "TEST");
            assertTrue(content.isFallback());
            distinctTitles.add(content.getTitle());
        }

        // 풀이 8종이므로 dayOfWeek 1~7 은 모두 서로 다른 인덱스 → 7종 distinct.
        assertEquals(7, distinctTitles.size(),
                "dayOfWeek 1~7 호출이 모두 다른 fallback 본문을 반환해야 회전 결함이 해소됨");
    }

    @Test
    @DisplayName("같은 요일이면 결정론적으로 같은 fallback 본문을 반환한다")
    void generateWellnessContent_sameDayOfWeek_returnsSameTitle() {
        when(aiChatCompletionService.completeChat(
                anyString(), anyString(), anyInt(), anyDouble(), anyBoolean()))
                .thenReturn(failure("api_error"));

        String firstCall = service.generateWellnessContent(3, "SPRING", "GENERAL", "TEST").getTitle();
        String secondCall = service.generateWellnessContent(3, "SPRING", "GENERAL", "TEST").getTitle();

        assertEquals(firstCall, secondCall,
                "동일 dayOfWeek 호출은 회전 인덱스가 결정론적이어야 함");
    }

    @Test
    @DisplayName("dayOfWeek=null 입력은 풀 내에서 random 선택되며 isFallback=true 유지")
    void generateWellnessContent_nullDayOfWeek_randomFallback() {
        when(aiChatCompletionService.completeChat(
                anyString(), anyString(), anyInt(), anyDouble(), anyBoolean()))
                .thenReturn(failure("api_error"));

        WellnessContent content = service.generateWellnessContent(null, null, "GENERAL", "TEST");

        assertTrue(content.isFallback());
        assertFalse(content.getTitle() == null || content.getTitle().isBlank(),
                "random 선택된 fallback 컨텐츠도 비어 있어선 안 됨");
    }

    @Test
    @DisplayName("WellnessContent(title, content) 기본 생성자는 isFallback=false 를 유지한다")
    void wellnessContent_defaultConstructor_isFallbackFalse() {
        WellnessContent normal = new WellnessContent("title", "content");

        assertFalse(normal.isFallback(),
                "정상 AI 결과 생성자의 isFallback 기본값은 false 여야 함 (호출자가 DB 저장 분기 가능)");
    }

    @Test
    @DisplayName("AI 응답이 success 이지만 본문 비어있으면 fallback 진입한다")
    void generateWellnessContent_emptyText_fallback() {
        AiChatCompletionResult emptyText = new AiChatCompletionResult(
                true, "", "gemini", "gemini", "gemini-1.5-flash",
                0, 0, 0, null);
        when(aiChatCompletionService.completeChat(
                anyString(), anyString(), anyInt(), anyDouble(), anyBoolean()))
                .thenReturn(emptyText);

        WellnessContent content = service.generateWellnessContent(2, "SPRING", "GENERAL", "TEST");

        assertTrue(content.isFallback(),
                "hasUsableText=false 인 응답도 fallback 회전 풀로 진입해야 함");
    }

    @Test
    @DisplayName("AI 본문이 JSON 형식 아니면 parseResponse 실패 후 fallback 진입한다")
    void generateWellnessContent_unparseableText_fallback() {
        AiChatCompletionResult garbage = new AiChatCompletionResult(
                true, "<<not valid json>>", "openai", "openai", "gpt-4o-mini",
                10, 5, 15, null);
        when(aiChatCompletionService.completeChat(
                anyString(), anyString(), anyInt(), anyDouble(), anyBoolean()))
                .thenReturn(garbage);

        WellnessContent content = service.generateWellnessContent(4, "SUMMER", "GENERAL", "TEST");

        assertTrue(content.isFallback(),
                "파싱 실패 catch 경로도 회전 fallback 으로 안내되어야 함");
    }

    @Test
    @DisplayName("AI 호출 자체에서 예외 발생 시에도 fallback 으로 안전 복귀")
    void generateWellnessContent_throws_fallback() {
        when(aiChatCompletionService.completeChat(
                anyString(), anyString(), anyInt(), anyDouble(), anyBoolean()))
                .thenThrow(new RuntimeException("network down"));

        WellnessContent content = service.generateWellnessContent(5, "SUMMER", "GENERAL", "TEST");

        assertTrue(content.isFallback());
        assertNotEquals("", content.getContent(),
                "예외 fallback 도 비어있지 않은 본문이어야 함");
    }
}
