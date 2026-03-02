package com.coresolution.consultation.assessment.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import com.coresolution.consultation.assessment.entity.PsychAssessmentDocument;
import com.coresolution.consultation.assessment.entity.PsychAssessmentExtraction;
import com.coresolution.consultation.assessment.model.PsychAssessmentDocumentStatus;
import com.coresolution.consultation.assessment.model.PsychAssessmentExtractionStatus;
import com.coresolution.consultation.assessment.model.PsychAssessmentType;
import com.coresolution.consultation.assessment.parser.Mmpi2ExtractionParser;
import com.coresolution.consultation.assessment.repository.PsychAssessmentDocumentRepository;
import com.coresolution.consultation.assessment.repository.PsychAssessmentExtractionRepository;
import com.coresolution.consultation.assessment.service.EncryptedFileStorageService;
import com.coresolution.consultation.assessment.service.PsychAssessmentExtractionService;
import com.coresolution.core.context.TenantContextHolder;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;

import org.springframework.context.annotation.Lazy;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.io.InputStream;
import java.util.List;

/**
 * 템플릿 감지/필드 추출 MVP 구현. - 실제 OCR/템플릿별 좌표 추출은 확장 포인트로 남김 - 현재는 "업로드된 문서에 대해 추출 레코드 생성 +
 * NEEDS_REVIEW"까지 제공
 */
@Slf4j
@Service
public class PsychAssessmentExtractionServiceImpl implements PsychAssessmentExtractionService {

    private static final String SOURCE_TYPE_SCANNED_PDF = "SCANNED_PDF";
    private static final String SOURCE_TYPE_SCANNED_IMAGE = "SCANNED_IMAGE";
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private final PsychAssessmentDocumentRepository documentRepository;
    private final PsychAssessmentExtractionRepository extractionRepository;
    private final com.coresolution.consultation.assessment.service.PsychAssessmentValidationService validationService;
    private final EncryptedFileStorageService encryptedFileStorageService;
    private final TesseractOcrService tesseractOcrService;
    private final PsychAssessmentExtractionRunner runner;

    public PsychAssessmentExtractionServiceImpl(
            PsychAssessmentDocumentRepository documentRepository,
            PsychAssessmentExtractionRepository extractionRepository,
            com.coresolution.consultation.assessment.service.PsychAssessmentValidationService validationService,
            EncryptedFileStorageService encryptedFileStorageService,
            TesseractOcrService tesseractOcrService,
            @Lazy PsychAssessmentExtractionRunner runner) {
        this.documentRepository = documentRepository;
        this.extractionRepository = extractionRepository;
        this.validationService = validationService;
        this.encryptedFileStorageService = encryptedFileStorageService;
        this.tesseractOcrService = tesseractOcrService;
        this.runner = runner;
    }

    @Override
    public void enqueueExtraction(Long documentId) {
        // @Async 스레드에는 TenantContext가 없으므로 호출 스레드에서 tenantId를 넘겨 비동기에서 설정
        String tenantId = TenantContextHolder.getRequiredTenantId();
        runner.processAsync(tenantId, documentId);
    }

    @Override
    public void ensureExtractionSync(String tenantId, Long documentId) {
        var existing = extractionRepository.findTopByTenantIdAndDocumentIdOrderByCreatedAtDesc(tenantId, documentId);
        // extraction이 있고 extracted_json이 있으면 스킵
        if (existing.isPresent() && StringUtils.hasText(existing.get().getExtractedJson())) {
            return;
        }
        // extraction 없음 또는 extracted_json 비어 있음 → 재추출 (리포트 생성 시 지표 없음 해결)
        runExtractionLogic(tenantId, documentId);
    }

