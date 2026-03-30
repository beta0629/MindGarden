package com.coresolution.consultation.assessment.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

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
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PsychAssessmentIngestServiceImpl implements PsychAssessmentIngestService {

    private static final String SOURCE_TYPE_SCANNED_PDF = "SCANNED_PDF";
    private static final String SOURCE_TYPE_SCANNED_IMAGE = "SCANNED_IMAGE";
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

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
                .sourceType(SOURCE_TYPE_SCANNED_PDF)
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

    @Override
    @Transactional
    public PsychAssessmentUploadResponse uploadScannedImages(PsychAssessmentType type, List<MultipartFile> files,
            Long clientId, Long createdBy) {
        if (files == null || files.isEmpty()) {
            throw new IllegalArgumentException("업로드할 이미지 파일을 선택해 주세요.");
        }

        String tenantId = TenantContextHolder.getRequiredTenantId();
        List<String> storagePaths = new ArrayList<>();
        long totalSize = 0;
        StringBuilder sha256Combined = new StringBuilder();
        String firstOriginalFilename = null;
        String keyVersion = null;

        for (MultipartFile file : files) {
            fileValidator.validateImageUpload(file);
            EncryptedFileStorageService.StoredEncryptedFile stored =
                    encryptedFileStorageService.storeFile(tenantId, file);
            storagePaths.add(stored.storagePath());
            totalSize += stored.size();
            sha256Combined.append(stored.sha256());
            if (firstOriginalFilename == null) {
                firstOriginalFilename = stored.originalFilename();
            }
            if (keyVersion == null) {
                keyVersion = stored.keyVersion();
            }
        }

        String storagePathJson;
        try {
            storagePathJson = OBJECT_MAPPER.writeValueAsString(storagePaths);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("저장 경로 직렬화 실패: " + e.getMessage(), e);
        }

        String displayFilename = files.size() > 1
                ? (StringUtils.hasText(firstOriginalFilename) ? firstOriginalFilename + " 외 " + (files.size() - 1) + "장"
                        : "이미지 " + files.size() + "장")
                : (firstOriginalFilename != null ? firstOriginalFilename : "이미지");

        // SHA256 조합: 각 파일 SHA256을 이어붙인 뒤 다시 SHA-256 해시하여 64자 hex
        String compositeSha256;
        try {
            java.security.MessageDigest md = java.security.MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(sha256Combined.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8));
            compositeSha256 = bytesToHex(hash);
        } catch (java.security.NoSuchAlgorithmException e) {
            compositeSha256 = sha256Combined.length() >= 64
                    ? sha256Combined.substring(0, 64)
                    : sha256Combined.toString();
        }

        PsychAssessmentDocument doc = PsychAssessmentDocument.builder()
                .tenantId(tenantId)
                .clientId(clientId)
                .assessmentType(type)
                .sourceType(SOURCE_TYPE_SCANNED_IMAGE)
                .originalFilename(displayFilename)
                .contentType("image/*")
                .fileSize(totalSize)
                .sha256(compositeSha256)
                .storagePath(storagePathJson)
                .encryptionKeyVersion(keyVersion != null ? keyVersion : "v1")
                .status(PsychAssessmentDocumentStatus.OCR_PENDING)
                .createdBy(createdBy)
                .build();

        PsychAssessmentDocument saved = documentRepository.save(doc);
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

    private static String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }
}


