package com.coresolution.consultation.assessment.integration;

import static org.assertj.core.api.Assertions.assertThat;

import com.coresolution.consultation.ConsultationManagementApplication;
import com.coresolution.consultation.assessment.dto.PsychAssessmentUploadResponse;
import com.coresolution.consultation.assessment.entity.PsychAssessmentDocument;
import com.coresolution.consultation.assessment.entity.PsychAssessmentExtraction;
import com.coresolution.consultation.assessment.model.PsychAssessmentType;
import com.coresolution.consultation.assessment.repository.PsychAssessmentDocumentRepository;
import com.coresolution.consultation.assessment.repository.PsychAssessmentExtractionRepository;
import com.coresolution.consultation.assessment.service.PsychAssessmentExtractionService;
import com.coresolution.consultation.assessment.service.PsychAssessmentIngestService;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.domain.Tenant;
import com.coresolution.core.repository.TenantRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.List;
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
import org.springframework.util.StringUtils;

import javax.imageio.ImageIO;

import net.sourceforge.tess4j.Tesseract;

/**
 * 심리검사 이미지 업로드 통합 테스트.
 * 설계서 §3.2 I1~I4: 1장/N장 문서 생성, 동기 추출(OCR), Tesseract 없을 때 스킵.
 *
 * @author CoreSolution
 * @since 2026-03-02
 * @see docs/psych-assessment/PSYCH_UPLOAD_INTEGRATION_TEST_DESIGN.md
 */
@SpringBootTest(classes = ConsultationManagementApplication.class)
@ActiveProfiles("test")
@Transactional
@DisplayName("PsychAssessment 이미지 업로드 통합 테스트")
class PsychAssessmentImageUploadIntegrationTest {

    private static final String SOURCE_TYPE_SCANNED_IMAGE = "SCANNED_IMAGE";
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
        // tenant_id VARCHAR(36) — 접두어 없이 UUID만 사용
        tenantId = UUID.randomUUID().toString();
        Tenant t = Tenant.builder()
                .tenantId(tenantId)
                .name("이미지 테스트 테넌트")
                .businessType("CONSULTATION")
                .status(Tenant.TenantStatus.ACTIVE)
                .contactEmail("img@test.com")
                .build();
        tenantRepository.save(t);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    /**
     * Tesseract 사용 가능 여부.
     * PSYCH_ASSESSMENT_TESSERACT_SKIP_TESTS=true 시 false.
     * 소형 이미지로 Tesseract.doOCR 호출 시 TesseractException이 나면 false.
     */
    private boolean isTesseractAvailable() {
        if ("true".equalsIgnoreCase(System.getenv("PSYCH_ASSESSMENT_TESSERACT_SKIP_TESTS"))) {
            return false;
        }
        try {
            ClassPathResource img = new ClassPathResource("psych-assessment/sample-image.jpg");
            if (!img.exists()) {
                return false;
            }
            java.awt.image.BufferedImage image = ImageIO.read(img.getInputStream());
            if (image == null) {
                return false;
            }
            Tesseract tesseract = new Tesseract();
            tesseract.setLanguage("kor");
            String envPrefix = System.getenv("TESSDATA_PREFIX");
            if (StringUtils.hasText(envPrefix)) {
                String datapath = envPrefix.endsWith("tessdata") ? envPrefix : envPrefix + "/tessdata";
                tesseract.setDatapath(datapath);
            }
            tesseract.doOCR(image);
            return true;
        } catch (Throwable t) {
            // Tesseract 미설치 시 UnsatisfiedLinkError, NoClassDefFoundError 등
            return false;
        }
    }

    private static MockMultipartFile createImageMultipart(String resourceName, String filename, String contentType)
            throws Exception {
        ClassPathResource resource = new ClassPathResource("psych-assessment/" + resourceName);
        if (!resource.exists()) {
            return null;
        }
        byte[] bytes = StreamUtils.copyToByteArray(resource.getInputStream());
        return new MockMultipartFile("file", filename, contentType, bytes);
    }

    @Test
    @DisplayName("I1: 이미지 1장 업로드 시 문서 생성 및 storagePath JSON 배열")
    void i1_uploadOneImage_documentCreatedWithStoragePathArray() throws Exception {
        // Given - 테넌트, 소형 JPEG 1개
        org.junit.jupiter.api.Assumptions.assumeTrue(
                new ClassPathResource("psych-assessment/sample-image.jpg").exists(),
                "psych-assessment/sample-image.jpg 리소스 없음, 스킵");
        MockMultipartFile imageFile = createImageMultipart("sample-image.jpg", "sample-image.jpg", "image/jpeg");
        org.junit.jupiter.api.Assumptions.assumeTrue(imageFile != null && !imageFile.isEmpty());
        TenantContextHolder.setTenantId(tenantId);

        // When
        PsychAssessmentUploadResponse response = ingestService.uploadScannedImages(
                PsychAssessmentType.MMPI, List.of(imageFile), null, null);

        // Then
        assertThat(response.getDocumentId()).isNotNull();
        assertThat(response.getTenantId()).isEqualTo(tenantId);
        PsychAssessmentDocument doc = documentRepository.findByTenantIdAndId(tenantId, response.getDocumentId())
                .orElse(null);
        assertThat(doc).isNotNull();
        assertThat(doc.getSourceType()).isEqualTo(SOURCE_TYPE_SCANNED_IMAGE);
        assertThat(doc.getStoragePath()).isNotBlank();
        assertThat(doc.getStoragePath().trim()).startsWith("[");
        assertThat(doc.getStoragePath().trim()).endsWith("]");
        List<String> paths = OBJECT_MAPPER.readValue(doc.getStoragePath(), new TypeReference<List<String>>() {});
        assertThat(paths).hasSize(1);
    }

