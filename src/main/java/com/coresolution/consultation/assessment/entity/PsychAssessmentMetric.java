package com.coresolution.consultation.assessment.entity;

import com.coresolution.consultation.assessment.model.PsychAssessmentType;
import com.coresolution.consultation.entity.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Entity
@Table(name = "psych_assessment_metrics",
        indexes = {
                @Index(name = "idx_psych_metric_tenant", columnList = "tenant_id"),
                @Index(name = "idx_psych_metric_doc", columnList = "document_id"),
                @Index(name = "idx_psych_metric_scale", columnList = "tenant_id,assessment_type,scale_code")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PsychAssessmentMetric extends BaseEntity {
    @NotBlank
    @Column(name = "tenant_id", nullable = false, length = 100)
    private String tenantId;

    @NotNull
    @Column(name = "document_id", nullable = false)
    private Long documentId;

    @NotNull
    @Column(name = "extraction_id", nullable = false)
    private Long extractionId;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "assessment_type", nullable = false, length = 50)
    private PsychAssessmentType assessmentType;

    @NotBlank
    @Column(name = "scale_code", nullable = false, length = 100)
    private String scaleCode;

    @Column(name = "scale_label", length = 255)
    private String scaleLabel;

    @Column(name = "raw_score")
    private Double rawScore;

    @Column(name = "t_score")
    private Double tScore;

    @Column(name = "percentile")
    private Double percentile;

    @Column(name = "cutoff_tag", length = 50)
    private String cutoffTag;

    @Lob
    @Column(name = "flags_json")
    private String flagsJson;
}


