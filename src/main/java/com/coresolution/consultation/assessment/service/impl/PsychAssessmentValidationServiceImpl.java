package com.coresolution.consultation.assessment.service.impl;

import com.coresolution.consultation.assessment.entity.PsychAssessmentExtraction;
import com.coresolution.consultation.assessment.entity.PsychAssessmentMetric;
import com.coresolution.consultation.assessment.service.PsychAssessmentValidationService;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class PsychAssessmentValidationServiceImpl implements PsychAssessmentValidationService {

    @Override
    public ValidationResult validate(PsychAssessmentExtraction extraction, List<PsychAssessmentMetric> metrics) {
        List<String> warnings = new ArrayList<>();
        List<String> errors = new ArrayList<>();

        if (metrics == null || metrics.isEmpty()) {
            warnings.add("표준화 지표가 비어있습니다(추출 실패 또는 미구현).");
        } else {
            for (PsychAssessmentMetric m : metrics) {
                if (m.getTScore() != null && (m.getTScore() < 0 || m.getTScore() > 200)) {
                    warnings.add("T점수 범위 이상: " + m.getScaleCode() + "=" + m.getTScore());
                }
                if (m.getPercentile() != null && (m.getPercentile() < 0 || m.getPercentile() > 100)) {
                    warnings.add("백분위 범위 이상: " + m.getScaleCode() + "=" + m.getPercentile());
                }
            }
        }

        String json = "{\"warnings\":" + toJsonArray(warnings) + ",\"errors\":" + toJsonArray(errors) + "}";
        boolean needsReview = !errors.isEmpty() || !warnings.isEmpty();
        return new ValidationResult(json, needsReview);
    }

    private String toJsonArray(List<String> items) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < items.size(); i++) {
            sb.append("\"").append(escape(items.get(i))).append("\"");
            if (i < items.size() - 1) sb.append(",");
        }
        sb.append("]");
        return sb.toString();
    }

    private String escape(String s) {
        return s == null ? "" : s.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}