    @Test
    @DisplayName("I2: 이미지 N장 업로드 시 문서 1건·경로 순서 유지")
    void i2_uploadMultipleImages_documentOneWithOrderedPaths() throws Exception {
        // Given - 테넌트, JPEG/PNG 2장 (순서 고정)
        org.junit.jupiter.api.Assumptions.assumeTrue(
                new ClassPathResource("psych-assessment/sample-image.jpg").exists(),
                "sample-image.jpg 없음, 스킵");
        org.junit.jupiter.api.Assumptions.assumeTrue(
                new ClassPathResource("psych-assessment/sample-image2.png").exists(),
                "sample-image2.png 없음, 스킵");
        MockMultipartFile img1 = createImageMultipart("sample-image.jpg", "first.jpg", "image/jpeg");
        MockMultipartFile img2 = createImageMultipart("sample-image2.png", "second.png", "image/png");
        org.junit.jupiter.api.Assumptions.assumeTrue(img1 != null && img2 != null);
        TenantContextHolder.setTenantId(tenantId);
        List<org.springframework.web.multipart.MultipartFile> filesOrdered = List.of(img1, img2);

        // When
        PsychAssessmentUploadResponse response = ingestService.uploadScannedImages(
                PsychAssessmentType.MMPI, filesOrdered, null, null);

        // Then - document 1건, storagePath JSON 배열 길이 = N, 순서 동일
        assertThat(response.getDocumentId()).isNotNull();
        PsychAssessmentDocument doc = documentRepository.findByTenantIdAndId(tenantId, response.getDocumentId())
                .orElse(null);
        assertThat(doc).isNotNull();
        List<String> paths = OBJECT_MAPPER.readValue(doc.getStoragePath(), new TypeReference<List<String>>() {});
        assertThat(paths).hasSize(2);
        assertThat(paths.get(0)).isNotEqualTo(paths.get(1));
    }

    @Test
    @DisplayName("I3: 이미지 업로드 후 동기 추출 시 OCR → TESS4J_MMPI2 (Tesseract 있을 때)")
    void i3_afterUpload_ensureExtractionSync_createsExtractionWithTesseract() throws Exception {
        // Given - I1 또는 I2로 생성된 document, Tesseract 사용 가능
        org.junit.jupiter.api.Assumptions.assumeTrue(isTesseractAvailable(),
                "Tesseract 미설치 또는 PSYCH_ASSESSMENT_TESSERACT_SKIP_TESTS=true, 스킵");
        org.junit.jupiter.api.Assumptions.assumeTrue(
                new ClassPathResource("psych-assessment/sample-image.jpg").exists(),
                "sample-image.jpg 없음, 스킵");
        MockMultipartFile imageFile = createImageMultipart("sample-image.jpg", "sample-image.jpg", "image/jpeg");
        org.junit.jupiter.api.Assumptions.assumeTrue(imageFile != null && !imageFile.isEmpty());
        TenantContextHolder.setTenantId(tenantId);
        PsychAssessmentUploadResponse response = ingestService.uploadScannedImages(
                PsychAssessmentType.MMPI, List.of(imageFile), null, null);
        Long documentId = response.getDocumentId();

        // When - 동기 추출 실행
        extractionService.ensureExtractionSync(tenantId, documentId);

        // Then - PsychAssessmentExtraction 1건, ocrEngine=TESS4J_MMPI2
        PsychAssessmentExtraction ext = extractionRepository
                .findTopByTenantIdAndDocumentIdOrderByCreatedAtDesc(tenantId, documentId)
                .orElse(null);
        assertThat(ext).isNotNull();
        assertThat(ext.getDocumentId()).isEqualTo(documentId);
        assertThat(ext.getOcrEngine()).isEqualTo("TESS4J_MMPI2");
    }

    @Test
    @DisplayName("I4: Tesseract 없을 때 이미지 추출 테스트 스킵")
    void i4_whenTesseractUnavailable_testSkipped() {
        // 조건부: Tesseract 미설치 또는 tessdata kor 없음 시 이 테스트는 Assume으로 스킵됨
        boolean available = isTesseractAvailable();
        org.junit.jupiter.api.Assumptions.assumeTrue(available,
                "Tesseract 미설치 또는 tessdata 없음. CI에서는 PSYCH_ASSESSMENT_TESSERACT_SKIP_TESTS=true로 스킵.");
        assertThat(available).as("Tesseract 사용 가능 시 스킵되지 않음").isTrue();
    }
}
