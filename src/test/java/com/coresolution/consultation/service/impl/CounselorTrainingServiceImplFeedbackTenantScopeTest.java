package com.coresolution.consultation.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Map;

import com.coresolution.consultation.entity.CounselorFeedback;
import com.coresolution.consultation.repository.AudioTranscriptionRepository;
import com.coresolution.consultation.repository.ConsultationRecordRepository;
import com.coresolution.consultation.repository.CounselorFeedbackRepository;
import com.coresolution.consultation.repository.VirtualClientSessionRepository;
import com.coresolution.core.context.TenantContextHolder;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * 상담사 피드백 이력 조회({@code GET /api/v1/training/feedback/{consultantId}}) 테넌트 격리.
 *
 * <p>이전에는 {@code consultantId} 만으로 조회해 테넌트 조건이 없었다. 멀티테넌트 규칙상
 * 호출자 기관 데이터만 돌려줘야 한다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-04
 */
@DisplayName("CounselorTrainingServiceImpl 피드백 이력 — 테넌트 격리")
class CounselorTrainingServiceImplFeedbackTenantScopeTest {

    private static final String TENANT_A = "tenant-feedback-a";
    private static final Long CONSULTANT_ID = 30L;

    private CounselorFeedbackRepository feedbackRepository;
    private CounselorTrainingServiceImpl service;

    @BeforeEach
    void setUp() {
        TenantContextHolder.clear();
        feedbackRepository = mock(CounselorFeedbackRepository.class);
        service = new CounselorTrainingServiceImpl(
            feedbackRepository,
            mock(VirtualClientSessionRepository.class),
            mock(ConsultationRecordRepository.class),
            mock(AudioTranscriptionRepository.class),
            new ObjectMapper());
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("호출자 테넌트 조건으로만 조회한다 (consultantId 단독 조회 금지)")
    void queriesWithCallerTenant() {
        TenantContextHolder.setTenantId(TENANT_A);
        when(feedbackRepository.findByTenantIdAndConsultantIdAndIsDeletedFalseOrderByFeedbackDateDesc(
            TENANT_A, CONSULTANT_ID)).thenReturn(List.of(new CounselorFeedback()));

        Map<String, Object> result = service.getFeedbackHistory(CONSULTANT_ID, 10);

        assertEquals(1, result.get("count"));
        verify(feedbackRepository)
            .findByTenantIdAndConsultantIdAndIsDeletedFalseOrderByFeedbackDateDesc(TENANT_A, CONSULTANT_ID);
        verify(feedbackRepository, never())
            .findByConsultantIdAndIsDeletedFalseOrderByFeedbackDateDesc(anyLong());
    }

    @Test
    @DisplayName("반례(테넌트) — 테넌트 컨텍스트가 없으면 조회하지 않고 거부한다")
    void withoutTenantContext_rejected() {
        assertThrows(RuntimeException.class, () -> service.getFeedbackHistory(CONSULTANT_ID, 10));

        verify(feedbackRepository, never())
            .findByTenantIdAndConsultantIdAndIsDeletedFalseOrderByFeedbackDateDesc(anyString(), anyLong());
        verify(feedbackRepository, never())
            .findByConsultantIdAndIsDeletedFalseOrderByFeedbackDateDesc(anyLong());
    }

    @Test
    @DisplayName("limit 만큼만 돌려준다")
    void appliesLimit() {
        TenantContextHolder.setTenantId(TENANT_A);
        when(feedbackRepository.findByTenantIdAndConsultantIdAndIsDeletedFalseOrderByFeedbackDateDesc(
            TENANT_A, CONSULTANT_ID))
            .thenReturn(List.of(new CounselorFeedback(), new CounselorFeedback(), new CounselorFeedback()));

        Map<String, Object> result = service.getFeedbackHistory(CONSULTANT_ID, 2);

        assertEquals(2, result.get("count"));
        assertTrue(((List<?>) result.get("feedbacks")).size() == 2);
    }
}
