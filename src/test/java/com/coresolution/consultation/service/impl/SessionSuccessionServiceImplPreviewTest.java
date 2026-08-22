package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Collection;
import java.util.Optional;

import com.coresolution.consultation.constant.SessionSuccessionConstants;
import com.coresolution.consultation.dto.SessionSuccessionPreviewResponse;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.AdminService;
import com.coresolution.consultation.service.AuditLogService;
import com.coresolution.core.context.TenantContextHolder;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * 회기 승계 미리보기 산식 단위 테스트 (PLAN §3.2 — COMPLETED 비포함).
 *
 * @author CoreSolution
 * @since 2026-08-22
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("SessionSuccessionServiceImpl.preview — 승계가능 산식")
class SessionSuccessionServiceImplPreviewTest {

    private static final String TENANT = "tenant-test";

    @Mock
    private ConsultantClientMappingRepository mappingRepository;
    @Mock
    private ScheduleRepository scheduleRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private AdminService adminService;
    @Mock
    private AuditLogService auditLogService;
    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private SessionSuccessionServiceImpl sessionSuccessionService;

    @BeforeEach
    void setUp() {
        TenantContextHolder.setTenantId(TENANT);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    void preview_transferableEqualsRemainingMinusOccupying() {
        User consultant = new User();
        consultant.setId(10L);
        consultant.setName("상담사");
        User client = new User();
        client.setId(20L);
        client.setName("내담자");
        ConsultantClientMapping source = new ConsultantClientMapping();
        source.setId(100L);
        source.setTenantId(TENANT);
        source.setConsultant(consultant);
        source.setClient(client);
        source.setRemainingSessions(8);
        source.setUsedSessions(2);
        source.setTotalSessions(10);
        source.setPackageName("10회기");
        source.setStatus(ConsultantClientMapping.MappingStatus.ACTIVE);

        when(mappingRepository.findByTenantIdAndId(TENANT, 100L)).thenReturn(Optional.of(source));
        when(scheduleRepository.countOccupyingConsultationSchedulesForMapping(
                eq(TENANT), eq(100L), eq(10L), eq(20L), any(Collection.class)))
                .thenReturn(3L);

        SessionSuccessionPreviewResponse preview = sessionSuccessionService.preview(100L);

        assertThat(preview.getRemainingSessions()).isEqualTo(8);
        assertThat(preview.getOccupyingScheduleCount()).isEqualTo(3);
        assertThat(preview.getTransferableSessions()).isEqualTo(5);

        ArgumentCaptor<Collection> statusesCaptor = ArgumentCaptor.forClass(Collection.class);
        verify(scheduleRepository).countOccupyingConsultationSchedulesForMapping(
                eq(TENANT), eq(100L), eq(10L), eq(20L), statusesCaptor.capture());
        assertThat(statusesCaptor.getValue())
                .containsExactlyInAnyOrderElementsOf(
                        SessionSuccessionConstants.OCCUPYING_STATUSES_FOR_SUCCESSION);
        assertThat(statusesCaptor.getValue())
                .doesNotContain(com.coresolution.consultation.constant.ScheduleStatus.COMPLETED);
    }

    @Test
    void preview_transferableClampsAtZero() {
        User consultant = new User();
        consultant.setId(10L);
        consultant.setName("상담사");
        User client = new User();
        client.setId(20L);
        client.setName("내담자");
        ConsultantClientMapping source = new ConsultantClientMapping();
        source.setId(101L);
        source.setTenantId(TENANT);
        source.setConsultant(consultant);
        source.setClient(client);
        source.setRemainingSessions(2);
        source.setUsedSessions(8);
        source.setTotalSessions(10);
        source.setStatus(ConsultantClientMapping.MappingStatus.ACTIVE);

        when(mappingRepository.findByTenantIdAndId(TENANT, 101L)).thenReturn(Optional.of(source));
        when(scheduleRepository.countOccupyingConsultationSchedulesForMapping(
                eq(TENANT), eq(101L), eq(10L), eq(20L), any(Collection.class)))
                .thenReturn(5L);

        SessionSuccessionPreviewResponse preview = sessionSuccessionService.preview(101L);

        assertThat(preview.getTransferableSessions()).isEqualTo(0);
        assertThat(preview.getOccupyingScheduleCount()).isEqualTo(5);
    }
}
