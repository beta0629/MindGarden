package com.coresolution.consultation.scheduler;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.config.BatchNotificationProperties;
import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.service.BatchNotificationDispatchService;
import com.coresolution.consultation.service.BatchNotificationDispatchService.DispatchOutcome;
import com.coresolution.core.service.SchedulerAlertService;
import com.coresolution.core.service.SchedulerExecutionLogService;
import com.coresolution.core.service.TenantService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * {@link ReservationReminderScheduler} 단위 테스트.
 *
 * <p>커버 영역:
 * <ul>
 *   <li>다중 테넌트 순회 — 테넌트별 독립 처리, 한 테넌트 실패가 다른 테넌트에 전파되지 않음.</li>
 *   <li>단발성(=총 1회기) 매핑 skip — D-2 배치에서 제외.</li>
 *   <li>매핑 없음 / 잔여 0 skip.</li>
 *   <li>발송/skip/failed 카운트 집계 → SchedulerExecutionLogService 위임.</li>
 * </ul>
 *
 * @author MindGarden
 * @since 2026-05-23
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("D-2 안내 스케줄러 — 다중 테넌트 + 단발성 패키지 필터")
class ReservationReminderSchedulerTest {

    private static final String TENANT_A = "tenant-a";
    private static final String TENANT_B = "tenant-b";

    @Mock
    private TenantService tenantService;
    @Mock
    private ScheduleRepository scheduleRepository;
    @Mock
    private ConsultantClientMappingRepository mappingRepository;
    @Mock
    private BatchNotificationDispatchService dispatchService;
    @Mock
    private SchedulerExecutionLogService logService;
    @Mock
    private SchedulerAlertService alertService;

    private BatchNotificationProperties properties;
    private ReservationReminderScheduler scheduler;

    @BeforeEach
    void setUp() {
        properties = new BatchNotificationProperties();
        properties.setReservationReminderDaysAhead(2);
        scheduler = new ReservationReminderScheduler(tenantService, scheduleRepository,
            mappingRepository, dispatchService, properties, logService, alertService);
    }

    @Test
    @DisplayName("다중 테넌트 — 각 테넌트별로 dispatch 호출, 한 테넌트 실패가 다른 테넌트에 전파되지 않음")
    void runDailyReminder_iteratesAllTenants() {
        when(tenantService.getAllActiveTenantIds()).thenReturn(List.of(TENANT_A, TENANT_B));

        Schedule scheduleA = buildSchedule(101L, TENANT_A, 5001L, 6001L);
        Schedule scheduleB = buildSchedule(201L, TENANT_B, 5002L, 6002L);
        when(scheduleRepository.findByTenantIdAndDateAndStatusIn(eq(TENANT_A), any(LocalDate.class), anyList()))
            .thenReturn(List.of(scheduleA));
        when(scheduleRepository.findByTenantIdAndDateAndStatusIn(eq(TENANT_B), any(LocalDate.class), anyList()))
            .thenReturn(List.of(scheduleB));

        givenEligibleMapping(TENANT_A, 5001L, 6001L, 10, 7);
        givenEligibleMapping(TENANT_B, 5002L, 6002L, 10, 5);
        when(dispatchService.dispatchReservationReminderD2(101L))
            .thenReturn(success(701L));
        when(dispatchService.dispatchReservationReminderD2(201L))
            .thenReturn(success(702L));

        scheduler.runDailyReminder();

        verify(dispatchService).dispatchReservationReminderD2(101L);
        verify(dispatchService).dispatchReservationReminderD2(201L);
        verify(logService).saveExecutionLog(any(), eq(TENANT_A),
            eq("ReservationReminderD2"), eq("SUCCESS"), any());
        verify(logService).saveExecutionLog(any(), eq(TENANT_B),
            eq("ReservationReminderD2"), eq("SUCCESS"), any());
    }

    @Test
    @DisplayName("단발성(총 1회기) 매핑 — D-2 배치에서 skip")
    void runDailyReminder_skipsSinglePackage() {
        when(tenantService.getAllActiveTenantIds()).thenReturn(List.of(TENANT_A));
        Schedule single = buildSchedule(101L, TENANT_A, 5001L, 6001L);
        Schedule multi = buildSchedule(102L, TENANT_A, 5002L, 6002L);
        when(scheduleRepository.findByTenantIdAndDateAndStatusIn(eq(TENANT_A), any(LocalDate.class), anyList()))
            .thenReturn(List.of(single, multi));

        givenEligibleMapping(TENANT_A, 5001L, 6001L, 1, 1);
        givenEligibleMapping(TENANT_A, 5002L, 6002L, 10, 3);
        when(dispatchService.dispatchReservationReminderD2(102L))
            .thenReturn(success(701L));

        scheduler.runDailyReminder();

        verify(dispatchService, never()).dispatchReservationReminderD2(101L);
        verify(dispatchService).dispatchReservationReminderD2(102L);
    }

    @Test
    @DisplayName("매핑 없음 / 잔여 0 — dispatch 호출되지 않음")
    void runDailyReminder_skipsNoMappingOrZeroRemaining() {
        when(tenantService.getAllActiveTenantIds()).thenReturn(List.of(TENANT_A));
        Schedule noMapping = buildSchedule(101L, TENANT_A, 5001L, 6001L);
        Schedule exhausted = buildSchedule(102L, TENANT_A, 5002L, 6002L);
        when(scheduleRepository.findByTenantIdAndDateAndStatusIn(eq(TENANT_A), any(LocalDate.class), anyList()))
            .thenReturn(List.of(noMapping, exhausted));

        when(mappingRepository
            .findActiveOrExhaustedByTenantIdAndConsultantIdAndClientId(TENANT_A, 5001L, 6001L))
            .thenReturn(Optional.empty());
        givenEligibleMapping(TENANT_A, 5002L, 6002L, 10, 0);

        scheduler.runDailyReminder();

        verify(dispatchService, never()).dispatchReservationReminderD2(any());
    }

