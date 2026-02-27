package com.coresolution.consultation.assessment.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * 심리검사 AI 리포트 조회용 DTO (리포트 보기 화면)
 */
@Getter
@Builder
public class PsychAssessmentReportViewDto {
    private Long reportId;
    private Long documentId;
    private String reportMarkdown;
    private String modelName;
    private String promptVersion;
    private LocalDateTime createdAt;
}
