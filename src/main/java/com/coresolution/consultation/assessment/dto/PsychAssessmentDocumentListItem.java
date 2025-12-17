package com.coresolution.consultation.assessment.dto;

import com.coresolution.consultation.assessment.model.PsychAssessmentDocumentStatus;
import com.coresolution.consultation.assessment.model.PsychAssessmentType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class PsychAssessmentDocumentListItem {
    private Long documentId;
    private PsychAssessmentType assessmentType;
    private PsychAssessmentDocumentStatus status;
    private String originalFilename;
    private Long fileSize;
    private String sha256;
    private LocalDateTime createdAt;
}


