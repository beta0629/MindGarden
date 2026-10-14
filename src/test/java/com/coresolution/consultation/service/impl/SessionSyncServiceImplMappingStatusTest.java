package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.repository.SessionExtensionRequestRepository;
import com.coresolution.core.context.TenantContextHolder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * SessionSyncServiceImpl — 회기 소진 전이는 ACTIVE 잔여 0 만.
 *
 * @author CoreSolution
 * @since 2026-10-06
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("SessionSyncServiceImpl 매핑 상태 동기화")
class SessionSyncServiceImplMappingStatusTest {

    private static final String TENANT_ID = "ss-sync-tenant";
    private static final Long PRIMARY_ID = 101L;
    private static final Long RELATED_ID = 202L;
    private static final Long CONSULTANT_ID = 7L;
    private static final Long CLIENT_ID = 9L;

    @Mock
    private ConsultantClientMappingRepository mappingRepository;
    @Mock
    private SessionExtensionRequestRepository requestRepository;
    @Mock
    private ScheduleRepository scheduleRepository;

    @InjectMocks
    private SessionSyncServiceImpl sessionSyncService;

    @BeforeEach
    void setUp() {
        TenantContextHolder.setTenantId(TENANT_ID);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @ParameterizedTest(name = "{0} 잔여 0 → 상태 유지")
    @EnumSource(value = MappingStatus.class, names = {
            "CANCELLED", "TERMINATED", "PENDING_PAYMENT", "PAYMENT_CONFIRMED"})
    void validateAndSync_keepsNonActiveZeroRemaining(MappingStatus status) {
        ConsultantClientMapping mapping = mapping(PRIMARY_ID, status, 3, 3, 0);
        when(mappingRepository.findByTenantIdAndId(TENANT_ID, PRIMARY_ID)).thenReturn(Optional.of(mapping));

        sessionSyncService.validateAndSyncMappingSessions(PRIMARY_ID);

        assertThat(mapping.getStatus()).isEqualTo(status);
        verify(mappingRepository, never()).save(any());
    }

    @Test
    @DisplayName("ACTIVE 잔여 0 → SESSIONS_EXHAUSTED 저장")
    void validateAndSync_marksOnlyActiveZeroRemainingExhausted() {
        ConsultantClientMapping mapping = mapping(PRIMARY_ID, MappingStatus.ACTIVE, 3, 3, 0);
        when(mappingRepository.findByTenantIdAndId(TENANT_ID, PRIMARY_ID)).thenReturn(Optional.of(mapping));

        sessionSyncService.validateAndSyncMappingSessions(PRIMARY_ID);

        assertThat(mapping.getStatus()).isEqualTo(MappingStatus.SESSIONS_EXHAUSTED);
        verify(mappingRepository).save(mapping);
    }

    @Test
    @DisplayName("관련 매핑 CANCELLED/TERMINATED/PENDING_PAYMENT 잔여 0 은 바꾸지 않는다")
    void syncAfterUsage_doesNotOverwriteRelatedTerminalOrAwaiting() {
        User consultant = user(CONSULTANT_ID);
        User client = user(CLIENT_ID);
        ConsultantClientMapping primary = mapping(PRIMARY_ID, MappingStatus.ACTIVE, 5, 1, 4);
        primary.setConsultant(consultant);
        primary.setClient(client);
        ConsultantClientMapping cancelled = mapping(RELATED_ID, MappingStatus.CANCELLED, 2, 2, 0);
        cancelled.setConsultant(consultant);
        cancelled.setClient(client);
        ConsultantClientMapping pending = mapping(RELATED_ID + 1, MappingStatus.PENDING_PAYMENT, 0, 0, 0);
        pending.setConsultant(consultant);
        pending.setClient(client);
        ConsultantClientMapping paymentConfirmed = mapping(RELATED_ID + 2, MappingStatus.PAYMENT_CONFIRMED, 0, 0, 0);
        paymentConfirmed.setConsultant(consultant);
        paymentConfirmed.setClient(client);
        ConsultantClientMapping terminated = mapping(RELATED_ID + 3, MappingStatus.TERMINATED, 2, 2, 0);
        terminated.setConsultant(consultant);
        terminated.setClient(client);

        when(mappingRepository.findByTenantIdAndId(TENANT_ID, PRIMARY_ID)).thenReturn(Optional.of(primary));
        when(mappingRepository.findByConsultantIdAndStatusNot(
                eq(TENANT_ID), eq(CONSULTANT_ID), eq(MappingStatus.TERMINATED)))
                .thenReturn(List.of(primary, cancelled, pending, paymentConfirmed));

        sessionSyncService.syncAfterSessionUsage(PRIMARY_ID, CONSULTANT_ID, CLIENT_ID);

        assertThat(cancelled.getStatus()).isEqualTo(MappingStatus.CANCELLED);
        assertThat(pending.getStatus()).isEqualTo(MappingStatus.PENDING_PAYMENT);
        assertThat(paymentConfirmed.getStatus()).isEqualTo(MappingStatus.PAYMENT_CONFIRMED);
        assertThat(terminated.getStatus()).isEqualTo(MappingStatus.TERMINATED);
        assertThat(primary.getStatus()).isEqualTo(MappingStatus.ACTIVE);
    }

    private static ConsultantClientMapping mapping(Long id, MappingStatus status, int total, int used, int remaining) {
        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setId(id);
        mapping.setStatus(status);
        mapping.setTotalSessions(total);
        mapping.setUsedSessions(used);
        mapping.setRemainingSessions(remaining);
        mapping.setConsultant(user(CONSULTANT_ID));
        mapping.setClient(user(CLIENT_ID));
        return mapping;
    }

    private static User user(Long id) {
        User user = new User();
        user.setId(id);
        return user;
    }
}
