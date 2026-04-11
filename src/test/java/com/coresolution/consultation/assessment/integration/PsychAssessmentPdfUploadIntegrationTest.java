package com.coresolution.consultation.assessment.integration;

import static org.assertj.core.api.Assertions.assertThat;

import com.coresolution.consultation.ConsultationManagementApplication;
import com.coresolution.consultation.assessment.dto.PsychAssessmentUploadResponse;
import com.coresolution.consultation.assessment.entity.PsychAssessmentDocument;
import com.coresolution.consultation.assessment.entity.PsychAssessmentExtraction;
import com.coresolution.consultation.assessment.model.PsychAssessmentType;
import com.coresolution.consultation.assessment.repository.PsychAssessmentDocumentRepository;
import com.coresolution.consultation.assessment.repository.PsychAssessmentExtractionRepository;
import com.coresolution.consultation.assessment.repository.PsychAssessmentReportRepository;
import com.coresolution.consultation.assessment.service.PsychAssessmentExtractionService;
import com.coresolution.consultation.assessment.service.PsychAssessmentIngestService;
import com.coresolution.consultation.assessment.service.PsychAssessmentReportService;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.domain.Tenant;
import com.coresolution.core.repository.TenantRepository;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
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
 * 심리검사 PDF 업로드 통합 테스트.
 * 설계서 §3.1 P1~P4: 문서 생성, 동기 추출, 리포트 생성, 테넌트 격리.
 *
 * @author CoreSolution
 * @since 2026-03-02
 * @see docs/psych-assessment/PSYCH_UPLOAD_INTEGRATION_TEST_DESIGN.md
 */
@SpringBootTest(classes = ConsultationManagementApplication.class)
@ActiveProfiles("test")
@Transactional
@DisplayName("PsychAssessment PDF 업로드 통합 테스트")
class PsychAssessmentPdfUploadIntegrationTest {

    private static final String SOURCE_TYPE_SCANNED_PDF = "SCANNED_PDF";

    @Autowired
    private PsychAssessmentIngestService ingestService;

    @Autowired
    private PsychAssessmentExtractionService extractionService;

    @Autowired
    private PsychAssessmentReportService reportService;

    @Autowired
    private PsychAssessmentDocumentRepository documentRepository;

    @Autowired
    private PsychAssessmentExtractionRepository extractionRepository;

    @Autowired
    private PsychAssessmentReportRepository reportRepository;

    @Autowired
    private TenantRepository tenantRepository;

    private String tenantId1;
    private String tenantId2;

