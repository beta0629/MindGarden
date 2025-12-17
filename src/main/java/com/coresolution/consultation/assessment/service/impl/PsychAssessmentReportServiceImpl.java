package com.coresolution.consultation.assessment.service.impl;

import com.coresolution.consultation.assessment.entity.PsychAssessmentExtraction;
import com.coresolution.consultation.assessment.entity.PsychAssessmentMetric;
import com.coresolution.consultation.assessment.entity.PsychAssessmentReport;
import com.coresolution.consultation.assessment.repository.PsychAssessmentExtractionRepository;
import com.coresolution.consultation.assessment.repository.PsychAssessmentMetricRepository;
import com.coresolution.consultation.assessment.repository.PsychAssessmentReportRepository;
import com.coresolution.consultation.assessment.service.PsychAssessmentReportService;
import com.coresolution.consultation.service.OpenAIWellnessService;
import com.coresolution.core.context.TenantContextHolder;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PsychAssessmentReportServiceImpl implements PsychAssessmentReportService {

    private static final String RULES_VERSION = "rules-v1";
    private static final String PROMPT_VERSION = "prompt-v1";

    private final PsychAssessmentExtractionRepository extractionRepository;
    private final PsychAssessmentMetricRepository metricRepository;
    private final PsychAssessmentReportRepository reportRepository;
    private final OpenAIWellnessService openAIWellnessService;

    @Override
    @Transactional
    public Long generateLatestReport(Long documentId) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        PsychAssessmentExtraction extraction = extractionRepository
                .findTopByTenantIdAndDocumentIdOrderByCreatedAtDesc(tenantId, documentId)
                .orElseThrow(() -> new IllegalArgumentException("추출 결과가 없습니다."));

        List<PsychAssessmentMetric> metrics = metricRepository.findByTenantIdAndDocumentId(tenantId, documentId);

        String baseMarkdown = buildRuleBasedMarkdown(metrics);
        // MVP: LLM은 문장화/톤 보정에만 사용. API 키가 없으면 내부 기본 텍스트 반환됨(서비스 내 로직)
        String llmEnhanced = tryEnhanceWithLlm(baseMarkdown);

        PsychAssessmentReport report = PsychAssessmentReport.builder()
                .tenantId(tenantId)
                .documentId(documentId)
                .extractionId(extraction.getId())
                .reportVersion(1)
                .promptVersion(PROMPT_VERSION)
                .modelName("openai")
                .rulesVersion(RULES_VERSION)
                .reportMarkdown(llmEnhanced)
                .evidenceJson("{\"metricCount\":" + metrics.size() + "}")
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

    private String tryEnhanceWithLlm(String markdown) {
        try {
            // wellness 서비스는 JSON/HTML을 기대하지만, MVP에서는 API 키 존재 여부에 따른 호출 안정성만 활용
            // (향후 psych 전용 OpenAI 서비스로 분리)
            OpenAIWellnessService.WellnessContent c = openAIWellnessService.generateWellnessContent(1, "SPRING", "GENERAL");
            return markdown + "\n\n---\n\n" + "## 참고(자동 생성 문구)\n" + c.getContent();
        } catch (Exception e) {
            return markdown;
        }
    }
}


