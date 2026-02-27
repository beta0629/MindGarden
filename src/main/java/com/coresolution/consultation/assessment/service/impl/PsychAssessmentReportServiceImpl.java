package com.coresolution.consultation.assessment.service.impl;

import com.coresolution.consultation.assessment.entity.PsychAssessmentExtraction;
import com.coresolution.consultation.assessment.entity.PsychAssessmentMetric;
import com.coresolution.consultation.assessment.entity.PsychAssessmentReport;
import com.coresolution.consultation.assessment.repository.PsychAssessmentDocumentRepository;
import com.coresolution.consultation.assessment.repository.PsychAssessmentExtractionRepository;
import com.coresolution.consultation.assessment.repository.PsychAssessmentMetricRepository;
import com.coresolution.consultation.assessment.repository.PsychAssessmentReportRepository;
import com.coresolution.consultation.assessment.service.PsychAiService;
import com.coresolution.consultation.assessment.service.PsychAssessmentExtractionService;
import com.coresolution.consultation.assessment.service.PsychAssessmentReportService;
import com.coresolution.core.context.TenantContextHolder;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PsychAssessmentReportServiceImpl implements PsychAssessmentReportService {

    private static final String RULES_VERSION = "rules-v1";

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
        if (extraction == null) {
            extractionService.ensureExtractionSync(tenantId, documentId);
            extraction = extractionRepository
                    .findTopByTenantIdAndDocumentIdOrderByCreatedAtDesc(tenantId, documentId)
                    .orElseThrow(() -> new IllegalArgumentException("추출 결과가 없습니다."));
        }

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
}


