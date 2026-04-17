package com.coresolution.consultation.service.impl;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Collections;
import com.coresolution.consultation.repository.erp.financial.FinancialTransactionRepository;
import com.coresolution.core.context.TenantContextHolder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;

/**
 * D8 retrofit dry-run: Repository 집계 호출·테넌트 검증 경로 검증.
 *
 * @author CoreSolution
 * @since 2026-04-17
 */
@ExtendWith(MockitoExtension.class)
class ErpFinancialDataRetrofitServiceImplTest {

    private static final String TENANT_ID = "test-tenant-d8";

    @Mock
    private FinancialTransactionRepository financialTransactionRepository;

    @InjectMocks
    private ErpFinancialDataRetrofitServiceImpl erpFinancialDataRetrofitService;

    @BeforeEach
    void setTenantContext() {
        TenantContextHolder.setTenantId(TENANT_ID);
    }

    @AfterEach
    void clearTenantContext() {
        TenantContextHolder.clear();
    }

    @Test
    void retrofitWithholdingFromLegacyTaxAmount_dryRun_queriesCountAndSampleIds() {
        when(financialTransactionRepository.countD8WithholdingLegacyCandidates(
                eq(TENANT_ID), any(String.class), any(String.class), any(String.class)))
                .thenReturn(3L);
        when(financialTransactionRepository.findD8WithholdingLegacyCandidateIds(
                eq(TENANT_ID), any(String.class), any(String.class), any(String.class), any(Pageable.class)))
                .thenReturn(Collections.singletonList(100L));

        erpFinancialDataRetrofitService.retrofitWithholdingFromLegacyTaxAmount(TENANT_ID);

        verify(financialTransactionRepository).countD8WithholdingLegacyCandidates(
                eq(TENANT_ID), any(String.class), any(String.class), any(String.class));
        verify(financialTransactionRepository).findD8WithholdingLegacyCandidateIds(
                eq(TENANT_ID), any(String.class), any(String.class), any(String.class), any(Pageable.class));
    }
}
