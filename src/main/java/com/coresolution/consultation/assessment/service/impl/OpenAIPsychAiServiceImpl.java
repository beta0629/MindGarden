package com.coresolution.consultation.assessment.service.impl;

import com.coresolution.consultation.assessment.model.PsychAssessmentType;
import com.coresolution.consultation.assessment.service.PsychAiService;
import com.coresolution.consultation.service.SystemConfigService;
import com.coresolution.core.context.TenantContextHolder;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * 심리검사(TCI/MMPI) 전용 LLM 서비스 (OpenAI Chat Completions)
 * - 입력은 "추출된 지표" 중심(원문 OCR 전체 투입 최소화)
 * - 출력은 한국어 마크다운 + evidence(JSON) 고정
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OpenAIPsychAiServiceImpl implements PsychAiService {

    private static final String PROMPT_VERSION = "psych-prompt-v1";
    private static final int MAX_TOKENS = 4096;
    private static final double TEMPERATURE = 0.3;
    private static final int MIN_EVIDENCE_HIGHLIGHTS = 1;

    // “확정 진단/법적 결론” 방지(오판 리스크 방어): 발견 시 폴백 + 사람 검수 필요 처리
    private static final List<Pattern> FORBIDDEN_PATTERNS = List.of(
            Pattern.compile("확정\\s*진단", Pattern.CASE_INSENSITIVE),
            Pattern.compile("진단\\s*확정", Pattern.CASE_INSENSITIVE),
            Pattern.compile("법적\\s*결론", Pattern.CASE_INSENSITIVE),
            Pattern.compile("반드시\\s*.*장애", Pattern.CASE_INSENSITIVE),
            Pattern.compile("정신병", Pattern.CASE_INSENSITIVE),
            Pattern.compile("정신\\s*질환\\s*확정", Pattern.CASE_INSENSITIVE)
    );


    private final SystemConfigService systemConfigService;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RestTemplate restTemplate = new RestTemplate();

    @Override
    public AiResult generateKoreanReport(PsychAssessmentType assessmentType, List<MetricInput> metrics, String baseMarkdown) {
        String tenantId = TenantContextHolder.getTenantId();

        String providerId = systemConfigService.getAiDefaultProvider();
        String apiKey = systemConfigService.getApiKeyForProvider(providerId);
        String apiUrl = systemConfigService.getApiUrlForProvider(providerId);
        String model = systemConfigService.getModelForProvider(providerId);

        if (!StringUtils.hasText(apiKey)) {
            // 키가 없으면 규칙 기반 결과만 반환 (안전 폴백)
            return new AiResult(baseMarkdown, "{\"ai\":\"disabled\",\"reason\":\"" + providerId.toUpperCase() + "_API_KEY 미설정\"}", "disabled", PROMPT_VERSION);
        }

        try {
            String systemPrompt = buildSystemPrompt();
            String userPrompt = buildUserPrompt(assessmentType, metrics, baseMarkdown);

            log.info("Psych AI report generation start: provider={}, model={}, metricsCount={}",
                    providerId, model, metrics != null ? metrics.size() : 0);

            String rawContent;
            if ("gemini".equalsIgnoreCase(providerId)) {
                String effectiveUrl = StringUtils.hasText(apiUrl)
                        ? apiUrl
                        : GEMINI_DEFAULT_URL;
                rawContent = callGeminiApiWithFallback(apiKey, effectiveUrl, model, systemPrompt, userPrompt);
            } else {
                rawContent = callOpenAiFormatApi(apiKey, apiUrl, model, systemPrompt, userPrompt);
            }

            String content = rawContent != null ? rawContent : "";

            if (!StringUtils.hasText(content)) {
                log.warn("Psych AI empty response: provider={}, model={}, rawContentLen={}", providerId, model, rawContent != null ? rawContent.length() : 0);
                return new AiResult(baseMarkdown, "{\"ai\":\"failed\",\"reason\":\"empty_response\"}", model, PROMPT_VERSION);
            }

            return parseAndValidateAiOutput(content, baseMarkdown, model, metrics);

        } catch (Exception e) {
            log.error("Psych AI report generation failed: tenantId={}, type={}, provider={}, model={}, error={}",
                    tenantId, assessmentType, providerId, model, e.getMessage(), e);
            return new AiResult(baseMarkdown, "{\"ai\":\"failed\"}", model, PROMPT_VERSION);
        }
    }

    private static final String GEMINI_FALLBACK_MODEL = "gemini-2.0-flash";
    private static final String GEMINI_DEFAULT_URL = "https://generativelanguage.googleapis.com/v1beta";

    private String callGeminiApiWithFallback(String apiKey, String baseUrl, String model, String systemPrompt, String userPrompt) {
        try {
            return callGeminiApi(apiKey, baseUrl, model, systemPrompt, userPrompt);
        } catch (Exception e) {
            String msg = e.getMessage() != null ? e.getMessage() : "";
            if (!msg.contains("404")) {
                throw e;
            }
            if (!GEMINI_FALLBACK_MODEL.equals(model)) {
                log.info("Psych AI Gemini 404 (model={}), retrying with {}", model, GEMINI_FALLBACK_MODEL);
                return callGeminiApi(apiKey, baseUrl, GEMINI_FALLBACK_MODEL, systemPrompt, userPrompt);
            }
            if (!GEMINI_DEFAULT_URL.equals(baseUrl)) {
                log.info("Psych AI Gemini 404 with fallback model, retrying with default URL");
                return callGeminiApi(apiKey, GEMINI_DEFAULT_URL, GEMINI_FALLBACK_MODEL, systemPrompt, userPrompt);
            }
            throw e;
        }
    }

    private String callGeminiApi(String apiKey, String baseUrl, String model, String systemPrompt, String userPrompt) {
        try {
            String url = (baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl)
                    + "/models/" + model + ":generateContent";
            log.debug("Psych AI Gemini call: url={}", url);

            String fullPrompt = systemPrompt + "\n\n" + userPrompt;

            Map<String, Object> contents = new HashMap<>();
            contents.put("parts", List.of(Map.of("text", fullPrompt)));

            Map<String, Object> generationConfig = new HashMap<>();
            generationConfig.put("maxOutputTokens", MAX_TOKENS);
            generationConfig.put("temperature", TEMPERATURE);
            generationConfig.put("responseMimeType", "application/json");

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
                log.warn("Psych AI Gemini: candidates empty");
                return null;
            }
            JsonNode content = candidates.path(0).path("content").path("parts");
            if (!content.isArray() || content.isEmpty()) {
                log.warn("Psych AI Gemini: parts empty");
                return null;
            }
            String text = content.path(0).path("text").asText(null);
            log.info("Psych AI Gemini success: model={}, responseLen={}", model, text != null ? text.length() : 0);
            return text;
        } catch (Exception e) {
            log.warn("Psych AI Gemini API call failed: model={}, error={}", model, e.getMessage());
            throw e;
        }
    }

    private String callOpenAiFormatApi(String apiKey, String apiUrl, String model, String systemPrompt, String userPrompt) {
        Map<String, Object> msg1 = new HashMap<>();
        msg1.put("role", "system");
        msg1.put("content", systemPrompt);

        Map<String, Object> msg2 = new HashMap<>();
        msg2.put("role", "user");
        msg2.put("content", userPrompt);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", model);
        requestBody.put("messages", List.of(msg1, msg2));
        requestBody.put("max_tokens", MAX_TOKENS);
        requestBody.put("temperature", TEMPERATURE);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        HttpEntity<Map<String, Object>> req = new HttpEntity<>(requestBody, headers);
        @SuppressWarnings("rawtypes")
        ResponseEntity<Map> res = restTemplate.exchange(apiUrl, HttpMethod.POST, req, Map.class);
        JsonNode root = objectMapper.valueToTree(res.getBody());
        return root.path("choices").path(0).path("message").path("content").asText(null);
    }

    /**
     * AI 응답에서 JSON 객체 추출 (GPT가 설명문 + ```json ... ``` 형태로 반환하는 경우 대응).
     * 문자열 값 안의 {, }는 depth 계산에서 제외해 reportMarkdown 내부 '}'로 잘리는 문제 방지.
     */
    private String extractJsonFromContent(String content) {
        if (content == null) return "";
        String trimmed = content.trim();
        // ```json ... ``` 또는 ``` ... ``` 블록 추출
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
        // 문자열 내부의 {, }는 무시하고 짝 맞는 } 찾기
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
                if (c == '\\') escapeNext = true;
                else if (c == '"') inString = false;
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

    private AiResult parseAndValidateAiOutput(String content, String baseMarkdown, String model, List<MetricInput> metrics) {
        // 모델 출력은 JSON 문자열로 고정(리포트 + evidence)
        // GPT/Gemini가 ```json ... ``` 형태로 감싸거나 앞뒤에 설명을 붙이는 경우 추출
        String trimmed = extractJsonFromContent(content);
        if (!StringUtils.hasText(trimmed)) {
            log.warn("Psych AI parse failed (no JSON): model={}, contentLen={}, trimmedEmpty=true, hasBrace=false",
                    model, content != null ? content.length() : 0);
            return new AiResult(
                    baseMarkdownWithDisclaimer(baseMarkdown, "AI 출력 파싱 실패"),
                    buildEvidenceJson("rejected", "unparsed", true),
                    model,
                    PROMPT_VERSION
            );
        }

        try {
                JsonNode out = objectMapper.readTree(trimmed);
                Validation validation = validateModelOutput(out, metrics);
                if (!validation.ok) {
                    log.warn("Psych AI validation failed: reason={}, contentLen={}", validation.reason, trimmed.length());
                    String reportMd = out.path("reportMarkdown").asText("");
                    boolean sectionsOk = StringUtils.hasText(reportMd) && hasRequiredSections(reportMd);
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
                log.warn("Psych AI parse failed: model={}, exception={}, message={}, trimmedLen={}, trimmedEmpty={}, hasBrace={}, contentPreview={}",
                        model, parseError.getClass().getSimpleName(), parseError.getMessage(),
                        trimmed.length(), trimmed.isEmpty(), trimmed.indexOf('{') >= 0, preview);
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

    /** ##/### 요약, ##/### 권고 등 마크다운 헤딩 변형 허용. BOM·공백 누락·전각#·들여쓰기·한 줄·키워드 fallback 대응 */
    private boolean hasRequiredSections(String reportMarkdown) {
        if (!StringUtils.hasText(reportMarkdown)) return false;
        String normalized = reportMarkdown.replace("\uFEFF", "").replace("\r", "");
        // 1) 줄 시작 공백 허용(들여쓰기): ^\s*[#＃]+\s*.*요약/권고
        Pattern summaryLineStart = Pattern.compile("^\\s*[#＃]+\\s*.*요약", Pattern.MULTILINE | Pattern.UNICODE_CASE);
        Pattern recommendationLineStart = Pattern.compile("^\\s*[#＃]+\\s*.*권고", Pattern.MULTILINE | Pattern.UNICODE_CASE);
        if (summaryLineStart.matcher(normalized).find() && recommendationLineStart.matcher(normalized).find()) {
            return true;
        }
        // 2) 한 줄 reportMarkdown fallback: 줄 시작 없이 [#＃]+ ... 요약/권고 존재 여부
        Pattern summaryAnywhere = Pattern.compile(".*[#＃]+\\s*.*요약", Pattern.UNICODE_CASE);
        Pattern recommendationAnywhere = Pattern.compile(".*[#＃]+\\s*.*권고", Pattern.UNICODE_CASE);
        if (summaryAnywhere.matcher(normalized).find() && recommendationAnywhere.matcher(normalized).find()) {
            return true;
        }
        // 3) 키워드 fallback: 요약·권고(권고사항 등)가 본문 어디든 있으면 통과 (모델 변형 대응)
        if (normalized.contains("요약") && (normalized.contains("권고") || normalized.contains("권고사항"))) {
            return true;
        }
        return false;
    }

    private Validation validateModelOutput(JsonNode out, List<MetricInput> metrics) {
        if (out == null || out.isMissingNode() || !out.isObject()) {
            return new Validation(false, "invalid_json_root");
        }

        String reportMarkdown = out.path("reportMarkdown").asText("");
        if (!StringUtils.hasText(reportMarkdown)) {
            return new Validation(false, "missing_report_markdown");
        }

        // 섹션 최소 요건(오판 방어: ##/### 요약, ##/### 권고 등 변형 허용)
        if (!hasRequiredSections(reportMarkdown)) {
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

    private String buildSystemPrompt() {
        return """
너는 임상심리 평가 보조 AI이다. 목적은 상담에 도움이 되도록 검사 결과를 해석하고, 상담자가 면담에서 참고할 소견과 질문을 제안하는 것이다. 반드시 한국어로만 작성한다.
원칙:
- 확정 진단/법적 결론을 내리지 않는다.
- 수치/척도명은 입력으로 주어진 값만 사용한다(추측 금지).
- 위험 신호(자/타해 등)는 ‘가능성’ 수준으로 표기하고 즉시 전문가 평가/안전계획을 권고한다.
- 문장마다 근거를 남길 수 있도록 evidence를 구조화한다.

출력은 반드시 JSON 단일 객체로만 반환한다. (마크다운 코드펜스 금지, 설명문 없이 JSON만)

형식 통일(필수):
- reportMarkdown 필드에는 반드시 다음 두 개의 마크다운 헤딩을 정확히 포함한다.
  1) 줄 맨 앞에 "## 요약" (공백 없이 ## 다음 한 칸 띄고 요약)
  2) 줄 맨 앞에 "## 권고" (공백 없이 ## 다음 한 칸 띄고 권고)
- "권고사항", "Recommendations" 등 다른 표현 사용 금지. 반드시 "## 요약", "## 권고"만 사용한다.
- JSON은 한 줄이어도 되고 줄바꿈 있어도 되나, 문자열 값 안의 따옴표·중괄호는 이스케이프해야 한다.

스키마:
{
  "reportMarkdown": "## 요약\\n\\n...(내용)\\n\\n## 권고\\n\\n...(내용)",
  "evidence": {
    "highlights": [
      {"text":"...", "basedOn":[{"scaleCode":"...", "tScore":.., "percentile":..}], "notes":"..."}
    ],
    "quality": {"templateMatched": false, "needsReview": true}
  }
}
""";
    }

    private String buildUserPrompt(PsychAssessmentType type, List<MetricInput> metrics, String baseMarkdown) {
        StringBuilder sb = new StringBuilder();
        sb.append("검사 종류: ").append(type.name()).append("\n");
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
        sb.append("- reportMarkdown에는 반드시 헤딩 \"## 요약\", \"## 권고\"를 정확히 포함한다(다른 표기 금지).\n");
        sb.append("- ## 요약: 전체 요약(2~3문장)\n");
        sb.append("- ## 주요 소견: T점수 상승 척도별로 임상적 의미를 해석. 상담 시 주목할 점 구체 작성.\n");
        sb.append("- ## 주의(타당도): VRIN, TRIN, F 등 타당도 척도 해석. 검사 신뢰도 평가.\n");
        sb.append("- ## 권고: 면담/추적 평가/전문가 의뢰 등 권고(헤딩은 반드시 \"## 권고\"로만)\n");
        sb.append("- ## 추적 질문: 상담자가 면담에서 탐색할 구체적 질문 3~5개 제안\n");
        sb.append("- evidence: reportMarkdown 핵심 문장(최소 3개)에 근거 지표(scaleCode/tScore) 연결\n");
        sb.append("- 한국어만, 출력은 JSON만(코드블록 없이)\n");
        return sb.toString();
    }
}


