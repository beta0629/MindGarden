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
    private final com.coresolution.consultation.assessment.service.PsychAssessmentExtractionService extractionService;
    private final PsychAssessmentFileValidator fileValidator;

    @Override
    @Transactional
    public PsychAssessmentUploadResponse uploadScannedPdf(PsychAssessmentType type, MultipartFile file, Long clientId,
            Long createdBy) {
        String tenantId = TenantContextHolder.getRequiredTenantId();

        // 파일 검열: PDF 전용, 크기·확장자·Content-Type·매직 바이트 검증 (해킹/위장 파일 방지)
        fileValidator.validatePdfUpload(file);

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

        // MVP: 업로드 직후 추출 작업을 큐잉 (실제 OCR/템플릿은 추후 확장)
        extractionService.enqueueExtraction(saved.getId());

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


