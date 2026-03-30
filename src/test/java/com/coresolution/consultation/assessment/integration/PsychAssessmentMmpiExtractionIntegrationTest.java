package com.coresolution.consultation.assessment.integration;

import static org.assertj.core.api.Assertions.assertThat;

import com.coresolution.consultation.ConsultationManagementApplication;
import com.coresolution.consultation.assessment.entity.PsychAssessmentDocument;
import com.coresolution.consultation.assessment.entity.PsychAssessmentExtraction;
import com.coresolution.consultation.assessment.parser.Mmpi2ExtractionParser;
import com.coresolution.consultation.assessment.repository.PsychAssessmentDocumentRepository;
import com.coresolution.consultation.assessment.repository.PsychAssessmentExtractionRepository;
import com.coresolution.consultation.assessment.service.PsychAssessmentReportService;
import com.coresolution.core.context.TenantContextHolder;
import java.nio.file.Files;
import java.nio.file.Path;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

/**
 * mmpi_이혁진 기존 문서(document_id 29 또는 tenant-incheon-consultation-006의 최신 MMPI 문서)를
 * 사용해 리포트 생성 테스트를 실행하고, 추출/파싱 로그를 확인.
 * <p>
 * 로그 확인 항목: MMPI-2 PDF 파싱 결과 null, textHead, 원점수/전체규준 패턴 미발견
 *
 * @author CoreSolution
 */
@Slf4j
@SpringBootTest(classes = ConsultationManagementApplication.class)
@ActiveProfiles("local")
@Transactional
@DisplayName("PsychAssessment MMPI 추출 통합 테스트")
class PsychAssessmentMmpiExtractionIntegrationTest {

    private static final String TENANT_ID = "tenant-incheon-consultation-006";
    private static final Long DOCUMENT_ID_29 = 29L;
    private static final String FILENAME_PATTERN = "mmpi_이혁진";

    @Autowired
    private PsychAssessmentReportService reportService;

    @Autowired
    private PsychAssessmentDocumentRepository documentRepository;

    @Autowired
    private PsychAssessmentExtractionRepository extractionRepository;

    @BeforeEach
    void setUp() {
        TenantContextHolder.setTenantId(TENANT_ID);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("mmpi_이혁진 문서로 리포트 생성 - 추출/파싱 로그 확인")
    void generateReport_mmpiDocument_extractionLogs() {
        // Given: document_id 29 또는 original_filename LIKE '%mmpi_이혁진%' 최신 문서 조회
        PsychAssessmentDocument doc = documentRepository.findByTenantIdAndId(TENANT_ID, DOCUMENT_ID_29)
                .or(() -> documentRepository.findFirstByTenantIdAndOriginalFilenameContainingOrderByCreatedAtDesc(
                        TENANT_ID, FILENAME_PATTERN))
                .orElse(null);

        assertThat(doc).as("tenant=%s, documentId=%s 또는 filename LIKE '%%%s%%' 매칭 문서 필요",
                TENANT_ID, DOCUMENT_ID_29, FILENAME_PATTERN).isNotNull();

        Long documentId = doc.getId();
        log.info("테스트 대상 문서: documentId={}, originalFilename={}, assessmentType={}, storagePath={}",
                documentId, doc.getOriginalFilename(), doc.getAssessmentType(), doc.getStoragePath());

        // 추출 전 상태
        PsychAssessmentExtraction beforeExtraction = extractionRepository
                .findTopByTenantIdAndDocumentIdOrderByCreatedAtDesc(TENANT_ID, documentId)
                .orElse(null);
        if (beforeExtraction != null) {
            String json = beforeExtraction.getExtractedJson();
            boolean hasJson = json != null && !json.isBlank();
            log.info("추출 전: extractionId={}, extractedJson 존재={}, len={}",
                    beforeExtraction.getId(), hasJson, hasJson ? json.length() : 0);
            if (json != null && !json.isEmpty()) {
                log.info("extracted_json 앞 500자: {}", json.substring(0, Math.min(500, json.length())));
            }
        } else {
            log.info("추출 전: extraction 없음 → ensureExtractionSync에서 재추출 예정");
        }

        // When: 리포트 생성 (extraction 없거나 extracted_json 비어 있으면 ensureExtractionSync → 재추출)
        Long reportId = reportService.generateLatestReport(documentId);

        // Then
        assertThat(reportId).as("리포트 생성 성공").isNotNull().isPositive();
        log.info("리포트 생성 완료: documentId={}, reportId={}", documentId, reportId);

        // 추출 결과 확인
        PsychAssessmentExtraction afterExtraction = extractionRepository
                .findTopByTenantIdAndDocumentIdOrderByCreatedAtDesc(TENANT_ID, documentId)
                .orElse(null);
        assertThat(afterExtraction).as("추출 결과 존재").isNotNull();

        String extractedJson = afterExtraction.getExtractedJson();
        boolean hasExtractedJson = extractedJson != null && !extractedJson.isBlank();
        log.info("추출 후: extractionId={}, extractedJson 존재={}, len={}",
                afterExtraction.getId(), hasExtractedJson, extractedJson != null ? extractedJson.length() : 0);
        if (!hasExtractedJson) {
            log.warn("extracted_json null 또는 비어 있음 → MMPI-2 파싱 실패 가능. logs/coresolution.log에서 textHead, 원점수/전체규준 패턴 미발견 확인");
        }
    }

    private static final Path LOCAL_MMPI_PDF = Path.of("/Users/mind/Downloads/mmpi_이혁진.pdf");

    @Test
    @DisplayName("로컬 mmpi_이혁진.pdf 파일로 파서 직접 테스트")
    void parseLocalMmpiPdf_directParserTest() throws Exception {
        if (!Files.isRegularFile(LOCAL_MMPI_PDF)) {
            log.warn("로컬 PDF 없음, 스킵: {}", LOCAL_MMPI_PDF);
            return;
        }

        byte[] bytes = Files.readAllBytes(LOCAL_MMPI_PDF);
        try (PDDocument pdDoc = Loader.loadPDF(bytes)) {
            PDFTextStripper stripper = new PDFTextStripper();
            String text = stripper.getText(pdDoc);
            int textLen = text != null ? text.length() : 0;

            log.info("=== 로컬 mmpi_이혁진.pdf 파서 테스트 ===");
            log.info("textLen={}", textLen);
            if (textLen > 0) {
                String head = text.substring(0, Math.min(1000, textLen));
                log.info("textHead(1000자): [{}]", head);
            }

            String parsed = Mmpi2ExtractionParser.parse(text);
            if (parsed != null) {
                log.info("파싱 성공! extracted_json 길이={}, 앞 300자: {}",
                        parsed.length(), parsed.substring(0, Math.min(300, parsed.length())));
                assertThat(parsed).contains("\"metrics\"");
            } else {
                log.warn("파싱 실패(null). text에 '원점수' 포함={}, '전체규준' 포함={}, 'T점수' 포함={}",
                        text != null && text.contains("원점수"),
                        text != null && text.contains("전체규준"),
                        text != null && text.contains("T점수"));
            }
        }
    }
}
