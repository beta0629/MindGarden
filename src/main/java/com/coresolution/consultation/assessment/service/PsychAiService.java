package com.coresolution.consultation.assessment.service;

import com.coresolution.consultation.assessment.model.PsychAssessmentType;

import java.util.List;

public interface PsychAiService {
    AiResult generateKoreanReport(PsychAssessmentType assessmentType, List<MetricInput> metrics, String baseMarkdown);

    record MetricInput(String scaleCode, String scaleLabel, Double rawScore, Double tScore, Double percentile, String cutoffTag) {}

    record AiResult(String reportMarkdown, String evidenceJson, String modelName, String promptVersion) {}
}


