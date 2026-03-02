package com.coresolution.consultation.assessment.entity;

import com.coresolution.consultation.assessment.model.PsychAssessmentDocumentStatus;
import com.coresolution.consultation.assessment.model.PsychAssessmentType;
import com.coresolution.consultation.entity.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Entity
@Table(name = "psych_assessment_documents",
        indexes = {
                @Index(name = "idx_psych_doc_tenant", columnList = "tenant_id"),
                @Index(name = "idx_psych_doc_tenant_type", columnList = "tenant_id,assessment_type"),
                @Index(name = "idx_psych_doc_sha", columnList = "sha256")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PsychAssessmentDocument extends BaseEntity {

    @NotBlank
    @Column(name = "tenant_id", nullable = false, length = 100)
    private String tenantId;

    @Column(name = "client_id")
    private Long clientId;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "assessment_type", nullable = false, length = 50)
    private PsychAssessmentType assessmentType;

    @NotBlank
    @Column(name = "source_type", nullable = false, length = 50)
    private String sourceType; // SCANNED_PDF

    @Column(name = "original_filename", length = 255)
    private String originalFilename;

    @Column(name = "content_type", length = 100)
    private String contentType;

    @Column(name = "file_size", nullable = false)
    private Long fileSize;

    @NotBlank
    @Column(name = "sha256", nullable = false, length = 64)
    private String sha256;

    @NotBlank
    @Column(name = "storage_path", nullable = false, columnDefinition = "TEXT")
    private String storagePath;

    @NotBlank
    @Column(name = "encryption_key_version", nullable = false, length = 50)
    private String encryptionKeyVersion;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private PsychAssessmentDocumentStatus status;

    @Column(name = "created_by")
    private Long createdBy;
}