    /**
     * MMPI 타입 문서의 저장된 PDF에서 텍스트 추출 후 Mmpi2ExtractionParser로 파싱.
     *
     * @param storage EncryptedFileStorageService
     * @param doc     문서 (assessmentType, storagePath)
     * @return JSON 문자열 또는 null
     */
    private static String tryExtractMmpi2FromPdf(EncryptedFileStorageService storage,
            PsychAssessmentDocument doc) {
        if (doc.getAssessmentType() != PsychAssessmentType.MMPI
                || !StringUtils.hasText(doc.getStoragePath())) {
            return null;
        }
        InputStream is = storage.readDecryptedFileAsInputStream(doc.getStoragePath());
        if (is == null) {
            return null;
        }
        try (is) {
            byte[] bytes = is.readAllBytes();
            try (PDDocument pdDoc = Loader.loadPDF(bytes)) {
                PDFTextStripper stripper = new PDFTextStripper();
                String text = stripper.getText(pdDoc);
                int textLen = text != null ? text.length() : 0;
                log.debug("MMPI-2 PDF 텍스트 추출: tenantId={}, documentId={}, textLen={}, sample={}",
                        doc.getTenantId(), doc.getId(), textLen,
                        text != null ? text.substring(0, Math.min(1000, textLen)) : "");

                String parsed = Mmpi2ExtractionParser.parse(text);
                if (parsed == null) {
                    log.info("MMPI-2 PDF 파싱 결과 null: tenantId={}, documentId={}, textLen={}, textHead={}",
                            doc.getTenantId(), doc.getId(), textLen,
                            text != null ? text.substring(0, Math.min(500, textLen)) : "");
                }
                return parsed;
            }
        } catch (Exception e) {
            log.warn("MMPI-2 PDF 추출/파싱 실패: tenantId={}, documentId={}, error={}",
                    doc.getTenantId(), doc.getId(), e.getMessage());
            return null;
        }
    }

    /**
     * SCANNED_IMAGE 문서의 저장된 이미지들에서 OCR로 텍스트 추출 후 Mmpi2ExtractionParser로 파싱.
     * storagePath는 JSON 배열 ["path1","path2",...] 형태.
     *
     * @param storage EncryptedFileStorageService
     * @param ocr     TesseractOcrService
     * @param doc     문서 (assessmentType, storagePath JSON)
     * @return JSON 문자열 또는 null
     */
    private static String tryExtractMmpi2FromImages(EncryptedFileStorageService storage,
            TesseractOcrService ocr, PsychAssessmentDocument doc) {
        if (doc.getAssessmentType() != PsychAssessmentType.MMPI
                || !StringUtils.hasText(doc.getStoragePath())) {
            return null;
        }
        List<String> paths;
        try {
            paths = OBJECT_MAPPER.readValue(doc.getStoragePath(), new TypeReference<List<String>>() {});
        } catch (Exception e) {
            // 단일 경로(기존 PDF 형식)로 해석 불가 시 스킵
            log.debug("storagePath JSON 파싱 실패, 단일 경로로 시도: documentId={}", doc.getId());
            return null;
        }
        if (paths == null || paths.isEmpty()) {
            return null;
        }
        StringBuilder combined = new StringBuilder();
        for (String path : paths) {
            InputStream is = storage.readDecryptedFileAsInputStream(path);
            if (is == null) {
                continue;
            }
            try (is) {
                String text = ocr.extractText(is);
                if (StringUtils.hasText(text)) {
                    if (combined.length() > 0) {
                        combined.append("\n");
                    }
                    combined.append(text);
                }
            } catch (Exception e) {
                log.warn("이미지 OCR 실패: documentId={}, path={}, error={}",
                        doc.getId(), path, e.getMessage());
            }
        }
        if (combined.isEmpty()) {
            log.info("이미지 인식에 실패했습니다. Tesseract가 설치되어 있는지 확인해 주세요. documentId={}", doc.getId());
            return null;
        }
        String parsed = Mmpi2ExtractionParser.parse(combined.toString());
        if (parsed == null) {
            log.info("MMPI-2 이미지 OCR 파싱 결과 null: tenantId={}, documentId={}, textLen={}",
                    doc.getTenantId(), doc.getId(), combined.length());
        }
        return parsed;
    }

