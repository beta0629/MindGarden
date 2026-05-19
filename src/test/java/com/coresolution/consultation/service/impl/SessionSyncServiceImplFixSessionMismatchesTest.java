package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.entity.ConsultantClientMapping;
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
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * SessionSyncServiceImpl - fixSessionMismatches 일정 수 정합 단위 테스트
 *
 * @author MindGarden
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("SessionSyncServiceImpl fixSessionMismatches 단위 테스트")
class SessionSyncServiceImplFixSessionMismatchesTest {

    private static final String TENANT_ID = "test-tenant";
    private static final Long MAPPING_ID = 32L;
    private static final Long CONSULTANT_ID = 5L;
    private static final Long CLIENT_ID = 14L;

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

    @Test
    @DisplayName("reconcileMappingSessionsFromSchedules - 일정 수와 used 불일치 시 used/remaining 재계산")
    void reconcileMappingSessionsFromSchedules_correctsUsedAndRemaining() {
        User consultant = new User();
        consultant.setId(CONSULTANT_ID);
        User client = new User();
        client.setId(CLIENT_ID);

        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setId(MAPPING_ID);
        mapping.setConsultant(consultant);
        mapping.setClient(client);
        mapping.setTotalSessions(10);
        mapping.setUsedSessions(7);
        mapping.setRemainingSessions(3);

        when(scheduleRepository.countOccupyingConsultationSchedulesForMapping(
                eq(TENANT_ID), eq(MAPPING_ID), eq(CONSULTANT_ID), eq(CLIENT_ID), any()))
                .thenReturn(4L);

        boolean changed = sessionSyncService.reconcileMappingSessionsFromSchedules(TENANT_ID, mapping);

        assertThat(changed).isTrue();
        assertThat(mapping.getUsedSessions()).isEqualTo(4);
        assertThat(mapping.getRemainingSessions()).isEqualTo(6);
    }

    @Test
    @DisplayName("fixSessionMismatches - 불일치 매핑 저장")
    void fixSessionMismatches_savesReconciledMapping() {
        User consultant = new User();
        consultant.setId(CONSULTANT_ID);
        User client = new User();
        client.setId(CLIENT_ID);

        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setId(MAPPING_ID);
        mapping.setConsultant(consultant);
        mapping.setClient(client);
        mapping.setTotalSessions(10);
        mapping.setUsedSessions(7);
        mapping.setRemainingSessions(3);

        when(mappingRepository.findByTenantId(TENANT_ID)).thenReturn(List.of(mapping));
        when(scheduleRepository.countOccupyingConsultationSchedulesForMapping(
                eq(TENANT_ID), eq(MAPPING_ID), eq(CONSULTANT_ID), eq(CLIENT_ID), any()))
                .thenReturn(4L);

        sessionSyncService.fixSessionMismatches();

        assertThat(mapping.getUsedSessions()).isEqualTo(4);
        assertThat(mapping.getRemainingSessions()).isEqualTo(6);
        verify(mappingRepository).save(mapping);
    }
}
