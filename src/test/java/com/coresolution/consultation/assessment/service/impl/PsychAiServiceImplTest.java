package com.coresolution.consultation.assessment.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.util.List;
import com.coresolution.consultation.assessment.model.PsychAssessmentType;
import com.coresolution.consultation.assessment.service.PsychAiService.AiResult;
import com.coresolution.consultation.assessment.service.PsychAiService.MetricInput;
import com.coresolution.consultation.entity.AiUsageLog;
import com.coresolution.consultation.repository.AiUsageLogRepository;
import com.coresolution.consultation.service.ai.AiChatCompletionResult;
import com.coresolution.consultation.service.ai.AiChatCompletionService;
import com.coresolution.consultation.service.ai.dto.AiCompletionRequest;
import com.coresolution.consultation.service.ai.dto.AiResponseFormat;
import com.coresolution.consultation.service.ai.parser.AiJsonResponseParser;
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
 * 트랙 B PR-2 검증 — 심리검사 SSOT 경유 + 직접 Gemini 호출 제거.
 *
 * <p>기획서 §4 단계 3 (caller 마이그레이션 — psych 직접 Gemini 호출 제거).
 * 본 테스트는 {@link com.coresolution.consultation.assessment.service.impl.PsychAiServiceImpl}
 * 가 {@link AiChatCompletionService#completeChat(AiCompletionRequest)} 단일 진입점만 사용함을
 * 검증한다. 직접 Gemini/OpenAI HTTP 호출 메서드는 클래스에서 제거되어 컴파일 단계에서 보장된다.</p>
 *
 * @author CoreSolution
 * @since 2026-05-23
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("PsychAiServiceImpl — SSOT 단일 경유")
class PsychAiServiceImplTest {

    private static final String VALID_TCI_REPORT_JSON = """
            {
              "reportMarkdown": "## 요약\\n\\n간단한 요약입니다.\\n\\n## 검사 개요\\n\\n검사 목적은 기질·성격 파악입니다.\\n\\n## 기질·성격 프로필\\n\\nNS 백분위 45 수준 통합 서술.\\n\\n## 점수 해석\\n\\n점수 해석 한 단락.\\n\\n## 상담 시 고려\\n\\n면담 태도 한 단락.\\n\\n## 권고\\n\\n전문가 상담 권고.",
              "evidence": {
                "highlights": [
                  {"text":"NS 백분위가 보통 수준입니다.","basedOn":[{"scaleCode":"NS","percentile":45,"tScore":null}],"notes":"보통"}
                ],
                "quality": {"templateMatched": false, "needsReview": true}
              }
            }
            """;

    @Mock
    private AiChatCompletionService aiChatCompletionService;

    @Mock
    private AiJsonResponseParser jsonResponseParser;

    @Mock
    private AiUsageLogRepository usageLogRepository;

    @InjectMocks
    private PsychAiServiceImpl service;

    private static AiChatCompletionResult success(String text) {
        return new AiChatCompletionResult(
                true, text, "gemini", "gemini", "gemini-2.5-flash",
                500, 1200, 1700, null, false, null);
    }

    private static AiChatCompletionResult successWithParsedJson(String text) throws Exception {
        ObjectMapper m = new ObjectMapper();
        return new AiChatCompletionResult(
                true, text, "gemini", "gemini", "gemini-2.5-flash",
                500, 1200, 1700, null, false, m.readTree(text));
    }

    @Test
    @DisplayName("generateKoreanReport 는 SSOT 신 DTO 만 사용한다 (callerId=psych, responseFormat=JSON)")
    void generateKoreanReport_callsSsotWithNewDto() throws Exception {
        when(aiChatCompletionService.completeChat(any(AiCompletionRequest.class)))
                .thenReturn(successWithParsedJson(VALID_TCI_REPORT_JSON));

        List<MetricInput> metrics = List.of(
                new MetricInput("NS", "Novelty Seeking", 12.0, null, 45.0, "보통"));

        AiResult result = service.generateKoreanReport(PsychAssessmentType.TCI, metrics, "기본 마크다운");

        ArgumentCaptor<AiCompletionRequest> captor = ArgumentCaptor.forClass(AiCompletionRequest.class);
        org.mockito.Mockito.verify(aiChatCompletionService).completeChat(captor.capture());
        AiCompletionRequest captured = captor.getValue();

        assertEquals("psych", captured.getCallerId());
        assertEquals(AiResponseFormat.JSON, captured.getResponseFormat());
        assertEquals(4096, captured.getMaxTokens());
        assertEquals(0.3, captured.getTemperature());
        assertNotNull(captured.getTraceId());
        assertNotNull(captured.getTenantId(),
                "SSOT 진입점이 tenantId 필수 검증하므로 caller 가 반드시 채워야 함");
        assertNotNull(captured.getSystemPrompt());
        assertTrue(captured.getSystemPrompt().contains("TCI"),
                "TCI 시스템 프롬프트 헤딩(v3 designer) 가 보존되어야 함");
        assertNotNull(result);
        assertNotNull(result.reportMarkdown());
        assertTrue(result.reportMarkdown().contains("## 요약"));
    }

    @Test
    @DisplayName("metrics 가 비어있으면 SSOT 호출 없이 rule-only 결과를 반환한다")
    void generateKoreanReport_emptyMetrics_skipsAi() {
        AiResult result = service.generateKoreanReport(PsychAssessmentType.TCI, List.of(), "기본 마크다운");

        org.mockito.Mockito.verify(aiChatCompletionService, org.mockito.Mockito.never())
                .completeChat(any(AiCompletionRequest.class));
        assertEquals("rule-only", result.modelName());
        assertEquals("기본 마크다운", result.reportMarkdown());
    }

    @Test
    @DisplayName("AI 호출 실패 (no_openai_or_gemini_api_key) 시 disabled 결과를 반환한다")
    void generateKoreanReport_noKey_returnsDisabled() {
        AiChatCompletionResult failure = new AiChatCompletionResult(
                false, "", "openai", "", "unknown",
                0, 0, 0, "no_openai_or_gemini_api_key", false, null);
        when(aiChatCompletionService.completeChat(any(AiCompletionRequest.class)))
                .thenReturn(failure);

        List<MetricInput> metrics = List.of(
                new MetricInput("NS", "Novelty Seeking", 12.0, null, 45.0, "보통"));

        AiResult result = service.generateKoreanReport(PsychAssessmentType.TCI, metrics, "기본 마크다운");

        assertEquals("disabled", result.modelName());
        assertTrue(result.evidenceJson().contains("disabled"),
                "API key 미설정 시 evidence 에 disabled 상태 명시");
    }

    @Test
    @DisplayName("SSOT 가 success=false (일반 오류) 반환 시 failed evidence 를 채운다")
    void generateKoreanReport_genericFailure_returnsFailedEvidence() {
        AiChatCompletionResult failure = new AiChatCompletionResult(
                false, "", "openai", "openai", "gpt-4o-mini",
                0, 0, 0, "rate_limited", false, null);
        when(aiChatCompletionService.completeChat(any(AiCompletionRequest.class)))
                .thenReturn(failure);

        List<MetricInput> metrics = List.of(
                new MetricInput("NS", "Novelty Seeking", 12.0, null, 45.0, "보통"));

        AiResult result = service.generateKoreanReport(PsychAssessmentType.TCI, metrics, "기본 마크다운");

        assertTrue(result.evidenceJson().contains("\"reason\":\"rate_limited\""),
                "에러 사유가 evidence reason 으로 전파되어야 함");
        assertEquals("gpt-4o-mini", result.modelName());
    }

    @Test
    @DisplayName("N3 — 성공 시 ai_provider/prompt/response 가 AiUsageLog 에 저장된다 (V20260529_001)")
    void generateKoreanReport_success_persistsProviderPromptResponse() throws Exception {
        when(aiChatCompletionService.completeChat(any(AiCompletionRequest.class)))
                .thenReturn(successWithParsedJson(VALID_TCI_REPORT_JSON));

        List<MetricInput> metrics = List.of(
                new MetricInput("NS", "Novelty Seeking", 12.0, null, 45.0, "보통"));

        service.generateKoreanReport(PsychAssessmentType.TCI, metrics, "기본 마크다운");

        ArgumentCaptor<AiUsageLog> captor = ArgumentCaptor.forClass(AiUsageLog.class);
        org.mockito.Mockito.verify(usageLogRepository).save(captor.capture());
        AiUsageLog saved = captor.getValue();
        assertEquals("GEMINI", saved.getAiProvider(),
                "effectiveProvider=gemini → 대문자 GEMINI 저장 (N3 default 'OPENAI' 회귀 차단)");
        assertEquals("gemini-2.5-flash", saved.getModel());
        assertTrue(Boolean.TRUE.equals(saved.getIsSuccess()));
        assertNotNull(saved.getPrompt(), "system + user 결합 본문이 prompt 컬럼에 저장되어야 함");
        assertTrue(saved.getPrompt().contains("[system]"));
        assertTrue(saved.getPrompt().contains("[user]"));
        assertNotNull(saved.getResponse(), "성공 시 응답 본문이 response 컬럼에 저장되어야 함");
        assertTrue(saved.getResponse().contains("reportMarkdown"));
    }

    @Test
    @DisplayName("N3 — 실패 시 ai_provider 는 저장되고 response 는 null (V20260529_001)")
    void generateKoreanReport_failure_persistsProviderWithNullResponse() {
        AiChatCompletionResult failure = new AiChatCompletionResult(
                false, "", "openai", "openai", "gpt-4o-mini",
                0, 0, 0, "rate_limited", false, null);
        when(aiChatCompletionService.completeChat(any(AiCompletionRequest.class)))
                .thenReturn(failure);

        List<MetricInput> metrics = List.of(
                new MetricInput("NS", "Novelty Seeking", 12.0, null, 45.0, "보통"));

        service.generateKoreanReport(PsychAssessmentType.TCI, metrics, "기본 마크다운");

        ArgumentCaptor<AiUsageLog> captor = ArgumentCaptor.forClass(AiUsageLog.class);
        org.mockito.Mockito.verify(usageLogRepository).save(captor.capture());
        AiUsageLog saved = captor.getValue();
        assertEquals("OPENAI", saved.getAiProvider(),
                "effectiveProvider=openai 라벨 정규화 (N3 — 실패 케이스도 caller-set 값 보장)");
        assertTrue(Boolean.FALSE.equals(saved.getIsSuccess()));
        assertNotNull(saved.getPrompt(),
                "실패해도 prompt 본문은 저장 (디버깅 컨텍스트 보존)");
        assertNull(saved.getResponse(),
                "실패 시 response 는 null (성공 시에만 raw text 저장)");
    }
}
