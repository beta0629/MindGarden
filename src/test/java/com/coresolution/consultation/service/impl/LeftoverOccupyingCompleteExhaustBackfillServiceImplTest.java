package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.AuditAction;
import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.constant.SessionSuccessionConstants;
import com.coresolution.consultation.dto.LeftoverOccupyingCompleteExhaustBackfillResult;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.AuditLogRepository;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.repository.TenantRepository;
import java.time.LocalDateTime;
import java.util.List;
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
 * leftover occupying 완료 rem 백필 서비스 단위 테스트.
 *
 * @author MindGarden
 * @since 2026-09-12
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("LeftoverOccupyingCompleteExhaustBackfillServiceImpl")
class LeftoverOccupyingCompleteExhaustBackfillServiceImplTest {

    @Mock
    private ConsultantClientMappingRepository mappingRepository;

    @Mock
    private ScheduleRepository scheduleRepository;

    @Mock
    private AuditLogRepository auditLogRepository;

    @Mock
    private TenantRepository tenantRepository;

    @InjectMocks
    private LeftoverOccupyingCompleteExhaustBackfillServiceImpl backfillService;

    private String tenantId;
    private Long mappingId;
    private Long consultantId;
    private Long clientId;

    @BeforeEach
    void setUp() {
        tenantId = "tenant-backfill-" + UUID.randomUUID();
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
    @DisplayName("tenantId 없으면 조회하지 않는다")
    void missingTenantId_throws() {
        TenantContextHolder.clear();

        assertThatThrownBy(() -> backfillService.backfillTenant(null))
                .isInstanceOf(IllegalStateException.class);
        verify(mappingRepository, never()).findActiveWithRemainingAndSuccessionNotes(
                any(), any(), any(), any());
    }

    @Test
    @DisplayName("동형 leftover 백필 적용")
    void leftoverCompleted_applies() {
        ConsultantClientMapping mapping = leftoverSource(1);
        Schedule completed = completedSchedule(1);
        stubCandidates(List.of(mapping));
        stubOccupying(0);
        stubCompleted(List.of(completed));
        when(mappingRepository.save(any(ConsultantClientMapping.class))).thenAnswer(inv -> inv.getArgument(0));

        LeftoverOccupyingCompleteExhaustBackfillResult result = backfillService.backfillTenant(tenantId);

        ArgumentCaptor<ConsultantClientMapping> captor = ArgumentCaptor.forClass(ConsultantClientMapping.class);
        verify(mappingRepository).save(captor.capture());
        assertThat(result.getApplied()).isEqualTo(1);
        assertThat(captor.getValue().getRemainingSessions()).isZero();
        assertThat(captor.getValue().getStatus()).isEqualTo(MappingStatus.SESSIONS_EXHAUSTED);
    }

    @Test
    @DisplayName("occupying 진행 중이면 스킵")
    void occupyingInProgress_skips() {
        ConsultantClientMapping mapping = leftoverSource(1);
        stubCandidates(List.of(mapping));
        stubOccupying(1);
        stubCompleted(List.of());

        LeftoverOccupyingCompleteExhaustBackfillResult result = backfillService.backfillTenant(tenantId);

        verify(mappingRepository, never()).save(any(ConsultantClientMapping.class));
        assertThat(result.getSkippedOccupyingInProgress()).isEqualTo(1);
        assertThat(mapping.getRemainingSessions()).isEqualTo(1);
        assertThat(mapping.getStatus()).isEqualTo(MappingStatus.ACTIVE);
    }

    @Test
    @DisplayName("CANCELLED leftover는 후보 쿼리에 없고 스킵")
    void cancelledLeftover_notInActiveQuery() {
        stubCandidates(List.of());

        LeftoverOccupyingCompleteExhaustBackfillResult result = backfillService.backfillTenant(tenantId);

        verify(mappingRepository).findActiveWithRemainingAndSuccessionNotes(
                eq(tenantId),
                eq(MappingStatus.ACTIVE),
                eq(SessionSuccessionConstants.SOURCE_NOTE_TARGET_MAPPING_ARROW),
                eq(SessionSuccessionConstants.SOURCE_NOTE_MARKER));
        verify(mappingRepository, never()).save(any(ConsultantClientMapping.class));
        assertThat(result.getScanned()).isZero();
        assertThat(result.getApplied()).isZero();
    }

    @Test
    @DisplayName("진짜 잔여 rem은 leftover occupying 차감분과 다르면 스킵")
    void trueRemaining_skips() {
        ConsultantClientMapping mapping = leftoverSource(10);
        stubCandidates(List.of(mapping));
        stubOccupying(0);
        stubCompleted(List.of());

        LeftoverOccupyingCompleteExhaustBackfillResult result = backfillService.backfillTenant(tenantId);

        verify(mappingRepository, never()).save(any(ConsultantClientMapping.class));
        assertThat(result.getSkippedTrueRemaining()).isEqualTo(1);
        assertThat(mapping.getRemainingSessions()).isEqualTo(10);
        assertThat(mapping.getStatus()).isEqualTo(MappingStatus.ACTIVE);
    }

    private void stubCandidates(List<ConsultantClientMapping> mappings) {
        when(auditLogRepository.findByTenantIdAndActionAndEntityType(
                eq(tenantId),
                eq(AuditAction.MAPPING_SESSION_SUCCESSION),
                eq(SessionSuccessionConstants.ENTITY_TYPE_MAPPING)))
                .thenReturn(List.of());
        when(mappingRepository.findActiveWithRemainingAndSuccessionNotes(
                eq(tenantId),
                eq(MappingStatus.ACTIVE),
                eq(SessionSuccessionConstants.SOURCE_NOTE_TARGET_MAPPING_ARROW),
                eq(SessionSuccessionConstants.SOURCE_NOTE_MARKER)))
                .thenReturn(mappings);
    }

    private void stubOccupying(long count) {
        when(scheduleRepository.countOccupyingConsultationSchedulesForMapping(
                eq(tenantId),
                eq(mappingId),
                eq(consultantId),
                eq(clientId),
                eq(SessionSuccessionConstants.OCCUPYING_STATUSES_FOR_SUCCESSION)))
                .thenReturn(count);
    }

    private void stubCompleted(List<Schedule> schedules) {
        when(scheduleRepository.findDeductedConsultationSchedulesForMapping(
                eq(tenantId),
                eq(mappingId),
                eq(consultantId),
                eq(clientId),
                anyCollection()))
                .thenReturn(schedules);
    }

    private ConsultantClientMapping leftoverSource(int remainingSessions) {
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
        mapping.setUpdatedAt(LocalDateTime.now().minusDays(2));
        mapping.setNotes(SessionSuccessionConstants.SOURCE_NOTE_MARKER
                + " 3회 "
                + SessionSuccessionConstants.SOURCE_NOTE_TARGET_MAPPING_ARROW
                + nextId());
        return mapping;
    }

    private Schedule completedSchedule(int sessionSequence) {
        Schedule schedule = new Schedule();
        schedule.setId(nextId());
        schedule.setTenantId(tenantId);
        schedule.setMappingId(mappingId);
        schedule.setConsultantId(consultantId);
        schedule.setClientId(clientId);
        schedule.setStatus(ScheduleStatus.COMPLETED);
        schedule.setSessionSequence(sessionSequence);
        schedule.setUpdatedAt(LocalDateTime.now());
        return schedule;
    }

    private static long nextId() {
        return ThreadLocalRandom.current().nextLong(1_000L, 9_000_000L);
    }
}
