package com.coresolution.consultation.assessment.service.impl;

import com.coresolution.consultation.assessment.model.PsychAssessmentType;
import com.coresolution.consultation.assessment.service.PsychAiService;
import com.coresolution.consultation.entity.AiUsageLog;
import com.coresolution.consultation.repository.AiUsageLogRepository;
import com.coresolution.consultation.service.ai.AiChatCompletionResult;
import com.coresolution.consultation.service.ai.AiChatCompletionService;
import com.coresolution.consultation.service.ai.dto.AiCompletionRequest;
import com.coresolution.consultation.service.ai.dto.AiResponseFormat;
import com.coresolution.consultation.service.ai.parser.AiJsonResponseParser;
import com.coresolution.core.context.TenantContextHolder;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * 심리검사(TCI/MMPI) 전용 LLM 서비스 — SSOT 단일 진입점 경유.
 *
 * <p>트랙 B PR-2 리네임 + 마이그레이션 (기획서 §4 단계 3·4, §7 Q5=a):</p>
 * <ul>
 *   <li>provider-prefix 제거: {@code OpenAIPsychAiServiceImpl} → {@code PsychAiServiceImpl}</li>
 *   <li>직접 Gemini / OpenAI HTTP 호출 ({@code callGeminiApi}, {@code callGeminiApiWithFallback},
 *       {@code callOpenAiWithFallback}, {@code callOpenAiFormatApi}) 제거</li>
 *   <li>{@link AiChatCompletionService#completeChat(AiCompletionRequest)} 단일 경유로 전환</li>
 *   <li>모델 fallback / Gemini URL 보정 등은 SSOT 본체 ({@code AiChatCompletionServiceImpl}) 가 담당</li>
 *   <li>JSON 추출은 공통 파서 {@link AiJsonResponseParser} 결과
 *       ({@link AiChatCompletionResult#parsedJson()}) 우선 활용 + 기존 brace-balanced 추출 보완</li>
 * </ul>
 *
 * <p>입력은 추출된 지표 중심, 출력은 한국어 마크다운 + evidence(JSON) 고정.
 * TCI/MMPI 시스템 프롬프트 (디자이너 헤딩 v3) 와 응답 검증 로직은 보존한다.</p>
 *
 * @author CoreSolution
 * @since 2026-05-08
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PsychAiServiceImpl implements PsychAiService {

    private static final String PROMPT_VERSION = "psych-prompt-v3-designer-headings-20260508";
    private static final int MAX_TOKENS = 4096;
    private static final double TEMPERATURE = 0.3;
    private static final int MIN_EVIDENCE_HIGHLIGHTS = 1;

    /**
     * caller 라벨 — SSOT 사용 로그 / 메트릭 분류용.
     */
    private static final String CALLER_ID = "psych";

    /**
     * ai_usage_logs.request_type 라벨 (N3 보강 — 2026-05-25). PR-2 에서 PsychAiServiceImpl 은
     * usage log 적재가 누락되어 있었다. V20260529_001 와 함께 추가.
     */
    private static final String USAGE_REQUEST_TYPE = "PSYCH_REPORT";

    /** provider 라벨 fallback (effectiveProvider 가 비어있을 때 사용). */
    private static final String PROVIDER_UNKNOWN = "UNKNOWN";

    /**
     * 시스템 컨텍스트(스케줄러·배치)에서 {@link TenantContextHolder} 가 비어 있을 때의 안전 fallback.
     * 심리검사는 일반적으로 세션 컨텍스트에서 호출되므로 거의 사용되지 않는다.
     */
    private static final String SYSTEM_TENANT_FALLBACK = "SYSTEM";

    // “확정 진단/법적 결론” 방지(오판 리스크 방어): 발견 시 폴백 + 사람 검수 필요 처리
    private static final List<Pattern> FORBIDDEN_PATTERNS = List.of(
            Pattern.compile("확정\\s*진단", Pattern.CASE_INSENSITIVE),
            Pattern.compile("진단\\s*확정", Pattern.CASE_INSENSITIVE),
            Pattern.compile("법적\\s*결론", Pattern.CASE_INSENSITIVE),
            Pattern.compile("반드시\\s*.*장애", Pattern.CASE_INSENSITIVE),
            Pattern.compile("정신병", Pattern.CASE_INSENSITIVE),
            Pattern.compile("정신\\s*질환\\s*확정", Pattern.CASE_INSENSITIVE)
    );

    private final AiChatCompletionService aiChatCompletionService;
    private final AiJsonResponseParser jsonResponseParser;
    private final AiUsageLogRepository usageLogRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public AiResult generateKoreanReport(PsychAssessmentType assessmentType, List<MetricInput> metrics, String baseMarkdown) {
        String tenantId = resolveTenantId();

        if (metrics == null || metrics.isEmpty()) {
            return new AiResult(
                    baseMarkdown,
                    buildEvidenceJson("skipped", "no_metrics", true),
                    "rule-only",
                    PROMPT_VERSION);
        }

        long startTime = System.currentTimeMillis();
        String systemPrompt = buildSystemPrompt(assessmentType);
        String userPrompt = buildUserPrompt(assessmentType, metrics, baseMarkdown);
        String combinedPrompt = buildCombinedPromptForLog(systemPrompt, userPrompt);

        try {
            log.info("Psych AI report generation start: tenantId={}, type={}, metricsCount={}",
                    tenantId, assessmentType, metrics.size());

            AiCompletionRequest request = AiCompletionRequest.builder()
                    .systemPrompt(systemPrompt)
                    .userPrompt(userPrompt)
                    .maxTokens(MAX_TOKENS)
                    .temperature(TEMPERATURE)
                    .responseFormat(AiResponseFormat.JSON)
                    .tenantId(tenantId)
                    .callerId(CALLER_ID)
                    .traceId(UUID.randomUUID().toString())
                    .build();

            AiChatCompletionResult result = aiChatCompletionService.completeChat(request);
            long responseTime = System.currentTimeMillis() - startTime;
            String model = StringUtils.hasText(result.model()) ? result.model() : "unknown";
            String providerForLog = resolveProviderLabel(result);

            if (!result.success()) {
                String reason = result.errorMessage() != null ? result.errorMessage() : "ai_call_failed";
                log.warn("Psych AI call failed: tenantId={}, requestedProvider={}, effectiveProvider={}, model={}, reason={}",
                        tenantId, result.requestedProvider(), result.effectiveProvider(), model, reason);
                logUsage(tenantId, providerForLog, model, false, reason, 0, 0, 0,
                        responseTime, combinedPrompt, null);
                if ("no_openai_or_gemini_api_key".equals(reason)) {
                    return new AiResult(baseMarkdown,
                            "{\"ai\":\"disabled\",\"reason\":\"AI_API_KEY 미설정\"}",
                            "disabled", PROMPT_VERSION);
                }
                return new AiResult(baseMarkdown,
                        buildEvidenceJson("failed", truncate(reason, 400), true),
                        model, PROMPT_VERSION);
            }

            String content = result.text() != null ? result.text() : "";
            if (!StringUtils.hasText(content)) {
                log.warn("Psych AI empty response: requestedProvider={}, effectiveProvider={}, model={}",
                        result.requestedProvider(), result.effectiveProvider(), model);
                logUsage(tenantId, providerForLog, model, false, "empty_response", 0, 0, 0,
                        responseTime, combinedPrompt, null);
                return new AiResult(baseMarkdown, "{\"ai\":\"failed\",\"reason\":\"empty_response\"}",
                        model, PROMPT_VERSION);
            }

            log.info("Psych AI report success: requestedProvider={}, effectiveProvider={}, model={}, isFallback={}, responseLen={}",
                    result.requestedProvider(), result.effectiveProvider(), model, result.isFallback(), content.length());

            logUsage(tenantId, providerForLog, model, true, null,
                    result.promptTokens(), result.completionTokens(), result.totalTokens(),
                    responseTime, combinedPrompt, content);

            return parseAndValidateAiOutput(result, baseMarkdown, model, metrics, assessmentType);

        } catch (Exception e) {
            long responseTime = System.currentTimeMillis() - startTime;
            log.error("Psych AI report generation failed: tenantId={}, type={}, error={}",
                    tenantId, assessmentType, e.getMessage(), e);
            String reason = e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName();
            logUsage(tenantId, PROVIDER_UNKNOWN, "unknown", false, truncate(reason, 400),
                    0, 0, 0, responseTime, combinedPrompt, null);
            return new AiResult(baseMarkdown,
                    buildEvidenceJson("failed", truncate(reason, 400), true),
                    "unknown", PROMPT_VERSION);
        }
    }

    /**
     * SSOT 결과의 effectiveProvider 를 대문자 라벨로 정규화 (N3 — 2026-05-25).
     */
    private static String resolveProviderLabel(AiChatCompletionResult result) {
        String effective = result != null ? result.effectiveProvider() : null;
        if (StringUtils.hasText(effective)) {
            return effective.trim().toUpperCase(Locale.ROOT);
        }
        String requested = result != null ? result.requestedProvider() : null;
        if (StringUtils.hasText(requested)) {
            return requested.trim().toUpperCase(Locale.ROOT);
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

    /**
     * AI 사용 로그 저장 (N3 보강 — PsychAiServiceImpl 누락분 추가, V20260529_001).
     */
    private void logUsage(String tenantId, String aiProvider, String model,
                          boolean isSuccess, String errorMessage,
                          int promptTokens, int completionTokens, int totalTokens,
                          long responseTimeMs, String promptBody, String responseBody) {
        try {
            if (!StringUtils.hasText(tenantId)) {
                log.warn("⚠️ Psych AI 사용 로그 스킵 — tenantId 누락 (model={})", model);
                return;
            }
            AiUsageLog usageLogRow = AiUsageLog.builder()
                    .tenantId(tenantId.trim())
                    .aiProvider(aiProvider)
                    .requestType(USAGE_REQUEST_TYPE)
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
            usageLogRow.calculateCost();
            usageLogRepository.save(usageLogRow);
        } catch (Exception e) {
            log.error("❌ Psych AI 사용 로그 저장 실패", e);
        }
    }

    /**
     * 현재 테넌트 ID 해석 — 비어 있으면 {@link #SYSTEM_TENANT_FALLBACK}.
     *
     * <p>{@link AiChatCompletionService#completeChat(AiCompletionRequest)} 는 tenantId 가 빈 값이면
     * 즉시 {@link IllegalArgumentException} 을 던지므로 null 전파를 차단해야 한다.</p>
     */
    private String resolveTenantId() {
        String tenantId = TenantContextHolder.getTenantId();
        return StringUtils.hasText(tenantId) ? tenantId : SYSTEM_TENANT_FALLBACK;
    }

    /**
     * AI 응답에서 JSON 객체 추출 — 공통 파서 우선, 실패 시 brace-balanced 보완.
     *
     * <p>SSOT 가 {@link AiResponseFormat#JSON} 요청 시 {@link AiChatCompletionResult#parsedJson()}
     * 을 채워주지만, GPT가 설명문 + ```json ... ``` 형태로 반환하면 공통 파서가 표면 객체만 잡고
     * 끝낼 수 있다. 본 메서드는 (1) parsedJson 이 있으면 그대로 사용, (2) 없으면 raw text 에서
     * 문자열 내부 brace 를 제외한 짝 맞는 객체를 직접 추출해 reportMarkdown 내부 '}' 로 잘리는 문제를
     * 방지한다.</p>
     */
    private String extractJsonFromContent(AiChatCompletionResult result) {
        JsonNode parsed = result.parsedJson();
        if (parsed != null && parsed.isObject()) {
            return parsed.toString();
        }
        String content = result.text();
        if (content == null) {
            return "";
        }
        // 1) 공통 파서 한 번 더 시도 (코드펜스 제거 + greedy)
        JsonNode retry = jsonResponseParser.parseJson(content).orElse(null);
        if (retry != null && retry.isObject()) {
            return retry.toString();
        }
        // 2) reportMarkdown 안의 '}' 보호용 brace-balanced 추출 (기존 로직 유지)
        return extractJsonByBraceBalance(content);
    }

    private String extractJsonByBraceBalance(String content) {
        String trimmed = content.trim();
        int jsonStart = trimmed.indexOf("```json");
        if (jsonStart >= 0) {
            trimmed = trimmed.substring(jsonStart + 7);
        } else {
            int codeStart = trimmed.indexOf("```");
            if (codeStart >= 0) {
                trimmed = trimmed.substring(codeStart + 3);
            }
        }
        int codeEnd = trimmed.indexOf("```");
        if (codeEnd >= 0) {
            trimmed = trimmed.substring(0, codeEnd);
        }
        trimmed = trimmed.trim();
        int braceStart = trimmed.indexOf('{');
        if (braceStart < 0) {
            return "";
        }
        int depth = 0;
        boolean inString = false;
        boolean escapeNext = false;
        int end = -1;
        for (int i = braceStart; i < trimmed.length(); i++) {
            char c = trimmed.charAt(i);
            if (escapeNext) {
                escapeNext = false;
                continue;
            }
            if (inString) {
                if (c == '\\') {
                    escapeNext = true;
                } else if (c == '"') {
                    inString = false;
                }
                continue;
            }
            if (c == '"') {
                inString = true;
                continue;
            }
            if (c == '{') {
                depth++;
                continue;
            }
            if (c == '}') {
                depth--;
                if (depth == 0) {
                    end = i + 1;
                    break;
                }
            }
        }
        if (end > braceStart) {
            trimmed = trimmed.substring(braceStart, end);
        }
        return trimmed;
    }

    private AiResult parseAndValidateAiOutput(AiChatCompletionResult result, String baseMarkdown, String model,
            List<MetricInput> metrics, PsychAssessmentType assessmentType) {
        String trimmed = extractJsonFromContent(result);
        if (!StringUtils.hasText(trimmed)) {
            String contentLen = result.text() != null ? String.valueOf(result.text().length()) : "0";
            log.warn("Psych AI parse failed (no JSON): model={}, contentLen={}, trimmedEmpty=true, hasBrace=false",
                    model, contentLen);
            return new AiResult(
                    baseMarkdownWithDisclaimer(baseMarkdown, "AI 출력 파싱 실패"),
                    buildEvidenceJson("rejected", "unparsed", true),
                    model,
                    PROMPT_VERSION
            );
        }

        try {
            JsonNode out = objectMapper.readTree(trimmed);
            Validation validation = validateModelOutput(out, metrics, assessmentType);
            if (!validation.ok) {
                log.warn("Psych AI validation failed: reason={}, contentLen={}", validation.reason, trimmed.length());
                String reportMd = out.path("reportMarkdown").asText("");
                boolean sectionsOk = StringUtils.hasText(reportMd)
                        && hasRequiredSections(reportMd, assessmentType);
                if (sectionsOk && isEvidenceOnlyFailure(validation.reason)) {
                    log.info("Psych AI: evidence validation failed but reportMarkdown accepted (reason={})", validation.reason);
                    JsonNode evNode = out.path("evidence");
                    String ev = evNode.isMissingNode() ? buildEvidenceJson("ok", "evidence_skipped", true) : evNode.toString();
                    return new AiResult(reportMd, ev, model, PROMPT_VERSION);
                }
                return new AiResult(
                        baseMarkdownWithDisclaimer(baseMarkdown, validation.reason),
                        buildEvidenceJson("rejected", validation.reason, true),
                        model,
                        PROMPT_VERSION
                );
            }

            String reportMarkdown = out.path("reportMarkdown").asText(baseMarkdown);
            if (!isMostlyKorean(reportMarkdown)) {
                return new AiResult(
                        baseMarkdownWithDisclaimer(baseMarkdown, "한국어 출력 위반"),
                        buildEvidenceJson("rejected", "non_korean", true),
                        model,
                        PROMPT_VERSION
                );
            }
            if (containsForbiddenText(reportMarkdown)) {
                return new AiResult(
                        baseMarkdownWithDisclaimer(baseMarkdown, "금지 문구 탐지"),
                        buildEvidenceJson("rejected", "forbidden_text", true),
                        model,
                        PROMPT_VERSION
                );
            }

            JsonNode evidence = out.path("evidence");
            String evidenceJson = evidence.isMissingNode()
                    ? buildEvidenceJson("ok", "missing_evidence", true)
                    : evidence.toString();

            return new AiResult(reportMarkdown, evidenceJson, model, PROMPT_VERSION);
        } catch (Exception parseError) {
            String preview = trimmed.length() > 300 ? trimmed.substring(0, 300) + "..." : trimmed;
            log.warn("Psych AI parse failed: model={}, exception={}, message={}, trimmedLen={}, contentPreview={}",
                    model, parseError.getClass().getSimpleName(), parseError.getMessage(),
                    trimmed.length(), preview);
            return new AiResult(
                    baseMarkdownWithDisclaimer(baseMarkdown, "AI 출력 파싱 실패"),
                    buildEvidenceJson("rejected", "unparsed", true),
                    model,
                    PROMPT_VERSION
            );
        }
    }

    private record Validation(boolean ok, String reason) {}

    private boolean isEvidenceOnlyFailure(String reason) {
        if (reason == null) return false;
        return reason.startsWith("invalid_evidence_structure")
                || reason.startsWith("insufficient_evidence")
                || reason.startsWith("missing_basedOn")
                || reason.startsWith("missing_scaleCode")
                || reason.startsWith("hallucinated_scaleCode");
    }

    /**
     * 필수 섹션: 요약·권고는 {@link PsychAiReportSectionChecks#hasSummaryAndRecommendationHeadings(String)}로 완화 검증.
     * TCI/MMPI는 디자이너 표에 맞춘 헤딩 순서를 {@link PsychAiReportSectionChecks}에서 추가 검증한다.
     */
    private boolean hasRequiredSections(String reportMarkdown, PsychAssessmentType assessmentType) {
        if (!PsychAiReportSectionChecks.hasSummaryAndRecommendationHeadings(reportMarkdown)) {
            return false;
        }
        if (assessmentType == PsychAssessmentType.TCI) {
            return PsychAiReportSectionChecks.hasTciDesignerHeadingsInOrder(reportMarkdown);
        }
        if (assessmentType == PsychAssessmentType.MMPI) {
            return PsychAiReportSectionChecks.hasMmpiDesignerHeadingsInOrder(reportMarkdown);
        }
        return true;
    }

    private Validation validateModelOutput(JsonNode out, List<MetricInput> metrics, PsychAssessmentType assessmentType) {
        if (out == null || out.isMissingNode() || !out.isObject()) {
            return new Validation(false, "invalid_json_root");
        }

        String reportMarkdown = out.path("reportMarkdown").asText("");
        if (!StringUtils.hasText(reportMarkdown)) {
            return new Validation(false, "missing_report_markdown");
        }

        if (!hasRequiredSections(reportMarkdown, assessmentType)) {
            String preview = reportMarkdown.length() > 500 ? reportMarkdown.substring(0, 500) + "..." : reportMarkdown;
            log.warn("Psych AI missing_required_sections: reportMarkdown preview (len={}): {}", reportMarkdown.length(), preview);
            return new Validation(false, "missing_required_sections");
        }

        JsonNode evidence = out.path("evidence");
        JsonNode highlights = evidence.path("highlights");
        if (!highlights.isArray()) {
            return new Validation(false, "invalid_evidence_structure");
        }
        if (highlights.size() < MIN_EVIDENCE_HIGHLIGHTS) {
            return new Validation(false, "insufficient_evidence:" + highlights.size());
        }

        // 근거 매칭: evidence에 등장한 scaleCode는 입력 metrics에 존재해야 함(환각 방지)
        Set<String> allowedScaleCodes = metrics == null ? Set.of() : metrics.stream()
                .map(MetricInput::scaleCode)
                .filter(StringUtils::hasText)
                .collect(java.util.stream.Collectors.toSet());

        for (JsonNode h : highlights) {
            JsonNode basedOn = h.path("basedOn");
            if (!basedOn.isArray() || basedOn.isEmpty()) {
                return new Validation(false, "missing_basedOn");
            }
            for (JsonNode b : basedOn) {
                String scaleCode = b.path("scaleCode").asText("");
                if (!StringUtils.hasText(scaleCode)) {
                    return new Validation(false, "missing_scaleCode");
                }
                if (!allowedScaleCodes.isEmpty() && !allowedScaleCodes.contains(scaleCode)) {
                    return new Validation(false, "hallucinated_scaleCode:" + scaleCode);
                }
            }
        }

        return new Validation(true, "ok");
    }

    private boolean containsForbiddenText(String text) {
        if (!StringUtils.hasText(text)) return false;
        for (Pattern p : FORBIDDEN_PATTERNS) {
            if (p.matcher(text).find()) return true;
        }
        return false;
    }

    private boolean isMostlyKorean(String text) {
        if (!StringUtils.hasText(text)) return false;
        int total = Math.min(text.length(), 8000);
        int hangul = 0;
        for (int i = 0; i < total; i++) {
            char c = text.charAt(i);
            if (c >= '가' && c <= '힣') hangul++;
        }
        // 너무 엄격하면 false positive가 많아서, 최소 15% 정도만 한국어면 통과
        return hangul >= Math.max(30, (int) (total * 0.15));
    }

    private String baseMarkdownWithDisclaimer(String baseMarkdown, String reason) {
        return baseMarkdown
                + "\n\n---\n\n"
                + "## 안내\n"
                + "- AI 생성 결과가 검증 기준을 통과하지 못해 자동으로 제외되었습니다.\n"
                + "- 사유: " + reason + "\n"
                + "- 이 리포트는 참고용이며, 최종 해석은 전문가의 종합 판단이 필요합니다.\n";
    }

    private String buildEvidenceJson(String status, String reason, boolean needsReview) {
        String safeStatus = StringUtils.hasText(status) ? status : "unknown";
        String safeReason = StringUtils.hasText(reason) ? reason : "unknown";
        return "{\"ai\":\"" + escapeJson(safeStatus) + "\","
                + "\"reason\":\"" + escapeJson(safeReason) + "\","
                + "\"quality\":{\"templateMatched\":false,\"needsReview\":" + needsReview + "}}";
    }

    private String escapeJson(String s) {
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    private String truncate(String s, int max) {
        if (s == null) return "";
        return s.length() > max ? s.substring(0, max) + "..." : s;
    }

    private String buildSystemPrompt(PsychAssessmentType assessmentType) {
        if (assessmentType == PsychAssessmentType.TCI) {
            return buildTciSystemPrompt();
        }
        return buildMmpiSystemPrompt();
    }

    private String buildMmpiSystemPrompt() {
        return """
너는 임상심리 평가 보조 AI이다. MMPI 계열 결과를 바탕으로 상담자가 면담에서 참고할 해석·소견·면담 탐색 포인트를 제안한다. 반드시 한국어로만 작성한다.

원칙:
- 확정 진단·질병명 확정·법적 결론을 내리지 않는다.
- 수치·T점수·척도 코드·타당도 지표는 입력 지표에 나온 값만 인용한다(추측·보간 금지).
- 특정 기관의 상용 해석 보고서 문장을 복제하거나 표절하지 말고, 구조와 수치에만 근거해 독자적으로 서술한다(저작권·원문 복제 금지).
- 위험 신호(자/타해 등)는 가능성 수준으로 표기하고, 필요 시 즉시 전문가 평가·안전계획을 권한다.
- evidence.highlights는 최소 1개이며, 각 highlight의 basedOn.scaleCode는 입력 지표의 scaleCode 중 하나여야 한다.

출력은 반드시 JSON 단일 객체로만 반환한다. (마크다운 코드펜스 금지, 설명문 없이 JSON만)

reportMarkdown 필드에는 다음 마크다운 헤딩을 **반드시** 이 순서로 포함한다(표기·순서 정확히):
1) ## 요약
2) ## 타당도
3) ## 임상 척도
4) ## 재구성 척도
5) ## 강점 및 자원
6) ## 권고

입력에 해당 척도가 없으면 해당 섹션에서 ‘지표에 없음’을 한 문장으로 명시하고 과장하지 않는다.

스키마:
{
  "reportMarkdown": "## 요약\\n\\n...\\n\\n## 타당도\\n\\n...",
  "evidence": {
    "highlights": [
      {"text":"...", "basedOn":[{"scaleCode":"F", "tScore":55, "percentile":null}], "notes":"..."}
    ],
    "quality": {"templateMatched": false, "needsReview": true}
  }
}
""";
    }

    private String buildTciSystemPrompt() {
        return """
너는 임상심리 평가 보조 AI이다. TCI(기질·성격검사) 결과를 바탕으로, 상담자가 참고할 수 있는 해석상담 보고서 톤의 한국어 서술을 작성한다. 반드시 한국어로만 작성한다.

원칙:
- 확정 진단·질병명 확정·법적 결론을 내리지 않는다.
- 수치·백분위·척도 코드는 입력 지표에 나온 값만 인용한다(추측·보간 금지).
- 특정 기관의 상용 해석 보고서 문장을 복제하거나 표절하지 말고, 구조와 수치에만 근거해 독자적으로 서술한다(저작권·원문 복제 금지).
- 존댓말·리포터형 서술을 사용하되 2인칭 혼용은 자연스러운 범위로 허용한다.
- 위험 신호는 가능성 수준으로 표기하고, 필요 시 전문가 상담을 권한다.

출력은 반드시 JSON 단일 객체로만 반환한다. (마크다운 코드펜스 금지, 설명문 없이 JSON만)

reportMarkdown 필드에는 다음 마크다운 헤딩을 **반드시** 이 순서로 포함한다(표기 정확히):
1) ## 요약
2) ## 검사 개요
3) ## 기질·성격 프로필
4) ## 점수 해석
5) ## 상담 시 고려
6) ## 권고

evidence.highlights는 최소 1개이며, 각 highlight의 basedOn.scaleCode는 입력 지표의 scaleCode 중 하나여야 한다.

스키마:
{
  "reportMarkdown": "## 요약\\n\\n...\\n\\n## 검사 개요\\n\\n...",
  "evidence": {
    "highlights": [
      {"text":"...", "basedOn":[{"scaleCode":"NS", "percentile":45, "tScore":null}], "notes":"..."}
    ],
    "quality": {"templateMatched": false, "needsReview": true}
  }
}
""";
    }

    private String buildUserPrompt(PsychAssessmentType type, List<MetricInput> metrics, String baseMarkdown) {
        if (type == PsychAssessmentType.TCI) {
            return buildTciUserPrompt(metrics, baseMarkdown);
        }
        return buildMmpiUserPrompt(metrics, baseMarkdown);
    }

    private String buildMmpiUserPrompt(List<MetricInput> metrics, String baseMarkdown) {
        StringBuilder sb = new StringBuilder();
        sb.append("검사 종류: MMPI\n");
        sb.append("아래는 규칙 기반 요약(초안)이다. 이걸 바탕으로 상담에 도움이 되도록 해석을 보강하라.\n\n");
        sb.append(baseMarkdown).append("\n\n");
        sb.append("추출된 지표 목록(JSON):\n");
        try {
            sb.append(objectMapper.writeValueAsString(metrics));
        } catch (Exception e) {
            sb.append("[]");
        }
        sb.append("\n\n");
        sb.append("요구사항:\n");
        sb.append("- reportMarkdown: 시스템 프롬프트에 명시된 6개 헤딩(## 요약 … ## 권고) 순서를 지킨다.\n");
        sb.append("- ## 요약: 전체 요약(2~3문장), 타당도·임상 패턴의 방향만 언급(단정 금지).\n");
        sb.append("- ## 타당도: VRIN, TRIN, F·Fp·Fs 등 입력에 있는 타당도 지표만으로 신뢰도·응답 경향을 서술.\n");
        sb.append("- ## 임상 척도: T점수가 상승한 척도 위주로 임상적 ‘가능성’ 수준 해석, 상담 시 주목점.\n");
        sb.append("- ## 재구성 척도: RC 등 입력에 있으면 해석, 없으면 ‘해당 지표 없음’ 한 문장.\n");
        sb.append("- ## 강점 및 자원: 상대적으로 낮은 임상상·회복 자원·면담에서 활용할 강점(입력 근거).\n");
        sb.append("- ## 권고: 면담·추적 평가·전문가 의뢰 등 권고 + 필요 시 면담 탐색 질문 3~5개를 본문에 포함.\n");
        sb.append("- evidence.highlights: 핵심 문장별 basedOn에 scaleCode와 tScore 또는 percentile 연결(최소 1개).\n");
        sb.append("- 한국어만, 출력은 JSON만(코드블록 없이)\n");
        return sb.toString();
    }

    private String buildTciUserPrompt(List<MetricInput> metrics, String baseMarkdown) {
        StringBuilder sb = new StringBuilder();
        sb.append("검사 종류: TCI (기질·성격검사)\n");
        sb.append("아래 초안은 자동 추출 지표를 요약한 것이다. 해석상담 보고서 스타일로 다단락 서술을 작성하라.\n\n");
        sb.append(baseMarkdown).append("\n\n");
        sb.append("추출된 지표 목록(JSON):\n");
        try {
            sb.append(objectMapper.writeValueAsString(metrics));
        } catch (Exception e) {
            sb.append("[]");
        }
        sb.append("\n\n");
        sb.append("요구사항:\n");
        sb.append("- reportMarkdown: 시스템 프롬프트에 명시된 6개 헤딩(## 요약 … ## 권고) 순서를 지킨다.\n");
        sb.append("- ## 검사 개요: 검사 목적·해석 범위를 한 문단으로 안내(과장 금지).\n");
        sb.append("- ## 기질·성격 프로필: NS·HA·RD·P 및 SD·C·ST 등 입력 척도의 패턴을 통합 서술.\n");
        sb.append("- ## 점수 해석: 백분위·수준(낮음/보통/높음 등 입력 cutoffTag)이 있으면 반드시 반영.\n");
        sb.append("- ## 상담 시 고려: 면담 태도·추가 확인 포인트(가설 수준).\n");
        sb.append("- ## 권고: 전문가 상담·추적 검사 등 일반적 권고(단정 금지).\n");
        sb.append("- evidence.highlights: 핵심 문장별 basedOn에 scaleCode와 percentile 또는 tScore를 연결(최소 1개).\n");
        sb.append("- 한국어만, 출력은 JSON만(코드블록 없이)\n");
        return sb.toString();
    }
}