    /** 동기 추출 전용: 추출 레코드만 생성 (리포트 생성은 호출자가 수행) */
    private void runExtractionLogic(String tenantId, Long documentId) {
        PsychAssessmentDocument doc =
                documentRepository.findByTenantIdAndId(tenantId, documentId)
                        .orElseThrow(() -> new IllegalArgumentException("문서를 찾을 수 없습니다."));

        String extractedJson = extractMmpi2Json(doc);

        String templateId = null;
        String extractionMode = "GENERIC";
        String ocrEngine = extractedJson != null
                ? (SOURCE_TYPE_SCANNED_IMAGE.equals(doc.getSourceType()) ? "TESS4J_MMPI2" : "PDFBOX_MMPI2")
                : "UNCONFIGURED";

        PsychAssessmentExtraction extraction = PsychAssessmentExtraction.builder()
                .tenantId(tenantId).documentId(doc.getId()).templateId(templateId)
                .extractionMode(extractionMode).ocrEngine(ocrEngine).ocrConfidence(null)
                .extractedJson(extractedJson)
                .validationJson("{\"warnings\":[\"OCR/템플릿 추출이 아직 구성되지 않았습니다.\"],\"errors\":[]}")
                .status(PsychAssessmentExtractionStatus.NEEDS_REVIEW).build();

        PsychAssessmentExtraction savedExtraction = extractionRepository.save(extraction);

        var validation = validationService.validate(savedExtraction, java.util.List.of());
        savedExtraction.setValidationJson(validation.validationJson());
        savedExtraction.setStatus(
                validation.needsReview() ? PsychAssessmentExtractionStatus.NEEDS_REVIEW
                        : PsychAssessmentExtractionStatus.DONE);
        extractionRepository.save(savedExtraction);

        doc.setStatus(PsychAssessmentDocumentStatus.OCR_DONE);
        documentRepository.save(doc);

        log.info("Psych extraction created (MVP): tenantId={}, documentId={}, status={}",
                tenantId, documentId, savedExtraction.getStatus());
    }

    private String extractMmpi2Json(PsychAssessmentDocument doc) {
        if (SOURCE_TYPE_SCANNED_IMAGE.equals(doc.getSourceType())) {
            return tryExtractMmpi2FromImages(encryptedFileStorageService, tesseractOcrService, doc);
        }
        return tryExtractMmpi2FromPdf(encryptedFileStorageService, doc);
    }

    @Service
    @RequiredArgsConstructor
    static class PsychAssessmentExtractionRunner {
        private final PsychAssessmentDocumentRepository documentRepository;
        private final PsychAssessmentExtractionRepository extractionRepository;
        private final com.coresolution.consultation.assessment.service.PsychAssessmentValidationService validationService;
        private final com.coresolution.consultation.assessment.service.PsychAssessmentReportService reportService;
        private final EncryptedFileStorageService encryptedFileStorageService;
        private final TesseractOcrService tesseractOcrService;