    @BeforeEach
    void setUp() {
        // tenants.tenant_id 는 VARCHAR(36) — 접두사+UUID 조합은 길이 초과하므로 UUID 문자열만 사용
        tenantId1 = UUID.randomUUID().toString();
        tenantId2 = UUID.randomUUID().toString();

        Tenant t1 = Tenant.builder()
                .tenantId(tenantId1)
                .name("PDF 테스트 테넌트 1")
                .businessType("CONSULTATION")
                .status(Tenant.TenantStatus.ACTIVE)
                .contactEmail("pdf1@test.com")
                .build();
        tenantRepository.save(t1);

        Tenant t2 = Tenant.builder()
                .tenantId(tenantId2)
                .name("PDF 테스트 테넌트 2")
                .businessType("CONSULTATION")
                .status(Tenant.TenantStatus.ACTIVE)
                .contactEmail("pdf2@test.com")
                .build();
        tenantRepository.save(t2);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    private static MockMultipartFile createPdfMultipart() throws Exception {
        ClassPathResource resource = new ClassPathResource("psych-assessment/sample.pdf");
        if (!resource.exists()) {
            return null;
        }
        byte[] bytes = StreamUtils.copyToByteArray(resource.getInputStream());
        return new MockMultipartFile("file", "sample.pdf", "application/pdf", bytes);
    }

    @Test
    @DisplayName("P1: PDF 1개 업로드 시 문서 생성 및 저장 경로 반환")
    void p1_uploadPdf_documentCreatedAndStoragePathReturned() throws Exception {
        // Given - 테넌트 설정, 소형 PDF 리소스
        org.junit.jupiter.api.Assumptions.assumeTrue(
                new ClassPathResource("psych-assessment/sample.pdf").exists(),
                "psych-assessment/sample.pdf 리소스 없음, 스킵");
        MockMultipartFile pdfFile = createPdfMultipart();
        org.junit.jupiter.api.Assumptions.assumeTrue(pdfFile != null && !pdfFile.isEmpty());
        TenantContextHolder.setTenantId(tenantId1);

        // When
        PsychAssessmentUploadResponse response = ingestService.uploadScannedPdf(
                PsychAssessmentType.MMPI, pdfFile, null, null);

        // Then
        assertThat(response.getDocumentId()).isNotNull();
        assertThat(response.getTenantId()).isEqualTo(tenantId1);
        assertThat(response.getAssessmentType()).isEqualTo(PsychAssessmentType.MMPI);

        PsychAssessmentDocument doc = documentRepository.findByTenantIdAndId(tenantId1, response.getDocumentId())
                .orElse(null);
        assertThat(doc).isNotNull();
        assertThat(doc.getSourceType()).isEqualTo(SOURCE_TYPE_SCANNED_PDF);
        assertThat(doc.getStoragePath()).isNotBlank();
        // storagePath는 단일 문자열(JSON 배열 아님)
        assertThat(doc.getStoragePath().trim()).doesNotStartWith("[");
    }

    @Test
    @DisplayName("P2: PDF 업로드 후 동기 추출 호출 시 Extraction 레코드 생성")
    void p2_afterUpload_ensureExtractionSync_createsExtraction() throws Exception {
        // Given - P1으로 문서 생성 직후
        org.junit.jupiter.api.Assumptions.assumeTrue(
                new ClassPathResource("psych-assessment/sample.pdf").exists(),
                "psych-assessment/sample.pdf 리소스 없음, 스킵");
        MockMultipartFile pdfFile = createPdfMultipart();
        org.junit.jupiter.api.Assumptions.assumeTrue(pdfFile != null && !pdfFile.isEmpty());
        TenantContextHolder.setTenantId(tenantId1);
        PsychAssessmentUploadResponse response = ingestService.uploadScannedPdf(
                PsychAssessmentType.MMPI, pdfFile, null, null);
        Long documentId = response.getDocumentId();
        assertThat(documentId).isNotNull();

        // When - 동기 추출 (비동기 enqueue 대신 ensureExtractionSync로 검증)
        extractionService.ensureExtractionSync(tenantId1, documentId);

        // Then - 추출 레코드 존재, documentId 일치. 소형 PDF는 MMPI 텍스트 없어 파싱 null 시 ocrEngine=UNCONFIGURED
        PsychAssessmentExtraction ext = extractionRepository
                .findTopByTenantIdAndDocumentIdOrderByCreatedAtDesc(tenantId1, documentId)
                .orElse(null);
        assertThat(ext).isNotNull();
        assertThat(ext.getDocumentId()).isEqualTo(documentId);
        assertThat(ext.getOcrEngine()).isIn("PDFBOX_MMPI2", "UNCONFIGURED");
    }

    @Test
    @DisplayName("P3: PDF 업로드·추출 후 리포트 생성 시 reportId 반환")
    void p3_afterExtraction_generateReport_returnsReportId() throws Exception {
        // Given - P2까지 완료된 documentId
        org.junit.jupiter.api.Assumptions.assumeTrue(
                new ClassPathResource("psych-assessment/sample.pdf").exists(),
                "psych-assessment/sample.pdf 리소스 없음, 스킵");
        MockMultipartFile pdfFile = createPdfMultipart();
        org.junit.jupiter.api.Assumptions.assumeTrue(pdfFile != null && !pdfFile.isEmpty());
        TenantContextHolder.setTenantId(tenantId1);
        PsychAssessmentUploadResponse response = ingestService.uploadScannedPdf(
                PsychAssessmentType.MMPI, pdfFile, null, null);
        Long documentId = response.getDocumentId();
        extractionService.ensureExtractionSync(tenantId1, documentId);

        // When
        Long reportId = reportService.generateLatestReport(documentId);

        // Then
        assertThat(reportId).isNotNull().isPositive();
        assertThat(reportRepository.findTopByTenantIdAndDocumentIdOrderByCreatedAtDesc(tenantId1, documentId))
                .isPresent();
    }

    @Test
    @DisplayName("P4: PDF 업로드 시 tenantId 격리")
    void p4_uploadPdf_tenantIsolation() throws Exception {
        // Given - tenantA, tenantB
        org.junit.jupiter.api.Assumptions.assumeTrue(
                new ClassPathResource("psych-assessment/sample.pdf").exists(),
                "psych-assessment/sample.pdf 리소스 없음, 스킵");
        MockMultipartFile pdfFile = createPdfMultipart();
        org.junit.jupiter.api.Assumptions.assumeTrue(pdfFile != null && !pdfFile.isEmpty());

        // When - 각 테넌트로 PDF 업로드
        TenantContextHolder.setTenantId(tenantId1);
        PsychAssessmentUploadResponse resp1 = ingestService.uploadScannedPdf(
                PsychAssessmentType.MMPI, pdfFile, null, null);

        TenantContextHolder.setTenantId(tenantId2);
        MockMultipartFile pdfFile2 = createPdfMultipart();
        PsychAssessmentUploadResponse resp2 = ingestService.uploadScannedPdf(
                PsychAssessmentType.MMPI, pdfFile2, null, null);

        // Then - document 각각 해당 tenantId만 가짐, countByTenantId 격리
        assertThat(resp1.getTenantId()).isEqualTo(tenantId1);
        assertThat(resp2.getTenantId()).isEqualTo(tenantId2);
        PsychAssessmentDocument doc1 = documentRepository.findByTenantIdAndId(tenantId1, resp1.getDocumentId())
                .orElse(null);
        PsychAssessmentDocument doc2 = documentRepository.findByTenantIdAndId(tenantId2, resp2.getDocumentId())
                .orElse(null);
        assertThat(doc1).isNotNull();
        assertThat(doc2).isNotNull();
        assertThat(doc1.getTenantId()).isEqualTo(tenantId1);
        assertThat(doc2.getTenantId()).isEqualTo(tenantId2);

        long count1 = documentRepository.countByTenantId(tenantId1);
        long count2 = documentRepository.countByTenantId(tenantId2);
        assertThat(count1).isEqualTo(1L);
        assertThat(count2).isEqualTo(1L);
    }
}
