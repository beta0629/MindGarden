package com.coresolution.consultation.assessment.integration;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import com.coresolution.consultation.ConsultationManagementApplication;
import com.coresolution.consultation.assessment.dto.PsychAssessmentUploadResponse;
import com.coresolution.consultation.assessment.entity.PsychAssessmentDocument;
import com.coresolution.consultation.assessment.entity.PsychAssessmentExtraction;
import com.coresolution.consultation.assessment.model.PsychAssessmentDocumentStatus;
import com.coresolution.consultation.assessment.model.PsychAssessmentExtractionStatus;
import com.coresolution.consultation.assessment.model.PsychAssessmentType;
import com.coresolution.consultation.assessment.parser.TciExtractionParser;
import com.coresolution.consultation.assessment.repository.PsychAssessmentDocumentRepository;
import com.coresolution.consultation.assessment.repository.PsychAssessmentExtractionRepository;
import com.coresolution.consultation.assessment.service.PsychAssessmentExtractionService;
import com.coresolution.consultation.assessment.service.PsychAssessmentIngestService;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.domain.Tenant;
import com.coresolution.core.repository.TenantRepository;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StreamUtils;

/**
 * TCI·MMPI 기준 PDF 회귀 테스트. 리소스는 로컬/CI에서 선택적으로만 배치한다(커밋 금지·민감 실데이터 금지).
 * 파일이 없으면 {@link Assumptions#assumeTrue(boolean, String)}으로 녹색 스킵.
 *
 * @author CoreSolution
 * @since 2026-05-08
 * @see docs/psych-assessment/PSYCH_UPLOAD_INTEGRATION_TEST_DESIGN.md
 */
@SpringBootTest(classes = ConsultationManagementApplication.class)
@ActiveProfiles("test")
@Transactional
@DisplayName("PsychAssessment TCI/MMPI baseline PDF 회귀")
class PsychAssessmentBaselinePdfRegressionIntegrationTest {

    private static final String TCI_BASELINE_CLASSPATH = "psych-assessment/tci-baseline.pdf";
    private static final String MMPI_BASELINE_CLASSPATH = "psych-assessment/mmpi-baseline.pdf";
    private static final String SOURCE_TYPE_SCANNED_PDF = "SCANNED_PDF";
    private static final List<String> TCI_REQUIRED_SCALE_CODES =
            List.of("NS", "HA", "RD", "P", "SD", "C", "ST");
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    @Autowired
    private PsychAssessmentIngestService ingestService;

    @Autowired
    private PsychAssessmentExtractionService extractionService;

    @Autowired
    private PsychAssessmentDocumentRepository documentRepository;

    @Autowired
    private PsychAssessmentExtractionRepository extractionRepository;

    @Autowired
    private TenantRepository tenantRepository;

    private String tenantId;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID().toString();
        Tenant tenant = Tenant.builder()
                .tenantId(tenantId)
                .name("Baseline PDF 회귀 테넌트")
                .businessType("CONSULTATION")
                .status(Tenant.TenantStatus.ACTIVE)
                .contactEmail("baseline-pdf@test.com")
                .build();
        tenantRepository.save(tenant);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    private static boolean baselinePdfOnClasspath(String classpathLocation) {
        return new ClassPathResource(classpathLocation).exists();
    }

    private static MockMultipartFile loadPdfMultipart(String classpathLocation, String originalName)
            throws Exception {
        ClassPathResource resource = new ClassPathResource(classpathLocation);
        byte[] bytes = StreamUtils.copyToByteArray(resource.getInputStream());
        return new MockMultipartFile("file", originalName, "application/pdf", bytes);
    }

    private static String extractPdfPlainText(String classpathLocation) throws Exception {
        ClassPathResource resource = new ClassPathResource(classpathLocation);
        try (InputStream inputStream = resource.getInputStream()) {
            byte[] bytes = StreamUtils.copyToByteArray(inputStream);
            try (PDDocument document = Loader.loadPDF(bytes)) {
                return new PDFTextStripper().getText(document);
            }
        }
    }

    private static void assertTciCanonicalMetrics(JsonNode root) {
        JsonNode metrics = root.path("metrics");
        assertThat(metrics.isArray()).isTrue();
        assertThat(metrics.size()).isEqualTo(TCI_REQUIRED_SCALE_CODES.size());

        List<String> scaleCodes = new ArrayList<>();
        for (JsonNode metric : metrics) {
            scaleCodes.add(metric.path("scaleCode").asText());
            assertThat(metric.path("percentile").isNumber()).isTrue();
            assertThat(metric.path("percentile").asDouble()).isBetween(0.0, 100.0);
        }
        assertThat(scaleCodes).containsExactlyElementsOf(TCI_REQUIRED_SCALE_CODES);
    }

    @Test
    @DisplayName("[TCI_BASELINE_PDF] PDFBox 평문 파싱 시 7척도·백분위 회귀")
    void tciBaseline_pdfBoxPlainTextParserRegression() throws Exception {
        Assumptions.assumeTrue(
                baselinePdfOnClasspath(TCI_BASELINE_CLASSPATH),
                "[TCI_BASELINE_PDF] " + TCI_BASELINE_CLASSPATH + " 없음 — 스킵(선택 아티팩트)");

        String plainText = extractPdfPlainText(TCI_BASELINE_CLASSPATH);
        assertThat(plainText).isNotBlank();

        String parsedJson = TciExtractionParser.parse(plainText);
        assertThat(parsedJson).isNotBlank();

        JsonNode root = OBJECT_MAPPER.readTree(parsedJson);
        assertTciCanonicalMetrics(root);
    }

