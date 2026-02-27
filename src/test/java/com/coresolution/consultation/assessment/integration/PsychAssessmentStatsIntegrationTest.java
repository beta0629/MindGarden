package com.coresolution.consultation.assessment.integration;

import static org.assertj.core.api.Assertions.assertThat;

import com.coresolution.consultation.ConsultationManagementApplication;
import com.coresolution.consultation.assessment.entity.PsychAssessmentDocument;
import com.coresolution.consultation.assessment.model.PsychAssessmentDocumentStatus;
import com.coresolution.consultation.assessment.model.PsychAssessmentType;
import com.coresolution.consultation.assessment.repository.PsychAssessmentDocumentRepository;
import com.coresolution.consultation.assessment.repository.PsychAssessmentExtractionRepository;
import com.coresolution.consultation.assessment.repository.PsychAssessmentReportRepository;
import com.coresolution.consultation.assessment.service.PsychAssessmentStatsService;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.domain.Tenant;
import com.coresolution.core.repository.TenantRepository;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

/**
 * PsychAssessment stats 테넌트 격리 통합 테스트
 * Repository countByTenantId 및 StatsService 테넌트 스코프 검증
 *
 * @author CoreSolution
 * @see docs/project-management/PSYCH_ASSESSMENT_IMPROVEMENT_PLAN.md §5.2
 */
@SpringBootTest(classes = ConsultationManagementApplication.class)
@ActiveProfiles("test")
@Transactional
@DisplayName("PsychAssessment stats 통합 테스트")
class PsychAssessmentStatsIntegrationTest {

    @Autowired
    private PsychAssessmentStatsService statsService;

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
        tenantId1 = "tenant-psych-" + UUID.randomUUID();
        tenantId2 = "tenant-psych-" + UUID.randomUUID();

        Tenant t1 = Tenant.builder()
                .tenantId(tenantId1)
                .name("테스트 테넌트 1")
                .businessType("CONSULTATION")
                .status(Tenant.TenantStatus.ACTIVE)
                .contactEmail("psych1@test.com")
                .build();
        tenantRepository.save(t1);

        Tenant t2 = Tenant.builder()
                .tenantId(tenantId2)
                .name("테스트 테넌트 2")
                .businessType("CONSULTATION")
                .status(Tenant.TenantStatus.ACTIVE)
                .contactEmail("psych2@test.com")
                .build();
        tenantRepository.save(t2);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("Repository countByTenantId - 테넌트별 문서 count 격리")
    void countByTenantId_document_isolation() {
        // Given - 테넌트 1에 문서 2개, 테넌트 2에 문서 1개
        saveDocument(tenantId1);
        saveDocument(tenantId1);
        saveDocument(tenantId2);

        // When
        long count1 = documentRepository.countByTenantId(tenantId1);
        long count2 = documentRepository.countByTenantId(tenantId2);

        // Then
        assertThat(count1).isEqualTo(2L);
        assertThat(count2).isEqualTo(1L);
    }

    @Test
    @DisplayName("Repository countByTenantId - extraction/report count 0 반환 (테넌트별 격리)")
    void countByTenantId_extractionReport_returnsCorrectCounts() {
        // Given - 문서만 생성 (extraction/report는 V20260227_004 마이그레이션 필요)
        saveDocument(tenantId1);
        saveDocument(tenantId2);

        // When - countByTenantId는 마이그레이션 없이 동작 (기존 스키마)
        long extCount1 = extractionRepository.countByTenantId(tenantId1);
        long extCount2 = extractionRepository.countByTenantId(tenantId2);
        long reportCount1 = reportRepository.countByTenantId(tenantId1);
        long reportCount2 = reportRepository.countByTenantId(tenantId2);

        // Then - 해당 테넌트에 extraction/report 없음
        assertThat(extCount1).isEqualTo(0L);
        assertThat(extCount2).isEqualTo(0L);
        assertThat(reportCount1).isEqualTo(0L);
        assertThat(reportCount2).isEqualTo(0L);
    }

    @Test
    @DisplayName("StatsService getTenantStats - 테넌트별 stats 격리")
    void getTenantStats_tenantIsolation() {
        // Given - 테넌트 1에 문서 2개, 테넌트 2에 문서 1개
        saveDocument(tenantId1);
        saveDocument(tenantId1);
        saveDocument(tenantId2);

        TenantContextHolder.setTenantId(tenantId1);
        Map<String, Object> stats1 = statsService.getTenantStats();

        TenantContextHolder.setTenantId(tenantId2);
        Map<String, Object> stats2 = statsService.getTenantStats();

        // Then - 테넌트 1: docs 2, extractions 0, reports 0
        assertThat(stats1).containsEntry("tenantId", tenantId1);
        assertThat(stats1.get("documentsTotal")).isEqualTo(2L);
        assertThat(stats1.get("extractionsTotal")).isEqualTo(0L);
        assertThat(stats1.get("reportsTotal")).isEqualTo(0L);

        // Then - 테넌트 2: docs 1 (다른 테넌트 데이터 미포함)
        assertThat(stats2).containsEntry("tenantId", tenantId2);
        assertThat(stats2.get("documentsTotal")).isEqualTo(1L);
        assertThat(stats2.get("extractionsTotal")).isEqualTo(0L);
        assertThat(stats2.get("reportsTotal")).isEqualTo(0L);
    }

    private PsychAssessmentDocument saveDocument(String tenantId) {
        String unique = UUID.randomUUID().toString().replace("-", "").substring(0, 32);
        PsychAssessmentDocument doc = PsychAssessmentDocument.builder()
                .tenantId(tenantId)
                .assessmentType(PsychAssessmentType.TCI)
                .sourceType("SCANNED_PDF")
                .fileSize(1024L)
                .sha256(unique)
                .storagePath("/test/" + unique)
                .encryptionKeyVersion("v1")
                .status(PsychAssessmentDocumentStatus.UPLOADED)
                .build();
        return documentRepository.save(doc);
    }
}
