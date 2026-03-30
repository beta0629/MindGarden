package com.coresolution.consultation.assessment.entity;

import com.coresolution.consultation.assessment.model.PsychAssessmentExtractionStatus;
import com.coresolution.consultation.entity.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Entity
@Table(name = "psych_assessment_extractions",
        indexes = {
                @Index(name = "idx_psych_ext_tenant", columnList = "tenant_id"),
                @Index(name = "idx_psych_ext_doc", columnList = "document_id")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PsychAssessmentExtraction extends BaseEntity {

    @NotBlank
    @Column(name = "tenant_id", nullable = false, length = 100)
    private String tenantId;

    @NotNull
    @Column(name = "document_id", nullable = false)
    private Long documentId;

    @Column(name = "template_id", length = 100)
    private String templateId;

    @NotBlank
    @Column(name = "extraction_mode", nullable = false, length = 30)
    private String extractionMode; // TEMPLATE, GENERIC

    @NotBlank
    @Column(name = "ocr_engine", nullable = false, length = 50)
    private String ocrEngine;

    @Column(name = "ocr_confidence")
    private Double ocrConfidence;

    @Lob
    @Column(name = "extracted_json", columnDefinition = "LONGTEXT")
    private String extractedJson;

    @Lob
    @Column(name = "validation_json", columnDefinition = "LONGTEXT")
    private String validationJson;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private PsychAssessmentExtractionStatus status;
}