    @Test
    @DisplayName("[TCI_BASELINE_PDF] 업로드·동기 추출 후 문서 OCR_DONE·extraction·metrics 회귀")
    void tciBaseline_uploadSyncExtraction_documentAndMetricsRegression() throws Exception {
        Assumptions.assumeTrue(
                baselinePdfOnClasspath(TCI_BASELINE_CLASSPATH),
                "[TCI_BASELINE_PDF] " + TCI_BASELINE_CLASSPATH + " 없음 — 스킵(선택 아티팩트)");

        MockMultipartFile pdf = loadPdfMultipart(TCI_BASELINE_CLASSPATH, "tci-baseline.pdf");
        TenantContextHolder.setTenantId(tenantId);

        PsychAssessmentUploadResponse response =
                ingestService.uploadScannedPdf(PsychAssessmentType.TCI, pdf, null, null);
        Long documentId = response.getDocumentId();
        assertThat(documentId).isNotNull();

        PsychAssessmentDocument afterUpload =
                documentRepository.findByTenantIdAndId(tenantId, documentId).orElseThrow();
        assertThat(afterUpload.getAssessmentType()).isEqualTo(PsychAssessmentType.TCI);
        assertThat(afterUpload.getSourceType()).isEqualTo(SOURCE_TYPE_SCANNED_PDF);
        assertThat(afterUpload.getStatus()).isEqualTo(PsychAssessmentDocumentStatus.OCR_PENDING);

        extractionService.ensureExtractionSync(tenantId, documentId);

        PsychAssessmentDocument afterExtract =
                documentRepository.findByTenantIdAndId(tenantId, documentId).orElseThrow();
        assertThat(afterExtract.getStatus()).isEqualTo(PsychAssessmentDocumentStatus.OCR_DONE);

        PsychAssessmentExtraction ext = extractionRepository
                .findTopByTenantIdAndDocumentIdOrderByCreatedAtDesc(tenantId, documentId)
                .orElseThrow();
        assertThat(ext.getDocumentId()).isEqualTo(documentId);
        assertThat(ext.getOcrEngine()).isEqualTo("PDFBOX_TCI");
        assertThat(ext.getStatus()).isIn(PsychAssessmentExtractionStatus.NEEDS_REVIEW,
                PsychAssessmentExtractionStatus.DONE);
        assertThat(ext.getExtractedJson()).isNotBlank();

        JsonNode root = OBJECT_MAPPER.readTree(ext.getExtractedJson());
        assertTciCanonicalMetrics(root);
    }

    @Test
    @DisplayName("[MMPI_BASELINE_PDF] 업로드·동기 추출 후 문서 OCR_DONE·extraction·metrics 회귀")
    void mmpiBaseline_uploadSyncExtraction_documentAndMetricsRegression() throws Exception {
        Assumptions.assumeTrue(
                baselinePdfOnClasspath(MMPI_BASELINE_CLASSPATH),
                "[MMPI_BASELINE_PDF] " + MMPI_BASELINE_CLASSPATH + " 없음 — 스킵(선택 아티팩트)");

        MockMultipartFile pdf = loadPdfMultipart(MMPI_BASELINE_CLASSPATH, "mmpi-baseline.pdf");
        TenantContextHolder.setTenantId(tenantId);

        PsychAssessmentUploadResponse response =
                ingestService.uploadScannedPdf(PsychAssessmentType.MMPI, pdf, null, null);
        Long documentId = response.getDocumentId();
        assertThat(documentId).isNotNull();

        PsychAssessmentDocument afterUpload =
                documentRepository.findByTenantIdAndId(tenantId, documentId).orElseThrow();
        assertThat(afterUpload.getAssessmentType()).isEqualTo(PsychAssessmentType.MMPI);
        assertThat(afterUpload.getSourceType()).isEqualTo(SOURCE_TYPE_SCANNED_PDF);
        assertThat(afterUpload.getStatus()).isEqualTo(PsychAssessmentDocumentStatus.OCR_PENDING);

        extractionService.ensureExtractionSync(tenantId, documentId);

        PsychAssessmentDocument afterExtract =
                documentRepository.findByTenantIdAndId(tenantId, documentId).orElseThrow();
        assertThat(afterExtract.getStatus()).isEqualTo(PsychAssessmentDocumentStatus.OCR_DONE);

        PsychAssessmentExtraction ext = extractionRepository
                .findTopByTenantIdAndDocumentIdOrderByCreatedAtDesc(tenantId, documentId)
                .orElseThrow();
        assertThat(ext.getDocumentId()).isEqualTo(documentId);
        assertThat(ext.getOcrEngine()).isEqualTo("PDFBOX_MMPI2");
        assertThat(ext.getStatus()).isIn(PsychAssessmentExtractionStatus.NEEDS_REVIEW,
                PsychAssessmentExtractionStatus.DONE);
        assertThat(ext.getExtractedJson()).isNotBlank();

        JsonNode root = OBJECT_MAPPER.readTree(ext.getExtractedJson());
        assertThat(root.path("metrics").isArray()).isTrue();
        assertThat(root.path("metrics").size()).isGreaterThan(0);
    }
}
