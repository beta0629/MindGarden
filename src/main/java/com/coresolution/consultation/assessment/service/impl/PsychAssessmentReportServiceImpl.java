package com.coresolution.consultation.assessment.service.impl;

import com.coresolution.consultation.assessment.entity.PsychAssessmentDocument;
import com.coresolution.consultation.assessment.entity.PsychAssessmentExtraction;
import com.coresolution.consultation.assessment.entity.PsychAssessmentMetric;
import com.coresolution.consultation.assessment.entity.PsychAssessmentReport;
import com.coresolution.consultation.assessment.model.PsychAssessmentType;
import com.coresolution.consultation.assessment.repository.PsychAssessmentDocumentRepository;
import com.coresolution.consultation.assessment.repository.PsychAssessmentExtractionRepository;
import com.coresolution.consultation.assessment.repository.PsychAssessmentMetricRepository;
import com.coresolution.consultation.assessment.repository.PsychAssessmentReportRepository;
import com.coresolution.consultation.assessment.service.PsychAiService;
import com.coresolution.consultation.assessment.service.PsychAssessmentExtractionService;
import com.coresolution.consultation.assessment.service.PsychAssessmentReportService;
import com.coresolution.core.context.TenantContextHolder;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class PsychAssessmentReportServiceImpl implements PsychAssessmentReportService {

    private static final String RULES_VERSION = "rules-v1";

    private final ObjectMapper objectMapper;
    private final PsychAssessmentDocumentRepository documentRepository;
    private final PsychAssessmentExtractionRepository extractionRepository;
    private final PsychAssessmentMetricRepository metricRepository;
    private final PsychAssessmentReportRepository reportRepository;
    private final PsychAiService psychAiService;
    @Lazy
    private final PsychAssessmentExtractionService extractionService;

    @Override
    @Transactional
    public Long generateLatestReport(Long documentId) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        var doc = documentRepository.findByTenantIdAndId(tenantId, documentId)
                .orElseThrow(() -> new IllegalArgumentException("문서를 찾을 수 없습니다."));
        PsychAssessmentExtraction extraction = extractionRepository
                .findTopByTenantIdAndDocumentIdOrderByCreatedAtDesc(tenantId, documentId)
                .orElse(null);
        // extraction 없음 또는 extracted_json 비어 있음 → 재추출 (지표 없음 문제 해결)
        if (extraction == null || !StringUtils.hasText(extraction.getExtractedJson())) {
            extractionService.ensureExtractionSync(tenantId, documentId);
            extraction = extractionRepository
                    .findTopByTenantIdAndDocumentIdOrderByCreatedAtDesc(tenantId, documentId)
                    .orElseThrow(() -> new IllegalArgumentException("추출 결과가 없습니다."));
        }

        ensureMetricsFromExtraction(tenantId, extraction, doc);

        List<PsychAssessmentMetric> metrics = metricRepository.findByTenantIdAndDocumentId(tenantId, documentId);

        String baseMarkdown = buildRuleBasedMarkdown(metrics);

        // 실제 LLM: 심리검사 전용 프롬프트/출력(JSON) 사용
        var aiInputs = metrics == null ? List.<PsychAiService.MetricInput>of() : metrics.stream()
                .map(m -> new PsychAiService.MetricInput(
                        m.getScaleCode(),
                        m.getScaleLabel(),
                        m.getRawScore(),
                        m.getTScore(),
                        m.getPercentile(),
                        m.getCutoffTag()
                ))
                .toList();
        var aiResult = psychAiService.generateKoreanReport(doc.getAssessmentType(), aiInputs, baseMarkdown);

        PsychAssessmentReport report = PsychAssessmentReport.builder()
                .tenantId(tenantId)
                .documentId(documentId)
                .extractionId(extraction.getId())
                .reportVersion(1)
                .promptVersion(aiResult.promptVersion())
                .modelName(aiResult.modelName())
                .rulesVersion(RULES_VERSION)
                .reportMarkdown(aiResult.reportMarkdown())
                .evidenceJson(aiResult.evidenceJson())
                .status("GENERATED")
                .createdBy(null)
                .build();

        return reportRepository.save(report).getId();
    }

    private String buildRuleBasedMarkdown(List<PsychAssessmentMetric> metrics) {
        StringBuilder sb = new StringBuilder();
        sb.append("## 요약\n");
        if (metrics == null || metrics.isEmpty()) {
            sb.append("- 추출된 지표가 없어 해석을 생성할 수 없습니다. 원문 품질/양식 확인이 필요합니다.\n\n");
            sb.append("## 다음 조치\n");
            sb.append("- 스캔 품질 개선 또는 템플릿 등록 후 재추출을 권장합니다.\n");
            return sb.toString();
        }

        sb.append("- 주요 척도 수: ").append(metrics.size()).append("\n\n");
        sb.append("## 주요 지표\n");
        for (int i = 0; i < Math.min(metrics.size(), 15); i++) {
            PsychAssessmentMetric m = metrics.get(i);
            sb.append("- ").append(m.getScaleCode())
                    .append(" (").append(m.getScaleLabel() != null ? m.getScaleLabel() : "label").append(")")
                    .append(": T=").append(m.getTScore() != null ? m.getTScore() : "NA")
                    .append(", P=").append(m.getPercentile() != null ? m.getPercentile() : "NA")
                    .append("\n");
        }
        sb.append("\n## 권고\n");
        sb.append("- 결과는 단일 검사로 확정되지 않으며, 면담/관찰/병력과 함께 종합 해석이 필요합니다.\n");
        sb.append("- 위험 신호가 의심될 경우 즉시 전문가 평가/안전계획 수립을 권장합니다.\n");
        return sb.toString();
    }

    /**
     * extraction.extractedJson에서 지표를 파싱하여 PsychAssessmentMetric으로 저장.
     * extractedJson이 null/빈 문자열이거나 파싱 실패 시 로그만 남기고 건너뜀.
     *
     * @param tenantId  테넌트 ID
     * @param extraction 추출 결과
     * @param doc       문서 (assessmentType 조회용)
     */
    private void ensureMetricsFromExtraction(String tenantId, PsychAssessmentExtraction extraction,
            PsychAssessmentDocument doc) {
        String extractedJson = extraction.getExtractedJson();
        if (!StringUtils.hasText(extractedJson)) {
            return;
        }

        try {
            JsonNode root = objectMapper.readTree(extractedJson);
            List<JsonNode> items = collectMetricNodes(root);
            if (items.isEmpty()) {
                log.debug("extractedJson에 파싱 가능한 metrics 항목 없음: documentId={}", doc.getId());
                return;
            }

            PsychAssessmentType assessmentType = doc.getAssessmentType();
            Long documentId = doc.getId();
            Long extractionId = extraction.getId();

            metricRepository.deleteByTenantIdAndExtractionId(tenantId, extractionId);

            List<PsychAssessmentMetric> toSave = new ArrayList<>();
            for (JsonNode node : items) {
                String scaleCode = getString(node, "scaleCode").or(() -> getString(node, "scale")).orElse(null);
                if (!StringUtils.hasText(scaleCode)) {
                    continue;
                }

                PsychAssessmentMetric m = PsychAssessmentMetric.builder()
                        .tenantId(tenantId)
                        .documentId(documentId)
                        .extractionId(extractionId)
                        .assessmentType(assessmentType)
                        .scaleCode(scaleCode)
                        .scaleLabel(getString(node, "scaleLabel").or(() -> getString(node, "label")).orElse(null))
                        .rawScore(getDouble(node, "rawScore"))
                        .tScore(getDouble(node, "tScore"))
                        .percentile(getDouble(node, "percentile"))
                        .cutoffTag(getString(node, "cutoffTag").or(() -> getString(node, "cutoff_tag")).orElse(null))
                        .build();

                toSave.add(m);
            }

            if (!toSave.isEmpty()) {
                metricRepository.saveAll(toSave);
                log.info("extractedJson에서 metrics 저장 완료: documentId={}, count={}", documentId, toSave.size());
            }
        } catch (Exception e) {
            log.warn("extractedJson 파싱/저장 실패 (건너뜀): documentId={}, error={}",
                    doc.getId(), e.getMessage());
        }
    }

    private List<JsonNode> collectMetricNodes(JsonNode root) {
        List<JsonNode> result = new ArrayList<>();
        if (root == null || root.isMissingNode()) {
            return result;
        }
        if (root.isArray()) {
            root.forEach(result::add);
            return result;
        }
        if (root.isObject()) {
            for (String key : new String[] { "metrics", "scales", "scores" }) {
                if (root.has(key) && root.get(key).isArray()) {
                    root.get(key).forEach(result::add);
                    return result;
                }
            }
        }
        return result;
    }

    private Optional<String> getString(JsonNode node, String field) {
        if (node == null || !node.has(field)) {
            return Optional.empty();
        }
        JsonNode val = node.get(field);
        if (val == null || val.isNull()) {
            return Optional.empty();
        }
        String s = val.asText(null);
        return Optional.ofNullable(StringUtils.hasText(s) ? s : null);
    }

    private Double getDouble(JsonNode node, String field) {
        if (node == null || !node.has(field)) {
            return null;
        }
        JsonNode val = node.get(field);
        if (val == null || val.isNull()) {
            return null;
        }
        if (val.isNumber()) {
            return val.asDouble();
        }
        try {
            return Double.parseDouble(val.asText());
        } catch (NumberFormatException e) {
            return null;
        }
    }
}


