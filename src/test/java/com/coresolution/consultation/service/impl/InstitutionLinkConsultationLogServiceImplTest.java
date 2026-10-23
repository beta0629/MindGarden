package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.lang.reflect.Field;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.Optional;
import com.coresolution.consultation.dto.InstitutionLinkConsultationLogCreateRequest;
import com.coresolution.consultation.dto.InstitutionLinkConsultationLogResponse;
import com.coresolution.consultation.entity.InstitutionLinkConsultationLog;
import com.coresolution.consultation.entity.InstitutionLinkContract;
import com.coresolution.consultation.exception.EntityNotFoundException;
import com.coresolution.consultation.repository.InstitutionLinkConsultationLogRepository;
import com.coresolution.consultation.repository.InstitutionLinkContractRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * 타기관 일지 저장이 remainingSessions 없이 신규 로그 테이블로 가는지 검증.
 *
 * @author CoreSolution
 * @since 2026-09-14
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("InstitutionLinkConsultationLogServiceImpl")
class InstitutionLinkConsultationLogServiceImplTest {

    private static final String TENANT_ID = "tenant-institution-link-1";
    private static final long CONTRACT_ID = 41L;

    @Mock
    private InstitutionLinkConsultationLogRepository institutionLinkConsultationLogRepository;

    @Mock
    private InstitutionLinkContractRepository institutionLinkContractRepository;

    @InjectMocks
    private InstitutionLinkConsultationLogServiceImpl service;

    @Test
    @DisplayName("타기관 일지 insert 는 remainingSessions 없이 새 로그 테이블에 저장된다")
    void create_doesNotRequireRemainingSessions() {
        InstitutionLinkContract contract = InstitutionLinkContract.builder()
                .consultantId(7L)
                .clientId(9L)
                .periodStart(LocalDate.of(2026, 9, 1))
                .status("ACTIVE")
                .build();
        contract.setId(CONTRACT_ID);
        contract.setTenantId(TENANT_ID);

        when(institutionLinkContractRepository.findByTenantIdAndIdAndIsDeletedFalse(eq(TENANT_ID), eq(CONTRACT_ID)))
                .thenReturn(Optional.of(contract));
        when(institutionLinkConsultationLogRepository.save(any(InstitutionLinkConsultationLog.class)))
                .thenAnswer(invocation -> {
                    InstitutionLinkConsultationLog entity = invocation.getArgument(0);
                    entity.setId(88L);
                    return entity;
                });

        InstitutionLinkConsultationLogCreateRequest request = InstitutionLinkConsultationLogCreateRequest.builder()
                .contractId(CONTRACT_ID)
                .scheduleId(500L)
                .clientId(9L)
                .consultantId(7L)
                .sessionDate(LocalDate.of(2026, 9, 14))
                .clientCondition("월결제 타기관 상담")
                .isSessionCompleted(true)
                .build();

        InstitutionLinkConsultationLogResponse saved = service.create(TENANT_ID, request);

        ArgumentCaptor<InstitutionLinkConsultationLog> captor =
                ArgumentCaptor.forClass(InstitutionLinkConsultationLog.class);
        verify(institutionLinkConsultationLogRepository).save(captor.capture());
        InstitutionLinkConsultationLog persisted = captor.getValue();
        assertThat(persisted.getTenantId()).isEqualTo(TENANT_ID);
        assertThat(persisted.getContractId()).isEqualTo(CONTRACT_ID);
        assertThat(persisted.getClientCondition()).isEqualTo("월결제 타기관 상담");
        assertThat(fieldNames(InstitutionLinkConsultationLog.class))
                .doesNotContain("remainingSessions", "usedSessions", "totalSessions");
        assertThat(saved.getId()).isEqualTo(88L);
    }

    @Test
    @DisplayName("tenantId 없으면 일지를 저장하지 않는다")
    void create_requiresTenantId() {
        InstitutionLinkConsultationLogCreateRequest request = InstitutionLinkConsultationLogCreateRequest.builder()
                .contractId(CONTRACT_ID)
                .clientId(9L)
                .consultantId(7L)
                .sessionDate(LocalDate.of(2026, 9, 14))
                .build();

        assertThatThrownBy(() -> service.create(null, request))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("tenantId는 필수입니다.");
        verifyNoInteractions(institutionLinkConsultationLogRepository);
        verifyNoInteractions(institutionLinkContractRepository);
    }

    @Test
    @DisplayName("다른 테넌트 계약이면 일지를 쓰지 않는다")
    void create_rejectsMissingContractInTenant() {
        when(institutionLinkContractRepository.findByTenantIdAndIdAndIsDeletedFalse(eq(TENANT_ID), eq(CONTRACT_ID)))
                .thenReturn(Optional.empty());

        InstitutionLinkConsultationLogCreateRequest request = InstitutionLinkConsultationLogCreateRequest.builder()
                .contractId(CONTRACT_ID)
                .clientId(9L)
                .consultantId(7L)
                .sessionDate(LocalDate.of(2026, 9, 14))
                .build();

        assertThatThrownBy(() -> service.create(TENANT_ID, request))
                .isInstanceOf(EntityNotFoundException.class);
        verify(institutionLinkConsultationLogRepository, never()).save(any());
    }

    private static String[] fieldNames(Class<?> type) {
        return Arrays.stream(type.getDeclaredFields()).map(Field::getName).toArray(String[]::new);
    }
}
