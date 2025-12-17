package com.coresolution.consultation.assessment.service.impl;

import com.coresolution.consultation.assessment.dto.PsychAssessmentUploadResponse;
import com.coresolution.consultation.assessment.entity.PsychAssessmentDocument;
import com.coresolution.consultation.assessment.model.PsychAssessmentDocumentStatus;
import com.coresolution.consultation.assessment.model.PsychAssessmentType;
import com.coresolution.consultation.assessment.repository.PsychAssessmentDocumentRepository;
import com.coresolution.consultation.assessment.service.EncryptedFileStorageService;
import com.coresolution.consultation.assessment.service.PsychAssessmentIngestService;
import com.coresolution.core.context.TenantContextHolder;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class PsychAssessmentIngestServiceImpl implements PsychAssessmentIngestService {

    private final PsychAssessmentDocumentRepository documentRepository;
    private final EncryptedFileStorageService encryptedFileStorageService;

    @Override
    @Transactional
    public PsychAssessmentUploadResponse uploadScannedPdf(PsychAssessmentType type, MultipartFile file, Long clientId,
            Long createdBy) {
        String tenantId = TenantContextHolder.getRequiredTenantId();

        EncryptedFileStorageService.StoredEncryptedFile stored =
                encryptedFileStorageService.storePdf(tenantId, file);

        PsychAssessmentDocument doc = PsychAssessmentDocument.builder()
                .tenantId(tenantId)
                .clientId(clientId)
                .assessmentType(type)
                .sourceType("SCANNED_PDF")
                .originalFilename(stored.originalFilename())
                .contentType(stored.contentType())
                .fileSize(stored.size())
                .sha256(stored.sha256())
                .storagePath(stored.storagePath())
                .encryptionKeyVersion(stored.keyVersion())
                .status(PsychAssessmentDocumentStatus.OCR_PENDING)
                .createdBy(createdBy)
                .build();

        PsychAssessmentDocument saved = documentRepository.save(doc);

        return PsychAssessmentUploadResponse.builder()
                .documentId(saved.getId())
                .tenantId(saved.getTenantId())
                .assessmentType(saved.getAssessmentType())
                .status(saved.getStatus())
                .sha256(saved.getSha256())
                .fileSize(saved.getFileSize())
                .build();
    }
}


