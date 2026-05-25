package com.coresolution.consultation.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.HashSet;
import java.util.Optional;
import java.util.Set;
import com.coresolution.consultation.entity.AiUsageLog;
import com.coresolution.consultation.repository.AiUsageLogRepository;
import com.coresolution.consultation.service.WellnessAiService.WellnessContent;
import com.coresolution.consultation.service.ai.AiChatCompletionResult;
import com.coresolution.consultation.service.ai.AiChatCompletionService;
import com.coresolution.consultation.service.ai.dto.AiCompletionRequest;
import com.coresolution.consultation.service.ai.dto.AiResponseFormat;
import com.coresolution.consultation.service.ai.parser.AiJsonResponseParser;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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
 * 트랙 B PR-2 검증 — SSOT 단일 진입점 (AiCompletionRequest) 경유 + 트랙 A 회전 fallback 보존.
 *
 * <p>기획서 §4 단계 3 (caller 마이그레이션) + §7 Q5 (리네임). 본 테스트는 기존
 * {@code OpenAIWellnessServiceTest} 의 트랙 A 회전 풀 검증 시나리오를 모두 보존하면서
 * 신 DTO 시그니처 (callerId/responseFormat/traceId) 와 파서 위임을 추가 검증한다.</p>
 *
 * <p>B3 핫픽스 (2026-05-25) — 디자이너 핸드오프
 * ({@code docs/project-management/2026-05-25/WELLNESS_ROTATION_POOL_8_COPY_HANDOFF.md} §3)
 * 동기화 검증을 추가한다. FALLBACK_POOL 8종이 모두 unique 본문 (단, title 은 핸드오프 일관성을
 * 위해 동일 "오늘의 마음 건강 팁") 인지, dayOfWeek 매핑이 핸드오프와 일치 (index = dayOfWeek,
 * 0=default · 1=월 · 7=일) 하는지를 검증한다.</p>
 *
 * @author CoreSolution
 * @since 2026-05-23
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("WellnessAiService — SSOT 신 DTO + 트랙 A 회전 fallback")
class WellnessAiServiceTest {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Mock
    private AiUsageLogRepository usageLogRepository;

    @Mock
    private AiChatCompletionService aiChatCompletionService;

    @Mock
    private AiJsonResponseParser jsonResponseParser;

    @InjectMocks
    private WellnessAiService service;

    private static AiChatCompletionResult failure(String reason) {
        return new AiChatCompletionResult(
                false, "", "openai", "openai", "unknown",
                0, 0, 0, reason, false, null);
    }

    private static AiChatCompletionResult successWithJsonNode(String title, String content, JsonNode parsedJson) {
        String text = String.format("{\"title\":\"%s\",\"content\":\"%s\"}", title, content);
        return new AiChatCompletionResult(
                true, text, "openai", "openai", "gpt-4o-mini",
                100, 50, 150, null, false, parsedJson);
    }

