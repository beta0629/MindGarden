package com.coresolution.consultation.assessment.service;

import com.coresolution.consultation.assessment.entity.PsychAssessmentExtraction;
import com.coresolution.consultation.assessment.entity.PsychAssessmentMetric;

import java.util.List;

public interface PsychAssessmentValidationService {
    ValidationResult validate(PsychAssessmentExtraction extraction, List<PsychAssessmentMetric> metrics);

    record ValidationResult(String validationJson, boolean needsReview) {}
}


