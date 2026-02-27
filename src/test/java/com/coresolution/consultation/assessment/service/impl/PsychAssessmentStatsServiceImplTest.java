package com.coresolution.consultation.assessment.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.assessment.model.PsychAssessmentDocumentStatus;
import com.coresolution.consultation.assessment.repository.PsychAssessmentDocumentRepository;
import com.coresolution.consultation.assessment.repository.PsychAssessmentExtractionRepository;
import com.coresolution.consultation.assessment.repository.PsychAssessmentReportRepository;
import com.coresolution.core.context.TenantContextHolder;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * PsychAssessmentStatsServiceImpl 단위 테스트
 * 테넌트 스코프 count (countByTenantId) 격리 검증
 *
 * @author CoreSolution
 * @see docs/project-management/PSYCH_ASSESSMENT_IMPROVEMENT_PLAN.md §5.2
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("PsychAssessmentStatsServiceImpl 테스트")
class PsychAssessmentStatsServiceImplTest {

    @Mock
    private PsychAssessmentDocumentRepository documentRepository;

    @Mock
    private PsychAssessmentExtractionRepository extractionRepository;

    @Mock
    private PsychAssessmentReportRepository reportRepository;

    @InjectMocks
    private PsychAssessmentStatsServiceImpl statsService;

    private String tenantIdA;
    private String tenantIdB;

    @BeforeEach
    void setUp() {
        tenantIdA = "tenant-" + UUID.randomUUID();
        tenantIdB = "tenant-" + UUID.randomUUID();
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("테넌트 A stats 조회 시 해당 테넌트 count만 호출")
    void getTenantStats_callsCountByTenantId_withCurrentTenant() {
        // Given
        TenantContextHolder.setTenantId(tenantIdA);
        when(documentRepository.countByTenantId(tenantIdA)).thenReturn(5L);
        when(extractionRepository.countByTenantId(tenantIdA)).thenReturn(3L);
        when(reportRepository.countByTenantId(tenantIdA)).thenReturn(2L);

        // When
        Map<String, Object> result = statsService.getTenantStats();

        // Then
        assertThat(result).containsEntry("tenantId", tenantIdA);
        assertThat(result).containsEntry("documentsTotal", 5L);
        assertThat(result).containsEntry("extractionsTotal", 3L);
        assertThat(result).containsEntry("reportsTotal", 2L);
        assertThat(result).containsKey("status");

        verify(documentRepository).countByTenantId(eq(tenantIdA));
        verify(extractionRepository).countByTenantId(eq(tenantIdA));
        verify(reportRepository).countByTenantId(eq(tenantIdA));
    }

    @Test
    @DisplayName("테넌트 B stats 조회 시 다른 테넌트 데이터가 섞이지 않음")
    void getTenantStats_tenantB_returnsIsolatedCounts() {
        // Given - 테넌트 A에는 10개, 테넌트 B에는 2개 존재
        when(documentRepository.countByTenantId(tenantIdB)).thenReturn(2L);
        when(extractionRepository.countByTenantId(tenantIdB)).thenReturn(1L);
        when(reportRepository.countByTenantId(tenantIdB)).thenReturn(0L);

        TenantContextHolder.setTenantId(tenantIdB);

        // When
        Map<String, Object> result = statsService.getTenantStats();

        // Then - 테넌트 B의 count만 반환 (테넌트 A 데이터 미포함)
        assertThat(result).containsEntry("tenantId", tenantIdB);
        assertThat(result).containsEntry("documentsTotal", 2L);
        assertThat(result).containsEntry("extractionsTotal", 1L);
        assertThat(result).containsEntry("reportsTotal", 0L);

        verify(documentRepository).countByTenantId(eq(tenantIdB));
        verify(extractionRepository).countByTenantId(eq(tenantIdB));
        verify(reportRepository).countByTenantId(eq(tenantIdB));
    }

    @Test
    @DisplayName("테넌트별 stats 격리 - A와 B가 서로 다른 count 반환")
    void getTenantStats_tenantIsolation_differentCounts() {
        // Given - 테넌트 A
        TenantContextHolder.setTenantId(tenantIdA);
        when(documentRepository.countByTenantId(tenantIdA)).thenReturn(7L);
        when(extractionRepository.countByTenantId(tenantIdA)).thenReturn(5L);
        when(reportRepository.countByTenantId(tenantIdA)).thenReturn(3L);

        Map<String, Object> resultA = statsService.getTenantStats();

        // Given - 테넌트 B (다른 count)
        when(documentRepository.countByTenantId(tenantIdB)).thenReturn(1L);
        when(extractionRepository.countByTenantId(tenantIdB)).thenReturn(0L);
        when(reportRepository.countByTenantId(tenantIdB)).thenReturn(0L);
        TenantContextHolder.setTenantId(tenantIdB);

        Map<String, Object> resultB = statsService.getTenantStats();

        // Then - 각 테넌트의 count가 독립적으로 반환
        assertThat(resultA).containsEntry("tenantId", tenantIdA);
        assertThat(resultA).containsEntry("documentsTotal", 7L);
        assertThat(resultA).containsEntry("extractionsTotal", 5L);
        assertThat(resultA).containsEntry("reportsTotal", 3L);

        assertThat(resultB).containsEntry("tenantId", tenantIdB);
        assertThat(resultB).containsEntry("documentsTotal", 1L);
        assertThat(resultB).containsEntry("extractionsTotal", 0L);
        assertThat(resultB).containsEntry("reportsTotal", 0L);
    }

    @Test
    @DisplayName("getTenantStats 반환값에 status 클래스명 포함")
    void getTenantStats_containsStatus() {
        TenantContextHolder.setTenantId(tenantIdA);
        when(documentRepository.countByTenantId(tenantIdA)).thenReturn(0L);
        when(extractionRepository.countByTenantId(tenantIdA)).thenReturn(0L);
        when(reportRepository.countByTenantId(tenantIdA)).thenReturn(0L);

        Map<String, Object> result = statsService.getTenantStats();

        assertThat(result).containsEntry("status", PsychAssessmentDocumentStatus.class.getSimpleName());
    }
}
