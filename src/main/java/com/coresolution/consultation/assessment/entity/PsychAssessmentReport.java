package com.coresolution.consultation.assessment.entity;

import com.coresolution.consultation.entity.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Entity
@Table(name = "psych_assessment_reports",
        indexes = {
                @Index(name = "idx_psych_report_tenant", columnList = "tenant_id"),
                @Index(name = "idx_psych_report_doc", columnList = "document_id")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PsychAssessmentReport extends BaseEntity {

    @NotBlank
    @Column(name = "tenant_id", nullable = false, length = 100)
    private String tenantId;

    @NotNull
    @Column(name = "document_id", nullable = false)
    private Long documentId;

    @NotNull
    @Column(name = "extraction_id", nullable = false)
    private Long extractionId;

    @Column(name = "report_version", nullable = false)
    private Integer reportVersion;

    @Column(name = "prompt_version", length = 50)
    private String promptVersion;

    @Column(name = "model_name", length = 100)
    private String modelName;

    @Column(name = "rules_version", length = 50)
    private String rulesVersion;

    @Lob
    @Column(name = "report_markdown", nullable = false, columnDefinition = "LONGTEXT")
    private String reportMarkdown;

    @Lob
    @Column(name = "evidence_json", columnDefinition = "LONGTEXT")
    private String evidenceJson;

    @NotBlank
    @Column(name = "status", nullable = false, length = 30)
    private String status; // GENERATED, APPROVED, REJECTED

    @Column(name = "created_by")
    private Long createdBy;
}


