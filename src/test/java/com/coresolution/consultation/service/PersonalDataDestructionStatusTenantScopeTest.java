package com.coresolution.consultation.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.config.LifecycleCutoffProperties;
import com.coresolution.consultation.repository.ConsultationRecordRepository;
import com.coresolution.consultation.repository.PaymentRepository;
import com.coresolution.consultation.repository.PersonalDataAccessLogRepository;
import com.coresolution.consultation.repository.SalaryCalculationRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.service.TenantService;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Map;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

/**
 * 개인정보 파기 현황 조회의 테넌트 격리 검증 (하드스톱 1 — 타 테넌트 데이터).
 *
 * <p>P1 보안(2026-10-03): {@code getPersonalDataDestructionStatus()} 가 테넌트 미필터
 * {@code findByAccessTypeAndAccessTimeBetween} 을 호출해 타 테넌트 파기 집계까지 합산했다.
 * 테넌트 필터 쿼리로 교체했고, 테넌트 컨텍스트가 없으면 조회 자체를 거부한다.
 *
 * @author MindGarden
 * @since 2026-10-03
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("개인정보 파기 현황 — 테넌트 격리")
class PersonalDataDestructionStatusTenantScopeTest {

    private static final String TENANT_A = "tenant-destruction-a";

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
    @DisplayName("현재 테넌트 필터 쿼리만 사용하고 전체 테넌트 쿼리는 호출하지 않는다")
    void status_usesTenantScopedQueryOnly() {
        TenantContextHolder.setTenantId(TENANT_A);
        when(personalDataAccessLogRepository.findByTenantIdAndAccessTypeAndAccessTimeBetween(
                eq(TENANT_A), any(), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(Collections.emptyList());

        Map<String, Object> status = personalDataDestructionService.getPersonalDataDestructionStatus();

        assertThat(status).doesNotContainKey("error");
        verify(personalDataAccessLogRepository)
                .findByTenantIdAndAccessTypeAndAccessTimeBetween(
                        eq(TENANT_A), any(), any(LocalDateTime.class), any(LocalDateTime.class));
        verify(personalDataAccessLogRepository, never())
                .findByAccessTypeAndAccessTimeBetween(any(), any(LocalDateTime.class), any(LocalDateTime.class));
    }

    @Test
    @DisplayName("테넌트 컨텍스트가 없으면 조회를 거부하고 로그 쿼리를 전혀 하지 않는다")
    void status_withoutTenantContext_isRejected() {
        TenantContextHolder.clear();

        Map<String, Object> status = personalDataDestructionService.getPersonalDataDestructionStatus();

        assertThat(status).containsKey("error");
        verify(personalDataAccessLogRepository, never())
                .findByTenantIdAndAccessTypeAndAccessTimeBetween(any(), any(), any(), any());
        verify(personalDataAccessLogRepository, never())
                .findByAccessTypeAndAccessTimeBetween(any(), any(LocalDateTime.class), any(LocalDateTime.class));
    }
}