        @Async
        public void processAsync(String tenantId, Long documentId) {
            try {
                TenantContextHolder.setTenantId(tenantId);
                PsychAssessmentDocument doc =
                        documentRepository.findByTenantIdAndId(tenantId, documentId)
                                .orElseThrow(() -> new IllegalArgumentException("문서를 찾을 수 없습니다."));

                String extractedJson = SOURCE_TYPE_SCANNED_IMAGE.equals(doc.getSourceType())
                        ? tryExtractMmpi2FromImages(encryptedFileStorageService, tesseractOcrService, doc)
                        : tryExtractMmpi2FromPdf(encryptedFileStorageService, doc);

                String templateId = null;
                String extractionMode = "GENERIC";
                String ocrEngine = extractedJson != null
                        ? (SOURCE_TYPE_SCANNED_IMAGE.equals(doc.getSourceType()) ? "TESS4J_MMPI2" : "PDFBOX_MMPI2")
                        : "UNCONFIGURED";

                PsychAssessmentExtraction extraction = PsychAssessmentExtraction.builder()
                        .tenantId(tenantId).documentId(doc.getId()).templateId(templateId)
                        .extractionMode(extractionMode).ocrEngine(ocrEngine).ocrConfidence(null)
                        .extractedJson(extractedJson)
                        .validationJson("{\"warnings\":[\"OCR/템플릿 추출이 아직 구성되지 않았습니다.\"],\"errors\":[]}")
                        .status(PsychAssessmentExtractionStatus.NEEDS_REVIEW).build();

                PsychAssessmentExtraction savedExtraction = extractionRepository.save(extraction);

                var validation = validationService.validate(savedExtraction, java.util.List.of());
                savedExtraction.setValidationJson(validation.validationJson());
                savedExtraction.setStatus(
                        validation.needsReview() ? PsychAssessmentExtractionStatus.NEEDS_REVIEW
                                : PsychAssessmentExtractionStatus.DONE);
                extractionRepository.save(savedExtraction);

                doc.setStatus(PsychAssessmentDocumentStatus.OCR_DONE);
                documentRepository.save(doc);

                log.info("Psych extraction created (MVP): tenantId={}, documentId={}, status={}",
                        tenantId, documentId, savedExtraction.getStatus());

                try {
                    Long reportId = reportService.generateLatestReport(documentId);
                    log.info("Psych auto report generated: documentId={}, reportId={}", documentId, reportId);
                } catch (Exception e) {
                    log.warn("Psych auto report generation failed for documentId={} (user can trigger manually): {}",
                            documentId, e.getMessage());
                }
            } finally {
                TenantContextHolder.clear();
            }
        }
    }

    // legacy: runner로 이동됨
    public void processAsync(Long documentId) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        PsychAssessmentDocument doc = documentRepository.findByTenantIdAndId(tenantId, documentId)
                .orElseThrow(() -> new IllegalArgumentException("문서를 찾을 수 없습니다."));

        // 템플릿 감지(placeholder): 추후 병원별 템플릿 매칭로직 연결
        String templateId = null;
        String extractionMode = "GENERIC";
        String ocrEngine = "UNCONFIGURED";

        PsychAssessmentExtraction extraction = PsychAssessmentExtraction.builder()
                .tenantId(tenantId).documentId(doc.getId()).templateId(templateId)
                .extractionMode(extractionMode).ocrEngine(ocrEngine).ocrConfidence(null)
                .extractedJson(null)
                .validationJson("{\"warnings\":[\"OCR/템플릿 추출이 아직 구성되지 않았습니다.\"],\"errors\":[]}")
                .status(PsychAssessmentExtractionStatus.NEEDS_REVIEW).build();

        PsychAssessmentExtraction savedExtraction = extractionRepository.save(extraction);

        // MVP 표준화/정규화: 아직 추출이 없는 단계이므로 빈 metrics를 저장하지 않음.
        // 검증 결과만 갱신해 "사람 검수 필요" 상태를 명확히 함.
        var validation = validationService.validate(savedExtraction, java.util.List.of());
        savedExtraction.setValidationJson(validation.validationJson());
        savedExtraction
                .setStatus(validation.needsReview() ? PsychAssessmentExtractionStatus.NEEDS_REVIEW
                        : PsychAssessmentExtractionStatus.DONE);
        extractionRepository.save(savedExtraction);

        doc.setStatus(PsychAssessmentDocumentStatus.OCR_DONE);
        documentRepository.save(doc);

        log.info("Psych extraction created (MVP): tenantId={}, documentId={}, status={}", tenantId,
                documentId, savedExtraction.getStatus());
    }
}


