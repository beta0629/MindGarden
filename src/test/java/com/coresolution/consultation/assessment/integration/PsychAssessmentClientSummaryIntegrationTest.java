package com.coresolution.consultation.assessment.integration;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import com.coresolution.consultation.ConsultationManagementApplication;
import com.coresolution.consultation.assessment.dto.PsychAssessmentClientSummaryDto;
import com.coresolution.consultation.assessment.entity.PsychAssessmentDocument;
import com.coresolution.consultation.assessment.entity.PsychAssessmentExtraction;
import com.coresolution.consultation.assessment.entity.PsychAssessmentReport;
import com.coresolution.consultation.assessment.model.PsychAssessmentDocumentStatus;
import com.coresolution.consultation.assessment.model.PsychAssessmentExtractionStatus;
import com.coresolution.consultation.assessment.model.PsychAssessmentType;
import com.coresolution.consultation.assessment.repository.PsychAssessmentDocumentRepository;
import com.coresolution.consultation.assessment.repository.PsychAssessmentExtractionRepository;
import com.coresolution.consultation.assessment.repository.PsychAssessmentReportRepository;
import com.coresolution.consultation.assessment.service.PsychAssessmentClientSummaryService;
import com.coresolution.consultation.dto.ClientRegistrationRequest;
import com.coresolution.consultation.entity.Client;
import com.coresolution.consultation.service.AdminService;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.domain.Tenant;
import com.coresolution.core.repository.TenantRepository;

/**
 * GET /api/v1/assessments/psych/clients/{id}/summary 와 동일 SSOT 서비스 검증.
 *
 * @author CoreSolution
 * @since 2026-05-09
 */
@SpringBootTest(classes = ConsultationManagementApplication.class)
@ActiveProfiles("test")
@Transactional
@DisplayName("내담자 심리검사 요약(ClientSummary) 통합 테스트")
class PsychAssessmentClientSummaryIntegrationTest {

    @Autowired
    private AdminService adminService;

    @Autowired
    private PsychAssessmentDocumentRepository documentRepository;

    @Autowired
    private PsychAssessmentExtractionRepository extractionRepository;

    @Autowired
    private PsychAssessmentReportRepository reportRepository;

    @Autowired
    private PsychAssessmentClientSummaryService clientSummaryService;

    @Autowired
    private TenantRepository tenantRepository;

    private String tenantId;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID().toString();
        Tenant tenant = Tenant.builder()
                .tenantId(tenantId)
                .name("심리요약 테스트 테넌트")
                .businessType("CONSULTATION")
                .status(Tenant.TenantStatus.ACTIVE)
                .contactEmail("summary@test.com")
                .build();
        tenantRepository.save(tenant);
        TenantContextHolder.setTenantId(tenantId);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("GENERATED 리포트·요약 섹션 있으면 hasPsychData true 및 typesPresent에 TCI")
    void summary_withGeneratedReportAndSummary_hasPsychData() {
        Client client = adminService.registerClient(
                ClientRegistrationRequest.builder()
                        .email("psych-summary-" + UUID.randomUUID() + "@test.com")
                        .build());
        Long clientId = client.getId();

        PsychAssessmentDocument doc = PsychAssessmentDocument.builder()
                .tenantId(tenantId)
                .clientId(clientId)
                .assessmentType(PsychAssessmentType.TCI)
                .sourceType("SCANNED_PDF")
                .originalFilename("tci.pdf")
                .fileSize(1024L)
                .sha256("b".repeat(64))
                .storagePath("/test/path")
                .encryptionKeyVersion("v1")
                .status(PsychAssessmentDocumentStatus.UPLOADED)
                .build();
        documentRepository.save(doc);

        PsychAssessmentExtraction ext = PsychAssessmentExtraction.builder()
                .tenantId(tenantId)
                .documentId(doc.getId())
                .extractionMode("TEMPLATE")
                .ocrEngine("STUB")
                .extractedJson("{}")
                .status(PsychAssessmentExtractionStatus.DONE)
                .build();
        extractionRepository.save(ext);

        PsychAssessmentReport report = PsychAssessmentReport.builder()
                .tenantId(tenantId)
                .documentId(doc.getId())
                .extractionId(ext.getId())
                .reportVersion(1)
                .reportMarkdown("## 요약\n노출용 요약 본문입니다.\n")
                .status("GENERATED")
                .build();
        reportRepository.save(report);

        PsychAssessmentClientSummaryDto dto = clientSummaryService.buildClientSummary(tenantId, clientId);

        assertThat(dto.isHasPsychData()).isTrue();
        assertThat(dto.getTypesPresent()).containsExactly(PsychAssessmentType.TCI);
        assertThat(dto.getDocuments()).hasSize(1);
        assertThat(dto.getDocuments().get(0).getDocumentId()).isEqualTo(doc.getId());
        assertThat(dto.getDocuments().get(0).getSummarySection()).contains("노출용 요약");
    }

    @Test
    @DisplayName("리포트가 REJECTED만 있으면 hasPsychData false")
    void summary_rejectedReportOnly_empty() {
        Client client = adminService.registerClient(
                ClientRegistrationRequest.builder()
                        .email("psych-rej-" + UUID.randomUUID() + "@test.com")
                        .build());
        Long clientId = client.getId();

        PsychAssessmentDocument doc = PsychAssessmentDocument.builder()
                .tenantId(tenantId)
                .clientId(clientId)
                .assessmentType(PsychAssessmentType.TCI)
                .sourceType("SCANNED_PDF")
                .originalFilename("tci.pdf")
                .fileSize(1024L)
                .sha256("c".repeat(64))
                .storagePath("/test/path2")
                .encryptionKeyVersion("v1")
                .status(PsychAssessmentDocumentStatus.UPLOADED)
                .build();
        documentRepository.save(doc);

        PsychAssessmentExtraction ext = PsychAssessmentExtraction.builder()
                .tenantId(tenantId)
                .documentId(doc.getId())
                .extractionMode("TEMPLATE")
                .ocrEngine("STUB")
                .extractedJson("{}")
                .status(PsychAssessmentExtractionStatus.DONE)
                .build();
        extractionRepository.save(ext);

        PsychAssessmentReport report = PsychAssessmentReport.builder()
                .tenantId(tenantId)
                .documentId(doc.getId())
                .extractionId(ext.getId())
                .reportVersion(1)
                .reportMarkdown("## 요약\n거절됨\n")
                .status("REJECTED")
                .build();
        reportRepository.save(report);

        PsychAssessmentClientSummaryDto dto = clientSummaryService.buildClientSummary(tenantId, clientId);

        assertThat(dto.isHasPsychData()).isFalse();
        assertThat(dto.getDocuments()).isEmpty();
    }

    @Test
    @DisplayName("clientId null 요청은 빈 요약")
    void summary_nullClientId_empty() {
        PsychAssessmentClientSummaryDto dto = clientSummaryService.buildClientSummary(tenantId, null);
        assertThat(dto.isHasPsychData()).isFalse();
        assertThat(dto.getDocuments()).isEmpty();
    }
}
