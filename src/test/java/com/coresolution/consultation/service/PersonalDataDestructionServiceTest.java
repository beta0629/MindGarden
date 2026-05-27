package com.coresolution.consultation.service;

import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import com.coresolution.consultation.config.LifecycleCutoffProperties;
import com.coresolution.consultation.repository.ConsultationRecordRepository;
import com.coresolution.consultation.repository.PaymentRepository;
import com.coresolution.consultation.repository.PersonalDataAccessLogRepository;
import com.coresolution.consultation.repository.SalaryCalculationRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.service.TenantService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * 개인정보 파기 스케줄: 활성 테넌트 루프·테넌트 격리 쿼리 호출 검증.
 *
 * @author CoreSolution
 * @since 2026-05-11
 */
@ExtendWith(MockitoExtension.class)
class PersonalDataDestructionServiceTest {

    @Mock
    private PersonalDataAccessLogRepository personalDataAccessLogRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private ConsultationRecordRepository consultationRecordRepository;
    @Mock
    private PaymentRepository paymentRepository;
    @Mock
    private SalaryCalculationRepository salaryCalculationRepository;
    @Mock
    private TenantService tenantService;

    @Spy
    private LifecycleCutoffProperties cutoffProperties = new LifecycleCutoffProperties();

    @InjectMocks
    private PersonalDataDestructionService personalDataDestructionService;

    @AfterEach
    void clearTenant() {
        TenantContextHolder.clear();
    }

    @Test
    void destroyExpiredPersonalData_skipsWhenNoActiveTenants() {
        when(tenantService.getAllActiveTenantIds()).thenReturn(Collections.emptyList());

        personalDataDestructionService.destroyExpiredPersonalData();

        verify(userRepository, never()).findExpiredUsersForDestructionByTenantId(any(), any());
        verify(consultationRecordRepository, never()).findExpiredRecordsForDestruction(any(), any());
        verifyNoInteractions(userRepository, consultationRecordRepository, paymentRepository, salaryCalculationRepository,
            personalDataAccessLogRepository);
    }

    @Test
    void destroyExpiredPersonalData_runsPerActiveTenantAndClearsContext() {
        when(tenantService.getAllActiveTenantIds()).thenReturn(List.of("tenant-a", "tenant-b"));
        when(userRepository.findExpiredUsersForDestructionByTenantId(any(), any(LocalDateTime.class)))
            .thenReturn(Collections.emptyList());
        when(consultationRecordRepository.findExpiredRecordsForDestruction(any(), any(LocalDateTime.class)))
            .thenReturn(Collections.emptyList());
        when(paymentRepository.findExpiredPaymentsForDestructionByTenantId(any(), any(LocalDateTime.class)))
            .thenReturn(Collections.emptyList());
        when(salaryCalculationRepository.findExpiredSalariesForDestructionByTenantId(any(), any(LocalDateTime.class)))
            .thenReturn(Collections.emptyList());
        when(personalDataAccessLogRepository.deleteByTenantIdAndAccessTimeBefore(any(), any(LocalDateTime.class)))
            .thenReturn(0);

        personalDataDestructionService.destroyExpiredPersonalData();

        verify(userRepository).findExpiredUsersForDestructionByTenantId(eq("tenant-a"), any());
        verify(userRepository).findExpiredUsersForDestructionByTenantId(eq("tenant-b"), any());
        verify(personalDataAccessLogRepository).deleteByTenantIdAndAccessTimeBefore(eq("tenant-a"), any());
        verify(personalDataAccessLogRepository).deleteByTenantIdAndAccessTimeBefore(eq("tenant-b"), any());
        assertNull(TenantContextHolder.getTenantId());
    }
}
