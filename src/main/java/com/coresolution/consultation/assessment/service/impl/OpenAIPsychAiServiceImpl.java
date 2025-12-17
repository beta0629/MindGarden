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
    private static final int MAX_TOKENS = 1200;
    private static final double TEMPERATURE = 0.3;

    private final SystemConfigService systemConfigService;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RestTemplate restTemplate = new RestTemplate();

    @Override
    public AiResult generateKoreanReport(PsychAssessmentType assessmentType, List<MetricInput> metrics, String baseMarkdown) {
        String tenantId = TenantContextHolder.getTenantId();

        String apiKey = systemConfigService.getOpenAIApiKey();
        String apiUrl = systemConfigService.getOpenAIApiUrl();
        String model = systemConfigService.getOpenAIModel();

        if (!StringUtils.hasText(apiKey)) {
            // 키가 없으면 규칙 기반 결과만 반환 (안전 폴백)
            return new AiResult(baseMarkdown, "{\"ai\":\"disabled\",\"reason\":\"OPENAI_API_KEY 미설정\"}", "disabled", PROMPT_VERSION);
        }

        try {
            String systemPrompt = buildSystemPrompt();
            String userPrompt = buildUserPrompt(assessmentType, metrics, baseMarkdown);

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
            String content = root.path("choices").path(0).path("message").path("content").asText("");

            if (!StringUtils.hasText(content)) {
                return new AiResult(baseMarkdown, "{\"ai\":\"failed\",\"reason\":\"empty_response\"}", model, PROMPT_VERSION);
            }

            // 모델 출력은 JSON 문자열로 고정(리포트 + evidence)
            // 파싱 실패 시에는 전체 텍스트를 reportMarkdown에 넣고 evidence는 폴백
            try {
                JsonNode out = objectMapper.readTree(content.trim());
                String reportMarkdown = out.path("reportMarkdown").asText(baseMarkdown);
                JsonNode evidence = out.path("evidence");
                String evidenceJson = evidence.isMissingNode() ? "{\"ai\":\"ok\",\"evidence\":\"missing\"}" : evidence.toString();
                return new AiResult(reportMarkdown, evidenceJson, model, PROMPT_VERSION);
            } catch (Exception parseError) {
                return new AiResult(content, "{\"ai\":\"ok\",\"evidence\":\"unparsed\"}", model, PROMPT_VERSION);
            }

        } catch (Exception e) {
            log.error("Psych AI report generation failed: tenantId={}, type={}, error={}",
                    tenantId, assessmentType, e.getMessage(), e);
            return new AiResult(baseMarkdown, "{\"ai\":\"failed\"}", model, PROMPT_VERSION);
        }
    }

    private String buildSystemPrompt() {
        return """
너는 임상심리 평가 보조 AI이다. 반드시 한국어로만 작성한다.
원칙:
- 확정 진단/법적 결론을 내리지 않는다.
- 수치/척도명은 입력으로 주어진 값만 사용한다(추측 금지).
- 위험 신호(자/타해 등)는 ‘가능성’ 수준으로 표기하고 즉시 전문가 평가/안전계획을 권고한다.
- 문장마다 근거를 남길 수 있도록 evidence를 구조화한다.

출력은 반드시 JSON 단일 객체로만 반환한다. (마크다운 코드펜스 금지)
스키마:
{
  "reportMarkdown": "## 요약 ...",
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
        sb.append("아래는 규칙 기반 요약(초안)이다. 내용을 유지하되 더 명확하고 임상적으로 조심스러운 표현으로 다듬어라.\n\n");
        sb.append(baseMarkdown).append("\n\n");
        sb.append("추출된 지표 목록(JSON):\n");
        try {
            sb.append(objectMapper.writeValueAsString(metrics));
        } catch (Exception e) {
            sb.append("[]");
        }
        sb.append("\n\n");
        sb.append("요구사항:\n");
        sb.append("- reportMarkdown: 섹션은 '요약/주요 소견/주의(타당도)/권고/추적 질문' 포함\n");
        sb.append("- evidence: reportMarkdown의 핵심 문장(최소 3개)에 근거 지표(scaleCode/tScore/percentile)를 연결\n");
        sb.append("- 한국어만\n");
        return sb.toString();
    }
}