    @Test
    @DisplayName("dispatch 결과별 카운트 집계 — SKIPPED_DUPLICATE / FAILED / ALIMTALK_SENT 분류")
    void runDailyReminder_countsOutcomeBuckets() {
        when(tenantService.getAllActiveTenantIds()).thenReturn(List.of(TENANT_A));
        Schedule s1 = buildSchedule(101L, TENANT_A, 5001L, 6001L);
        Schedule s2 = buildSchedule(102L, TENANT_A, 5002L, 6002L);
        Schedule s3 = buildSchedule(103L, TENANT_A, 5003L, 6003L);
        when(scheduleRepository.findByTenantIdAndDateAndStatusIn(eq(TENANT_A), any(LocalDate.class), anyList()))
            .thenReturn(List.of(s1, s2, s3));
        givenEligibleMapping(TENANT_A, 5001L, 6001L, 10, 7);
        givenEligibleMapping(TENANT_A, 5002L, 6002L, 10, 7);
        givenEligibleMapping(TENANT_A, 5003L, 6003L, 10, 7);
        when(dispatchService.dispatchReservationReminderD2(101L)).thenReturn(success(701L));
        when(dispatchService.dispatchReservationReminderD2(102L))
            .thenReturn(new DispatchOutcome(DispatchOutcome.Status.SKIPPED_DUPLICATE,
                null, false, null, null, 702L));
        when(dispatchService.dispatchReservationReminderD2(103L))
            .thenReturn(new DispatchOutcome(DispatchOutcome.Status.FAILED,
                "ALIMTALK", true, "SEND_FAILED", "boom", 703L));

        scheduler.runDailyReminder();

        verify(logService).saveExecutionLog(any(), eq(TENANT_A),
            eq("ReservationReminderD2"), eq("SUCCESS"),
            eq("dispatched=1, skipped=1, failed=1"));
    }

    @Test
    @DisplayName("테넌트 처리 중 예외 — 다른 테넌트는 계속 처리, 실패 카운트만 증가")
    void runDailyReminder_continuesOnTenantException() {
        when(tenantService.getAllActiveTenantIds()).thenReturn(List.of(TENANT_A, TENANT_B));
        when(scheduleRepository.findByTenantIdAndDateAndStatusIn(eq(TENANT_A), any(LocalDate.class), anyList()))
            .thenThrow(new RuntimeException("tenant-a db down"));

        Schedule scheduleB = buildSchedule(201L, TENANT_B, 5002L, 6002L);
        when(scheduleRepository.findByTenantIdAndDateAndStatusIn(eq(TENANT_B), any(LocalDate.class), anyList()))
            .thenReturn(List.of(scheduleB));
        givenEligibleMapping(TENANT_B, 5002L, 6002L, 10, 5);
        when(dispatchService.dispatchReservationReminderD2(201L)).thenReturn(success(702L));

        scheduler.runDailyReminder();

        verify(logService).saveExecutionLog(any(), eq(TENANT_A),
            eq("ReservationReminderD2"), eq("FAILED"), any());
        verify(logService).saveExecutionLog(any(), eq(TENANT_B),
            eq("ReservationReminderD2"), eq("SUCCESS"), any());
        verify(dispatchService).dispatchReservationReminderD2(201L);
    }

    @Test
    @DisplayName("활성 테넌트 0개 — dispatch 호출 없음, summary 로그만 기록")
    void runDailyReminder_emptyTenantList() {
        when(tenantService.getAllActiveTenantIds()).thenReturn(Collections.emptyList());

        scheduler.runDailyReminder();

        verify(dispatchService, never()).dispatchReservationReminderD2(any());
        verify(logService, never()).saveExecutionLog(any(), any(), any(), any(), any());
    }

    // ---------------------------------------------------------------- fixtures

    private void givenEligibleMapping(String tenantId, Long consultantId, Long clientId,
            int total, int remaining) {
        ConsultantClientMapping mapping = ConsultantClientMapping.builder()
            .consultant(buildUser(consultantId))
            .client(buildUser(clientId))
            .totalSessions(total)
            .remainingSessions(remaining)
            .usedSessions(total - remaining)
            .status(MappingStatus.ACTIVE)
            .build();
        mapping.setId(consultantId * 1000 + clientId);
        mapping.setTenantId(tenantId);
        when(mappingRepository
            .findActiveOrExhaustedByTenantIdAndConsultantIdAndClientId(tenantId, consultantId, clientId))
            .thenReturn(Optional.of(mapping));
    }

    private Schedule buildSchedule(Long id, String tenantId, Long consultantId, Long clientId) {
        Schedule schedule = new Schedule();
        schedule.setId(id);
        schedule.setTenantId(tenantId);
        schedule.setConsultantId(consultantId);
        schedule.setClientId(clientId);
        schedule.setDate(LocalDate.now().plusDays(2));
        schedule.setStartTime(LocalTime.of(14, 30));
        schedule.setEndTime(LocalTime.of(15, 30));
        schedule.setStatus(ScheduleStatus.BOOKED);
        schedule.setIsDeleted(false);
        return schedule;
    }

    private User buildUser(Long id) {
        User user = new User();
        user.setId(id);
        return user;
    }

    private DispatchOutcome success(Long logId) {
        return new DispatchOutcome(DispatchOutcome.Status.ALIMTALK_SENT,
            "ALIMTALK", false, null, null, logId);
    }
}