    private static JsonNode parsedJsonOf(String title, String content) {
        try {
            return MAPPER.readTree(String.format("{\"title\":\"%s\",\"content\":\"%s\"}", title, content));
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    @Test
    @DisplayName("AI 호출 시 신 DTO 가 전달된다 (callerId=wellness, responseFormat=JSON, traceId 채움)")
    void generateWellnessContent_passesNewDtoToSsot() {
        when(aiChatCompletionService.completeChat(any(AiCompletionRequest.class)))
                .thenReturn(successWithJsonNode("정상 제목", "<p>정상 본문</p>", parsedJsonOf("정상 제목", "<p>정상 본문</p>")));

        service.generateWellnessContent(1, "SPRING", "GENERAL", "TEST");

        ArgumentCaptor<AiCompletionRequest> captor = ArgumentCaptor.forClass(AiCompletionRequest.class);
        verify(aiChatCompletionService).completeChat(captor.capture());
        AiCompletionRequest captured = captor.getValue();
        assertEquals("wellness", captured.getCallerId());
        assertEquals(AiResponseFormat.JSON, captured.getResponseFormat());
        assertEquals(800, captured.getMaxTokens());
        assertEquals(0.7, captured.getTemperature());
        assertNotNull(captured.getTraceId(), "traceId 는 caller 가 생성하여 SSOT 에 전파해야 함");
        assertNotNull(captured.getTenantId(), "tenantId 는 SSOT 진입점이 필수로 검증");
    }

    @Test
    @DisplayName("AI 실패 시 fallback 결과의 isFallback=true 가 전파된다 (트랙 A 보존)")
    void generateWellnessContent_fallback_isFallbackTrue() {
        when(aiChatCompletionService.completeChat(any(AiCompletionRequest.class)))
                .thenReturn(failure("no_openai_or_gemini_api_key"));

        WellnessContent content = service.generateWellnessContent(1, "SPRING", "GENERAL", "TEST");

        assertTrue(content.isFallback(),
                "AI 호출 실패 시 fallback 풀에서 선택된 컨텐츠는 isFallback=true 여야 함");
    }

    @Test
    @DisplayName("요일별 fallback 본문은 풀에서 회전된다 (1~7 본문 distinct, B3 핫픽스)")
    void generateWellnessContent_rotatesByDayOfWeek() {
        when(aiChatCompletionService.completeChat(any(AiCompletionRequest.class)))
                .thenReturn(failure("api_error"));

        Set<String> distinctContents = new HashSet<>();
        for (int dayOfWeek = 1; dayOfWeek <= 7; dayOfWeek++) {
            WellnessContent content = service.generateWellnessContent(dayOfWeek, "SPRING", "GENERAL", "TEST");
            assertTrue(content.isFallback());
            distinctContents.add(content.getContent());
        }

        assertEquals(7, distinctContents.size(),
                "dayOfWeek 1~7 호출이 모두 다른 fallback 본문을 반환해야 회전 결함이 해소됨"
                        + " (B3 핸드오프 §3 — title 은 동일 '오늘의 마음 건강 팁' 이지만 body 가 unique)");
    }

    @Test
    @DisplayName("같은 요일이면 결정론적으로 같은 fallback 본문을 반환한다 (트랙 A 보존)")
    void generateWellnessContent_sameDayOfWeek_returnsSameContent() {
        when(aiChatCompletionService.completeChat(any(AiCompletionRequest.class)))
                .thenReturn(failure("api_error"));

        String firstCall = service.generateWellnessContent(3, "SPRING", "GENERAL", "TEST").getContent();
        String secondCall = service.generateWellnessContent(3, "SPRING", "GENERAL", "TEST").getContent();

        assertEquals(firstCall, secondCall,
                "동일 dayOfWeek 호출은 회전 인덱스가 결정론적이어야 함");
    }

    @Test
    @DisplayName("dayOfWeek=null 또는 범위 밖 입력은 default(index 0) 본문을 반환한다 (B3 핫픽스)")
    void generateWellnessContent_nullOrOutOfRangeDayOfWeek_returnsDefault() {
        when(aiChatCompletionService.completeChat(any(AiCompletionRequest.class)))
                .thenReturn(failure("api_error"));

        WellnessContent nullCase = service.generateWellnessContent(null, null, "GENERAL", "TEST");
        WellnessContent negativeCase = service.generateWellnessContent(-1, "SPRING", "GENERAL", "TEST");
        WellnessContent overflowCase = service.generateWellnessContent(8, "SPRING", "GENERAL", "TEST");
        WellnessContent zeroCase = service.generateWellnessContent(0, "SPRING", "GENERAL", "TEST");

        assertTrue(nullCase.isFallback());
        assertTrue(negativeCase.isFallback());
        assertTrue(overflowCase.isFallback());
        assertTrue(zeroCase.isFallback());

        assertEquals(zeroCase.getContent(), nullCase.getContent(),
                "null 입력은 default index 0 (호흡과 휴식) 으로 매핑되어야 함");
        assertEquals(zeroCase.getContent(), negativeCase.getContent(),
                "음수 입력은 default index 0 으로 fallback 되어야 함");
        assertEquals(zeroCase.getContent(), overflowCase.getContent(),
                "8 이상 입력은 default index 0 으로 fallback 되어야 함");
    }

    @Test
    @DisplayName("회전 풀은 8종이며 각 본문은 디자이너 핸드오프 §3 의 unique 본문이다 (B3 핫픽스)")
    void fallbackPool_has8DistinctContents() {
        when(aiChatCompletionService.completeChat(any(AiCompletionRequest.class)))
                .thenReturn(failure("api_error"));

        Set<String> distinctContents = new HashSet<>();
        for (int dayOfWeek = 0; dayOfWeek <= 7; dayOfWeek++) {
            WellnessContent content = service.generateWellnessContent(dayOfWeek, "SPRING", "GENERAL", "TEST");
            distinctContents.add(content.getContent());
        }

        assertEquals(8, distinctContents.size(),
                "dayOfWeek 0~7 매핑이 모두 다른 본문을 반환해야 풀 크기 8 이 무력화되지 않음");
    }

    @Test
    @DisplayName("dayOfWeek=7 (일요일) 은 풀 마지막 슬롯 (명상과 고요 🌙) 으로 매핑된다 (B3 핫픽스)")
    void generateWellnessContent_sunday_mapsToMeditation() {
        when(aiChatCompletionService.completeChat(any(AiCompletionRequest.class)))
                .thenReturn(failure("api_error"));

        WellnessContent sunday = service.generateWellnessContent(7, "SPRING", "GENERAL", "TEST");

        assertTrue(sunday.isFallback());
        assertTrue(sunday.getContent().contains("\uD83C\uDF19"),
                "일요일(7) 은 핸드오프 §3 index 7 (명상과 고요 🌙) 본문을 반환해야 함");
        assertTrue(sunday.getContent().contains("고요"),
                "일요일 fallback 본문은 '고요' 테마를 포함해야 함");
    }

    @Test
    @DisplayName("dayOfWeek=1 (월요일) 은 풀 index 1 (시작목표 ☀️) 으로 매핑된다 (B3 핫픽스)")
    void generateWellnessContent_monday_mapsToStartGoal() {
        when(aiChatCompletionService.completeChat(any(AiCompletionRequest.class)))
                .thenReturn(failure("api_error"));

        WellnessContent monday = service.generateWellnessContent(1, "SPRING", "GENERAL", "TEST");

        assertTrue(monday.isFallback());
        assertTrue(monday.getContent().contains("\u2600\uFE0F"),
                "월요일(1) 은 핸드오프 §3 index 1 (시작목표 ☀️) 본문을 반환해야 함");
        assertTrue(monday.getContent().contains("새로운 한 주"),
                "월요일 fallback 본문은 '새로운 한 주' 테마를 포함해야 함");
    }

    @Test
    @DisplayName("WellnessContent(title, content) 기본 생성자는 isFallback=false 를 유지한다 (트랙 A 보존)")
    void wellnessContent_defaultConstructor_isFallbackFalse() {
        WellnessContent normal = new WellnessContent("title", "content");

        assertFalse(normal.isFallback(),
                "정상 AI 결과 생성자의 isFallback 기본값은 false 여야 함");
    }

    @Test
    @DisplayName("SSOT parsedJson 이 채워진 경우 별도 파서 호출 없이 그대로 사용한다")
    void generateWellnessContent_usesParsedJsonFromSsot() {
        JsonNode preParsed = parsedJsonOf("ssot-parsed-title", "<p>ssot 본문</p>");
        when(aiChatCompletionService.completeChat(any(AiCompletionRequest.class)))
                .thenReturn(successWithJsonNode("ssot-parsed-title", "<p>ssot 본문</p>", preParsed));

        WellnessContent content = service.generateWellnessContent(2, "SUMMER", "GENERAL", "TEST");

        assertFalse(content.isFallback(), "SSOT 파싱 성공 시 fallback 풀 사용 금지");
        assertEquals("ssot-parsed-title", content.getTitle());
        verify(jsonResponseParser, never()).parseJson(any());
    }

    @Test
    @DisplayName("SSOT parsedJson=null 인 경우 공통 파서로 재시도한다")
    void generateWellnessContent_fallsBackToParser_whenParsedJsonNull() {
        AiChatCompletionResult raw = new AiChatCompletionResult(
                true, "{\"title\":\"retry-title\",\"content\":\"<p>retry 본문</p>\"}",
                "openai", "openai", "gpt-4o-mini",
                10, 5, 15, null, false, null);
        when(aiChatCompletionService.completeChat(any(AiCompletionRequest.class)))
                .thenReturn(raw);
        when(jsonResponseParser.parseJson(any()))
                .thenReturn(Optional.of(parsedJsonOf("retry-title", "<p>retry 본문</p>")));

        WellnessContent content = service.generateWellnessContent(4, "SUMMER", "GENERAL", "TEST");

        assertFalse(content.isFallback());
        assertEquals("retry-title", content.getTitle());
        verify(jsonResponseParser, times(1)).parseJson(any());
    }

    @Test
    @DisplayName("AI 응답이 success 이지만 본문 비어있으면 fallback 진입한다 (트랙 A 보존)")
    void generateWellnessContent_emptyText_fallback() {
        AiChatCompletionResult emptyText = new AiChatCompletionResult(
                true, "", "gemini", "gemini", "gemini-1.5-flash",
                0, 0, 0, null, false, null);
        when(aiChatCompletionService.completeChat(any(AiCompletionRequest.class)))
                .thenReturn(emptyText);

        WellnessContent content = service.generateWellnessContent(2, "SPRING", "GENERAL", "TEST");

        assertTrue(content.isFallback(),
                "hasUsableText=false 인 응답도 fallback 회전 풀로 진입해야 함");
    }

    @Test
    @DisplayName("AI 본문이 JSON 형식 아니면 파싱 실패 후 fallback 진입한다 (트랙 A 보존)")
    void generateWellnessContent_unparseableText_fallback() {
        AiChatCompletionResult garbage = new AiChatCompletionResult(
                true, "<<not valid json>>", "openai", "openai", "gpt-4o-mini",
                10, 5, 15, null, false, null);
        when(aiChatCompletionService.completeChat(any(AiCompletionRequest.class)))
                .thenReturn(garbage);
        when(jsonResponseParser.parseJson(any())).thenReturn(Optional.empty());

        WellnessContent content = service.generateWellnessContent(4, "SUMMER", "GENERAL", "TEST");

        assertTrue(content.isFallback(),
                "파싱 실패 catch 경로도 회전 fallback 으로 안내되어야 함");
    }

    @Test
    @DisplayName("AI 호출 자체에서 예외 발생 시에도 fallback 으로 안전 복귀한다 (트랙 A 보존)")
    void generateWellnessContent_throws_fallback() {
        when(aiChatCompletionService.completeChat(any(AiCompletionRequest.class)))
                .thenThrow(new RuntimeException("network down"));

        WellnessContent content = service.generateWellnessContent(5, "SUMMER", "GENERAL", "TEST");

        assertTrue(content.isFallback());
        assertNotEquals("", content.getContent(),
                "예외 fallback 도 비어있지 않은 본문이어야 함");
    }

    @Test
    @DisplayName("N3 — 성공 시 ai_provider/prompt/response 가 AiUsageLog 에 저장된다 (V20260529_001)")
    void generateWellnessContent_success_persistsProviderPromptResponse() {
        AiChatCompletionResult geminiSuccess = new AiChatCompletionResult(
                true, "{\"title\":\"t\",\"content\":\"<p>c</p>\"}",
                "gemini", "gemini", "gemini-3.1-flash-lite",
                100, 50, 150, null, false, parsedJsonOf("t", "<p>c</p>"));
        when(aiChatCompletionService.completeChat(any(AiCompletionRequest.class)))
                .thenReturn(geminiSuccess);

        service.generateWellnessContent(1, "SPRING", "GENERAL", "scheduler");

        ArgumentCaptor<AiUsageLog> captor = ArgumentCaptor.forClass(AiUsageLog.class);
        verify(usageLogRepository).save(captor.capture());
        AiUsageLog saved = captor.getValue();
        assertEquals("GEMINI", saved.getAiProvider(),
                "N3 — effectiveProvider=gemini → 대문자 GEMINI 저장 (default 'OPENAI' 회귀 차단)");
        assertEquals("gemini-3.1-flash-lite", saved.getModel());
        assertTrue(Boolean.TRUE.equals(saved.getIsSuccess()));
        assertNotNull(saved.getPrompt(), "system + user 결합 본문이 prompt 컬럼에 저장되어야 함");
        assertTrue(saved.getPrompt().contains("[system]"));
        assertTrue(saved.getPrompt().contains("[user]"));
        assertNotNull(saved.getResponse(), "성공 시 응답 본문이 response 컬럼에 저장되어야 함");
        assertTrue(saved.getResponse().contains("title"));
    }

    @Test
    @DisplayName("N3 — 실패 시 ai_provider 는 저장되고 response 는 null (V20260529_001)")
    void generateWellnessContent_failure_persistsProviderWithNullResponse() {
        when(aiChatCompletionService.completeChat(any(AiCompletionRequest.class)))
                .thenReturn(failure("rate_limited"));

        service.generateWellnessContent(2, "SPRING", "GENERAL", "scheduler");

        ArgumentCaptor<AiUsageLog> captor = ArgumentCaptor.forClass(AiUsageLog.class);
        verify(usageLogRepository).save(captor.capture());
        AiUsageLog saved = captor.getValue();
        assertEquals("OPENAI", saved.getAiProvider(),
                "실패 케이스도 effectiveProvider 가 정규화되어 저장되어야 함");
        assertTrue(Boolean.FALSE.equals(saved.getIsSuccess()));
        assertNotNull(saved.getPrompt(),
                "실패해도 prompt 본문은 저장 (디버깅 컨텍스트 보존)");
        assertEquals(null, saved.getResponse(),
                "실패 시 response 는 null");
    }
}
