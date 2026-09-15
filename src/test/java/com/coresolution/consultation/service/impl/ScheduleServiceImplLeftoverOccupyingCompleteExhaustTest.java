package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.constant.SessionSuccessionConstants;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.core.context.TenantContextHolder;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * COMPLETE 시 leftover occupying 소진·일반 완료 이중차감 금지 단위 테스트.
 *
 * @author MindGarden
 * @since 2026-09-12
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ScheduleServiceImpl leftover occupying 완료 소진")
class ScheduleServiceImplLeftoverOccupyingCompleteExhaustTest {

    @Mock
    private ConsultantClientMappingRepository mappingRepository;

    @InjectMocks
    private ScheduleServiceImpl scheduleService;

    private String tenantId;
    private Long scheduleId;
    private Long mappingId;
    private Long consultantId;
    private Long clientId;

    @BeforeEach
    void setUp() {
        tenantId = "tenant-leftover-" + UUID.randomUUID();
        scheduleId = nextId();
        mappingId = nextId();
        consultantId = nextId();
        clientId = nextId();
        TenantContextHolder.setTenantId(tenantId);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("승계 후 rem=1 + occupying COMPLETED → rem=0 + SESSIONS_EXHAUSTED")
    void leftoverOccupyingComplete_exhaustsRemaining() {
        Schedule schedule = occupyingConsultation(1);
        ConsultantClientMapping mapping = leftoverSourceMapping(1);

        when(mappingRepository.findByTenantIdAndId(eq(tenantId), eq(mappingId)))
                .thenReturn(Optional.of(mapping));
        when(mappingRepository.save(any(ConsultantClientMapping.class))).thenAnswer(inv -> inv.getArgument(0));

        scheduleService.deductSessionAtCompletionIfNeeded(schedule);

        ArgumentCaptor<ConsultantClientMapping> captor = ArgumentCaptor.forClass(ConsultantClientMapping.class);
        verify(mappingRepository).save(captor.capture());
        ConsultantClientMapping saved = captor.getValue();
        assertThat(saved.getRemainingSessions()).isZero();
        // rem↓ 시 used↑ — total==used+remaining 불변식 유지
        assertThat(saved.getUsedSessions()).isEqualTo(5);
        assertThat(saved.getTotalSessions()).isEqualTo(5);
        assertThat(saved.getTotalSessions())
                .isEqualTo(saved.getUsedSessions() + saved.getRemainingSessions());
        assertThat(saved.getStatus()).isEqualTo(MappingStatus.SESSIONS_EXHAUSTED);
        assertThat(saved.getEndDate()).isNotNull();
    }

    @Test
    @DisplayName("승계 없는 일반 완료(sessionSequence 있음)는 rem 불변")
    void regularCompleteWithSessionSequence_doesNotDeductAgain() {
        Schedule schedule = occupyingConsultation(3);
        ConsultantClientMapping mapping = regularActiveMapping(5);

        when(mappingRepository.findByTenantIdAndId(eq(tenantId), eq(mappingId)))
                .thenReturn(Optional.of(mapping));

        scheduleService.deductSessionAtCompletionIfNeeded(schedule);

        verify(mappingRepository, never()).save(any(ConsultantClientMapping.class));
        assertThat(mapping.getRemainingSessions()).isEqualTo(5);
        assertThat(mapping.getUsedSessions()).isEqualTo(2);
        assertThat(mapping.getStatus()).isEqualTo(MappingStatus.ACTIVE);
    }

    private Schedule occupyingConsultation(int sessionSequence) {
        Schedule schedule = new Schedule();
        schedule.setId(scheduleId);
        schedule.setTenantId(tenantId);
        schedule.setStatus(ScheduleStatus.CONFIRMED);
        schedule.setScheduleType("CONSULTATION");
        schedule.setConsultantId(consultantId);
        schedule.setClientId(clientId);
        schedule.setMappingId(mappingId);
        schedule.setSessionSequence(sessionSequence);
        return schedule;
    }

    private ConsultantClientMapping leftoverSourceMapping(int remainingSessions) {
        User consultant = new User();
        consultant.setId(consultantId);
        User client = new User();
        client.setId(clientId);
        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setId(mappingId);
        mapping.setTenantId(tenantId);
        mapping.setConsultant(consultant);
        mapping.setClient(client);
        mapping.setStatus(MappingStatus.ACTIVE);
        mapping.setRemainingSessions(remainingSessions);
        mapping.setUsedSessions(4);
        mapping.setTotalSessions(4 + remainingSessions);
        mapping.setNotes(SessionSuccessionConstants.SOURCE_NOTE_MARKER
                + " 3회 "
                + SessionSuccessionConstants.SOURCE_NOTE_TARGET_MAPPING_ARROW
                + nextId());
        return mapping;
    }

    private ConsultantClientMapping regularActiveMapping(int remainingSessions) {
        User consultant = new User();
        consultant.setId(consultantId);
        User client = new User();
        client.setId(clientId);
        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setId(mappingId);
        mapping.setTenantId(tenantId);
        mapping.setConsultant(consultant);
        mapping.setClient(client);
        mapping.setStatus(MappingStatus.ACTIVE);
        mapping.setRemainingSessions(remainingSessions);
        mapping.setUsedSessions(2);
        mapping.setTotalSessions(2 + remainingSessions);
        mapping.setNotes("일반 예약 매칭");
        return mapping;
    }

    private static long nextId() {
        return ThreadLocalRandom.current().nextLong(1_000L, 9_000_000L);
    }
}
