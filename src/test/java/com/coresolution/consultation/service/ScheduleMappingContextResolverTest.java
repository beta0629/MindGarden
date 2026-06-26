package com.coresolution.consultation.service;

import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.service.ScheduleMappingContextResolver.ScheduleMappingResponseContext;
import com.coresolution.core.context.TenantContextHolder;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

/**
 * 김민선(client 14)·단회기→10회기 전환 시 캘린더 회기 응답 컨텍스트 단위 테스트.
 *
 * @author CoreSolution
 * @since 2026-05-20
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ScheduleMappingContextResolver")
class ScheduleMappingContextResolverTest {

    private static final String TENANT_ID = "tenant-kim-minseon";
    private static final Long CONSULTANT_ID = 3L;
    private static final Long CLIENT_ID = 14L;

    @Mock
    private ConsultantClientMappingRepository mappingRepository;

    @BeforeEach
    void setUp() {
        TenantContextHolder.setTenantId(TENANT_ID);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("4/4 단회기 일정 — totalSessions=1, sessionSequence=1 (표기 없음은 프론트)")
    void singleSessionSchedule_usesHistoricalMappingTotal() {
        ConsultantClientMapping singleMapping = mapping(11L, 1, 0, MappingStatus.TERMINATED,
                LocalDateTime.of(2026, 4, 3, 10, 0),
                LocalDateTime.of(2026, 4, 17, 17, 22));
        ConsultantClientMapping tenPackMapping = mapping(32L, 10, 5, MappingStatus.ACTIVE,
                LocalDateTime.of(2026, 4, 17, 17, 22), null);

        Schedule schedule = schedule(2L, 11L, 1,
                LocalDateTime.of(2026, 4, 3, 9, 0),
                LocalDate.of(2026, 4, 4));

        when(mappingRepository.findByTenantIdAndId(TENANT_ID, 11L)).thenReturn(Optional.of(singleMapping));
        when(mappingRepository.findActiveOrExhaustedListByTenantIdAndConsultantIdAndClientId(
                TENANT_ID, CONSULTANT_ID, CLIENT_ID)).thenReturn(List.of(tenPackMapping));

        ScheduleMappingResponseContext context = ScheduleMappingContextResolver.resolveForScheduleResponse(
                schedule, TENANT_ID, mappingRepository, Map.of());

        assertThat(context.getMappingId()).isEqualTo(11L);
        assertThat(context.getTotalSessions()).isEqualTo(1);
        assertThat(context.getRemainingSessions()).isEqualTo(5);
        assertThat(schedule.getSessionSequence()).isEqualTo(1);
    }

    @Test
    @DisplayName("4/22 10회기 1회차 — totalSessions=10, sessionSequence=1")
    void tenPackFirstSession_usesTenPackMappingTotal() {
        ConsultantClientMapping tenPackMapping = mapping(32L, 10, 9, MappingStatus.ACTIVE,
                LocalDateTime.of(2026, 4, 17, 17, 22), null);

        Schedule schedule = schedule(31L, 32L, 1,
                LocalDateTime.of(2026, 4, 21, 10, 0),
                LocalDate.of(2026, 4, 22));

        when(mappingRepository.findByTenantIdAndId(TENANT_ID, 32L)).thenReturn(Optional.of(tenPackMapping));
        when(mappingRepository.findActiveOrExhaustedListByTenantIdAndConsultantIdAndClientId(
                TENANT_ID, CONSULTANT_ID, CLIENT_ID)).thenReturn(List.of(tenPackMapping));

        ScheduleMappingResponseContext context = ScheduleMappingContextResolver.resolveForScheduleResponse(
                schedule, TENANT_ID, mappingRepository, Map.of());

        assertThat(context.getMappingId()).isEqualTo(32L);
        assertThat(context.getTotalSessions()).isEqualTo(10);
        assertThat(context.getRemainingSessions()).isEqualTo(9);
        assertThat(schedule.getSessionSequence()).isEqualTo(1);
    }

    @Test
    @DisplayName("mapping_id 없을 때 created_at 기준 TERMINATED 단회기 매칭 역산")
    void resolvesMappingAtBookingTimeWhenMappingIdMissing() {
        ConsultantClientMapping singleMapping = mapping(17L, 1, 0, MappingStatus.TERMINATED,
                LocalDateTime.of(2026, 4, 7, 8, 0),
                LocalDateTime.of(2026, 4, 17, 17, 22));
        ConsultantClientMapping tenPackMapping = mapping(32L, 10, 8, MappingStatus.ACTIVE,
                LocalDateTime.of(2026, 4, 17, 17, 22), null);

        Schedule schedule = schedule(14L, null, 1,
                LocalDateTime.of(2026, 4, 7, 12, 0),
                LocalDate.of(2026, 4, 8));

        when(mappingRepository.findAllByTenantIdAndConsultantIdAndClientIdOrderByCreatedAtDesc(
                eq(TENANT_ID), eq(CONSULTANT_ID), eq(CLIENT_ID)))
                .thenReturn(List.of(tenPackMapping, singleMapping));
        when(mappingRepository.findActiveOrExhaustedListByTenantIdAndConsultantIdAndClientId(
                TENANT_ID, CONSULTANT_ID, CLIENT_ID)).thenReturn(List.of(tenPackMapping));

        ScheduleMappingResponseContext context = ScheduleMappingContextResolver.resolveForScheduleResponse(
                schedule, TENANT_ID, mappingRepository, Map.of());

        assertThat(context.getMappingId()).isEqualTo(17L);
        assertThat(context.getTotalSessions()).isEqualTo(1);
    }

    @Test
    @DisplayName("복수 ACTIVE/SESSIONS_EXHAUSTED 매핑 — ACTIVE 최신 1건 선택 (NonUnique 방지)")
    void selectLatestActiveOrExhaustedMapping_prefersLatestActive() {
        ConsultantClientMapping olderActive = mapping(10L, 5, 2, MappingStatus.ACTIVE,
                LocalDateTime.of(2026, 4, 1, 9, 0), null);
        olderActive.setUpdatedAt(LocalDateTime.of(2026, 4, 1, 9, 0));
        ConsultantClientMapping newerActive = mapping(11L, 10, 8, MappingStatus.ACTIVE,
                LocalDateTime.of(2026, 4, 10, 9, 0), null);
        newerActive.setUpdatedAt(LocalDateTime.of(2026, 4, 10, 9, 0));

        var selected = ScheduleMappingContextResolver.selectLatestActiveOrExhaustedMapping(
                List.of(olderActive, newerActive));

        assertThat(selected).isPresent();
        assertThat(selected.get().getId()).isEqualTo(11L);
    }

    private static Schedule schedule(
            Long id,
            Long mappingId,
            int sessionSequence,
            LocalDateTime createdAt,
            LocalDate date) {
        Schedule schedule = new Schedule();
        schedule.setId(id);
        schedule.setTenantId(TENANT_ID);
        schedule.setConsultantId(CONSULTANT_ID);
        schedule.setClientId(CLIENT_ID);
        schedule.setMappingId(mappingId);
        schedule.setSessionSequence(sessionSequence);
        schedule.setCreatedAt(createdAt);
        schedule.setDate(date);
        schedule.setStartTime(LocalTime.of(17, 0));
        schedule.setEndTime(LocalTime.of(18, 0));
        schedule.setScheduleType("CONSULTATION");
        return schedule;
    }

    private static ConsultantClientMapping mapping(
            Long id,
            int total,
            int remaining,
            MappingStatus status,
            LocalDateTime createdAt,
            LocalDateTime terminatedAt) {
        User consultant = new User();
        consultant.setId(CONSULTANT_ID);
        User client = new User();
        client.setId(CLIENT_ID);
        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setId(id);
        mapping.setTenantId(TENANT_ID);
        mapping.setConsultant(consultant);
        mapping.setClient(client);
        mapping.setTotalSessions(total);
        mapping.setRemainingSessions(remaining);
        mapping.setStatus(status);
        mapping.setCreatedAt(createdAt);
        mapping.setTerminatedAt(terminatedAt);
        return mapping;
    }
}
