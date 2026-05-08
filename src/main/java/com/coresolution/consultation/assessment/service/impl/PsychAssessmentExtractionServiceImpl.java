package com.coresolution.consultation.assessment.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

import com.coresolution.consultation.assessment.entity.PsychAssessmentDocument;
import com.coresolution.consultation.assessment.entity.PsychAssessmentExtraction;
import com.coresolution.consultation.assessment.model.PsychAssessmentDocumentStatus;
import com.coresolution.consultation.assessment.model.PsychAssessmentExtractionStatus;
import com.coresolution.consultation.assessment.constants.PsychAssessmentExtractionReasonCodes;
import com.coresolution.consultation.assessment.model.PsychAssessmentType;
import com.coresolution.consultation.assessment.parser.Mmpi2ExtractionParser;
import com.coresolution.consultation.assessment.parser.TciExtractionParser;
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
     * MMPI/TCI 문서의 저장된 PDF에서 평문 추출.
     *
     * @param storage 저장소
     * @param doc     문서
     * @return 텍스트 또는 null(경로 없음·읽기 실패)
     */
    private static String tryReadPlainTextFromPdf(EncryptedFileStorageService storage,
            PsychAssessmentDocument doc) {
        if (doc.getAssessmentType() != PsychAssessmentType.MMPI
                && doc.getAssessmentType() != PsychAssessmentType.TCI) {
            return null;
        }
        if (!StringUtils.hasText(doc.getStoragePath())) {
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
                log.debug("Psych PDF 텍스트 추출: type={}, tenantId={}, documentId={}, textLen={}, sample={}",
                        doc.getAssessmentType(), doc.getTenantId(), doc.getId(), textLen,
                        text != null ? text.substring(0, Math.min(800, textLen)) : "");
                return text;
            }
        } catch (Exception e) {
            log.warn("Psych PDF 추출 실패: type={}, tenantId={}, documentId={}, error={}",
                    doc.getAssessmentType(), doc.getTenantId(), doc.getId(), e.getMessage());
            return null;
        }
    }

    /**
     * SCANNED_IMAGE: storagePath JSON 배열 경로들을 순서대로 OCR하여 평문 결합.
     *
     * @return 결합 텍스트(비어 있으면 빈 문자열)
     */
    private static String tryReadPlainTextFromImages(EncryptedFileStorageService storage,
            TesseractOcrService ocr, PsychAssessmentDocument doc) {
        if (doc.getAssessmentType() != PsychAssessmentType.MMPI
                && doc.getAssessmentType() != PsychAssessmentType.TCI) {
            return "";
        }
        if (!StringUtils.hasText(doc.getStoragePath())) {
            return "";
        }
        List<String> paths;
        try {
            paths = OBJECT_MAPPER.readValue(doc.getStoragePath(), new TypeReference<List<String>>() {});
        } catch (Exception e) {
            log.debug("storagePath JSON 파싱 실패: documentId={}", doc.getId());
            return "";
        }
        if (paths == null || paths.isEmpty()) {
            return "";
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
            log.info("이미지 인식에 실패했습니다. documentId={}", doc.getId());
        }
        return combined.toString();
    }

    /**
     * MMPI: 기존과 동일하게 파싱 실패 시 null (extracted_json 없음 → 재추출 유지).
     */
    private static String extractMmpiJsonFromPlainText(String plainText, PsychAssessmentDocument doc) {
        if (!StringUtils.hasText(plainText)) {
            return null;
        }
        String parsed = Mmpi2ExtractionParser.parse(plainText);
        if (parsed == null) {
            log.info("MMPI 파싱 결과 null: tenantId={}, documentId={}, textLen={}",
                    doc.getTenantId(), doc.getId(), plainText.length());
        }
        return parsed;
    }

    private static String tciJsonEmptyReason(String reasonCode) {
        try {
            ObjectNode root = OBJECT_MAPPER.createObjectNode();
            root.putArray("metrics");
            root.put("reason", reasonCode);
            return OBJECT_MAPPER.writeValueAsString(root);
        } catch (Exception e) {
            return "{\"metrics\":[],\"reason\":\"" + reasonCode + "\"}";
        }
    }

    private static String tciJsonMergeReason(String parsedJson, String reasonCode) {
        try {
            JsonNode tree = OBJECT_MAPPER.readTree(parsedJson);
            if (!(tree instanceof ObjectNode obj)) {
                return parsedJson;
            }
            obj.put("reason", reasonCode);
            return OBJECT_MAPPER.writeValueAsString(obj);
        } catch (Exception e) {
            return parsedJson;
        }
    }

    /**
     * TCI: 항상 JSON 객체 문자열(metrics + 선택 reason).
     */
    private static String extractTciJsonFromPlainText(String plainText, PsychAssessmentDocument doc,
            boolean imageFlow, boolean tessDatapathConfigured) {
        if (!StringUtils.hasText(plainText)) {
            if (imageFlow) {
                return tciJsonEmptyReason(tessDatapathConfigured
                        ? PsychAssessmentExtractionReasonCodes.OCR_NO_TEXT
                        : PsychAssessmentExtractionReasonCodes.OCR_UNCONFIGURED);
            }
            return tciJsonEmptyReason(PsychAssessmentExtractionReasonCodes.TCI_NO_TEXT);
        }
        String parsed = TciExtractionParser.parse(plainText);
        if (parsed != null) {
            if (TciExtractionParser.isPartialResult(parsed)) {
                return tciJsonMergeReason(parsed, PsychAssessmentExtractionReasonCodes.TCI_PARSE_PARTIAL);
            }
            return parsed;
        }
        if (TciExtractionParser.looksLikeTciReport(plainText)) {
            log.info(
                    "TCI 본문은 감지되었으나 척도 파싱 실패(metrics=0): documentId={}, {}",
                    doc.getId(), TciExtractionParser.diagnosticSummary(plainText));
            return tciJsonEmptyReason(PsychAssessmentExtractionReasonCodes.TCI_LAYOUT_UNMATCHED);
        }
        return tciJsonEmptyReason(PsychAssessmentExtractionReasonCodes.TCI_NO_TEXT);
    }

    /**
     * 문서 유형·소스에 따라 extracted_json 생성 (Runner·동기 추출 공용).
     */
    static String extractAssessmentJson(PsychAssessmentDocument doc,
            EncryptedFileStorageService storage,
            TesseractOcrService ocrService) {
        PsychAssessmentType type = doc.getAssessmentType();
        boolean imageFlow = SOURCE_TYPE_SCANNED_IMAGE.equals(doc.getSourceType());
        if (type == PsychAssessmentType.MMPI) {
            String plain = imageFlow
                    ? tryReadPlainTextFromImages(storage, ocrService, doc)
                    : tryReadPlainTextFromPdf(storage, doc);
            if (!StringUtils.hasText(plain)) {
                return null;
            }
            return extractMmpiJsonFromPlainText(plain, doc);
        }
        if (type == PsychAssessmentType.TCI) {
            String plain = imageFlow
                    ? tryReadPlainTextFromImages(storage, ocrService, doc)
                    : tryReadPlainTextFromPdf(storage, doc);
            return extractTciJsonFromPlainText(
                    plain != null ? plain : "",
                    doc,
                    imageFlow,
                    ocrService.isTesseractDatapathConfigured());
        }
        return null;
    }

    private static String resolveOcrEngineLabel(PsychAssessmentDocument doc) {
        PsychAssessmentType t = doc.getAssessmentType();
        String suffix = t == PsychAssessmentType.TCI ? "TCI" : "MMPI2";
        if (SOURCE_TYPE_SCANNED_IMAGE.equals(doc.getSourceType())) {
            return "TESS4J_" + suffix;
        }
        return "PDFBOX_" + suffix;
    }

    /** 동기 추출 전용: 추출 레코드만 생성 (리포트 생성은 호출자가 수행) */
    private void runExtractionLogic(String tenantId, Long documentId) {
        PsychAssessmentDocument doc =
                documentRepository.findByTenantIdAndId(tenantId, documentId)
                        .orElseThrow(() -> new IllegalArgumentException("문서를 찾을 수 없습니다."));

        String extractedJson = extractAssessmentJson(doc, encryptedFileStorageService, tesseractOcrService);

        String templateId = null;
        String extractionMode = "GENERIC";
        String ocrEngine = extractedJson != null ? resolveOcrEngineLabel(doc) : "UNCONFIGURED";

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

                String extractedJson = extractAssessmentJson(doc, encryptedFileStorageService,
                        tesseractOcrService);

                String templateId = null;
                String extractionMode = "GENERIC";
                String ocrEngine = extractedJson != null ? resolveOcrEngineLabel(doc) : "UNCONFIGURED";

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


