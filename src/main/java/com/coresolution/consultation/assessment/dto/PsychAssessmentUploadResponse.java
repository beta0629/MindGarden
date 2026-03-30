package com.coresolution.consultation.assessment.dto;

import com.coresolution.consultation.assessment.model.PsychAssessmentDocumentStatus;
import com.coresolution.consultation.assessment.model.PsychAssessmentType;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PsychAssessmentUploadResponse {
    private Long documentId;
    private String tenantId;
    private PsychAssessmentType assessmentType;
    private PsychAssessmentDocumentStatus status;
    private String sha256;
    private Long fileSize;
}


