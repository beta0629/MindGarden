package com.coresolution.consultation.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import com.coresolution.consultation.entity.EmotionTrackingHistory;
import com.coresolution.consultation.entity.MultimodalEmotionReport;
import com.coresolution.consultation.repository.EmotionTrackingHistoryRepository;
import com.coresolution.consultation.repository.MultimodalEmotionReportRepository;
import com.coresolution.core.context.TenantContextHolder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * 감정 추이·리포트 조회가 테넌트 범위 쿼리만 쓰는지 검증한다.
 *
 * @author CoreSolution
 * @since 2026-10-04
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("EmotionAnalysisServiceImpl 테넌트 범위 조회")
class EmotionAnalysisServiceImplTenantTest {

    private static final String TENANT = "tenant-emotion-a";

    @Mock
    private EmotionTrackingHistoryRepository trackingHistoryRepository;
    @Mock
    private MultimodalEmotionReportRepository multimodalReportRepository;
    @InjectMocks
    private EmotionAnalysisServiceImpl service;

    @BeforeEach
    void setUp() {
        TenantContextHolder.setTenantId(TENANT);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("getEmotionTrend — tenantId 포함 쿼리, 테넌트 없는 쿼리 미사용")
    void trend_usesTenantScopedQuery() {
        EmotionTrackingHistory row = new EmotionTrackingHistory();
        when(trackingHistoryRepository.findByTenantIdAndClientIdAndEmotionTypeAndIsDeletedFalseOrderBySessionNumberAsc(
            TENANT, 20L, "anxiety")).thenReturn(List.of(row));

        assertEquals(List.of(row), service.getEmotionTrend(20L, "anxiety"));
        verify(trackingHistoryRepository, never())
            .findByClientIdAndEmotionTypeAndIsDeletedFalseOrderBySessionNumberAsc(anyLong(), anyString());
    }

    @Test
    @DisplayName("getEmotionTrend — 테넌트 컨텍스트 없으면 조회하지 않고 실패")
    void trend_withoutTenant_fails() {
        TenantContextHolder.clear();
        assertThrows(RuntimeException.class, () -> service.getEmotionTrend(20L, "anxiety"));
        verify(trackingHistoryRepository, never())
            .findByTenantIdAndClientIdAndEmotionTypeAndIsDeletedFalseOrderBySessionNumberAsc(any(), any(), any());
    }

    @Test
    @DisplayName("getMultimodalReport — 다른 테넌트 리포트 id 는 찾지 못함")
    void multimodal_otherTenant_notFound() {
        when(multimodalReportRepository.findByTenantIdAndIdAndIsDeletedFalse(TENANT, 501L))
            .thenReturn(Optional.empty());
        assertThrows(IllegalArgumentException.class, () -> service.getMultimodalReport(501L));
        verify(multimodalReportRepository, never()).findByIdAndIsDeletedFalse(anyLong());
    }

    @Test
    @DisplayName("getMultimodalReport — 같은 테넌트 리포트 반환")
    void multimodal_sameTenant_found() {
        MultimodalEmotionReport report = new MultimodalEmotionReport();
        when(multimodalReportRepository.findByTenantIdAndIdAndIsDeletedFalse(TENANT, 500L))
            .thenReturn(Optional.of(report));
        assertEquals(report, service.getMultimodalReport(500L));
    }
}
