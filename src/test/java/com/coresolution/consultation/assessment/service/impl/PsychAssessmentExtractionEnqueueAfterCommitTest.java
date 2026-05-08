package com.coresolution.consultation.assessment.service.impl;

import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.clearInvocations;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

import com.coresolution.consultation.ConsultationManagementApplication;
import com.coresolution.consultation.assessment.service.PsychAssessmentExtractionService;
import com.coresolution.core.context.TenantContextHolder;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * 업로드 서비스가 트랜잭션 안에서 {@code enqueueExtraction}을 호출할 때,
 * 비동기 추출은 커밋 이후에만 실행되어 문서 조회 레이스가 나지 않아야 한다.
 * <p>
 * 참고: {@code @Transactional} 테스트에서 트랜잭션이 롤백되어도 {@code afterCommit}는
 * 커밋된 경우에만 콜백이 호출되며, 롤백 시에는 호출되지 않는다(스프링 기본 동작).
 * 본 테스트는 {@link TransactionTemplate}으로 커밋되는 경로만 검증한다.
 * </p>
 *
 * @author CoreSolution
 * @since 2026-05-08
 */
@SpringBootTest(classes = ConsultationManagementApplication.class)
@ActiveProfiles("test")
@DisplayName("PsychAssessment 추출 큐 afterCommit 동작")
class PsychAssessmentExtractionEnqueueAfterCommitTest {

    @Autowired
    private PsychAssessmentExtractionService extractionService;

    @Autowired
    private PlatformTransactionManager transactionManager;

    @MockBean
    private PsychAssessmentExtractionServiceImpl.PsychAssessmentExtractionRunner extractionRunner;

    @BeforeEach
    void setUp() {
        TenantContextHolder.clear();
        clearInvocations(extractionRunner);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    void enqueueExtraction_whenSynchronizationActive_defersProcessAsyncUntilAfterCommit() {
        String tenantId = "after-commit-test-tenant";
        TransactionTemplate template = new TransactionTemplate(transactionManager);
        template.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);

        template.executeWithoutResult(status -> {
            TenantContextHolder.setTenantId(tenantId);
            extractionService.enqueueExtraction(4242L);
            verify(extractionRunner, never()).processAsync(anyString(), anyLong());
        });

        verify(extractionRunner, times(1)).processAsync(tenantId, 4242L);
    }

    @Test
    void enqueueExtraction_whenNoActiveTransaction_callsProcessAsyncImmediately() {
        String tenantId = "no-tx-tenant";
        TenantContextHolder.setTenantId(tenantId);
        extractionService.enqueueExtraction(9191L);
        verify(extractionRunner, times(1)).processAsync(tenantId, 9191L);
    }
}
