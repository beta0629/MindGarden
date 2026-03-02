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
    private Long clientId;
    private PsychAssessmentType assessmentType;
    private PsychAssessmentDocumentStatus status;
    private String originalFilename;
    private Long fileSize;
    private String sha256;
    private LocalDateTime createdAt;
    /** 리포트 요약 1줄 (상담일지 표시용, 있을 경우만) */
    private String reportSummary;
}


