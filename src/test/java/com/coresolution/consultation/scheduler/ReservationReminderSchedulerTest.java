package com.coresolution.consultation.scheduler;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.config.BatchNotificationProperties;
import com.coresolution.consultation.constant.NotificationSchedulerFlagKeys;
import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.service.BatchNotificationDispatchService;
import com.coresolution.consultation.service.BatchNotificationDispatchService.DispatchOutcome;
import com.coresolution.consultation.service.MobilePushDispatchService;
import com.coresolution.consultation.service.SystemConfigService;
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
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * {@link ReservationReminderScheduler} 단위 테스트.
 *
 * <p>커버 영역:
 * <ul>
 *   <li>다중 테넌트 순회 — 테넌트별 독립 처리, 한 테넌트 실패가 다른 테넌트에 전파되지 않음.</li>
 *   <li>{@code shouldSendForSchedule} 발송 자격 판정 (P0 hotfix 회귀 보호 4종 케이스).</li>
 *   <li>발송/skip/failed 카운트 집계 → SchedulerExecutionLogService 위임.</li>
 * </ul>
 *
 * <p>P0 hotfix (2026-06-13): 회기 차감 정책 SSOT 는 (A) 예약(BOOKED) 시점 차감이므로
 * {@code remaining < 1} 잔여 가드는 모순이며 제거됨. SESSIONS_EXHAUSTED 매핑의 미래 BOOKED
 * schedule 도 D-2 안내 대상으로 정상 dispatch 되어야 한다.
 *
 * @author MindGarden
 * @since 2026-05-23
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("D-2 안내 스케줄러 — 다중 테넌트 + 단발성 필터 + 회기 차감 SSOT(A) 정합")
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
    private MobilePushDispatchService mobilePushDispatchService;
    @Mock
    private SchedulerExecutionLogService logService;
    @Mock
    private SchedulerAlertService alertService;
    @Mock
    private SystemConfigService systemConfigService;

    private BatchNotificationProperties properties;
    private ReservationReminderScheduler scheduler;

    @BeforeEach
    void setUp() {
        properties = new BatchNotificationProperties();
        properties.setReservationReminderDaysAhead(2);
        scheduler = new ReservationReminderScheduler(tenantService, scheduleRepository,
            mappingRepository, dispatchService, mobilePushDispatchService, properties,
            logService, alertService, systemConfigService);
        // 기본: DB 플래그 ON (기존 테스트 시나리오 그대로 동작).
        when(systemConfigService.getGlobalBoolean(
                eq(NotificationSchedulerFlagKeys.RESERVATION_REMINDER_ENABLED), anyBoolean()))
            .thenReturn(true);
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

    // ------------------------------------------------------------------
    // shouldSendForSchedule — P0 hotfix 회귀 보호 4종 (2026-06-13)
    //   case1: ACTIVE  + remaining=2          → dispatch ✓
    //   case2: EXHAUST + remaining=0 (total=2)→ dispatch ✓  (핫픽스 핵심)
    //   case3: ACTIVE  + total=1              → skip       (단발성 정책 유지)
    //   case4: 매핑 없음                       → skip       (이상 데이터 차단)
    // ------------------------------------------------------------------

    @Test
    @DisplayName("case1 — ACTIVE 매핑 + remaining=2 → dispatch (회귀 보호)")
    void shouldSend_case1_activeWithRemaining_dispatches() {
        when(tenantService.getAllActiveTenantIds()).thenReturn(List.of(TENANT_A));
        Schedule schedule = buildSchedule(101L, TENANT_A, 5001L, 6001L);
        when(scheduleRepository.findByTenantIdAndDateAndStatusIn(eq(TENANT_A), any(LocalDate.class), anyList()))
            .thenReturn(List.of(schedule));
        givenMapping(TENANT_A, 5001L, 6001L, 10, 2, MappingStatus.ACTIVE);
        when(dispatchService.dispatchReservationReminderD2(101L)).thenReturn(success(701L));

        scheduler.runDailyReminder();

        verify(dispatchService).dispatchReservationReminderD2(101L);
    }

    @Test
    @DisplayName("case2 — SESSIONS_EXHAUSTED + remaining=0 + total=2 → dispatch (P0 hotfix 핵심)")
    void shouldSend_case2_exhaustedWithZeroRemaining_dispatches() {
        when(tenantService.getAllActiveTenantIds()).thenReturn(List.of(TENANT_A));
        Schedule schedule = buildSchedule(101L, TENANT_A, 5001L, 6001L);
        when(scheduleRepository.findByTenantIdAndDateAndStatusIn(eq(TENANT_A), any(LocalDate.class), anyList()))
            .thenReturn(List.of(schedule));
        // 회기 차감 정책 SSOT (A): 미래 BOOKED schedule 의 회기는 이미 used 에 카운트되어
        // remaining=0 + SESSIONS_EXHAUSTED 가 정상 상태. D-2 안내는 발송되어야 한다.
        givenMapping(TENANT_A, 5001L, 6001L, 2, 0, MappingStatus.SESSIONS_EXHAUSTED);
        when(dispatchService.dispatchReservationReminderD2(101L)).thenReturn(success(701L));

        scheduler.runDailyReminder();

        verify(dispatchService).dispatchReservationReminderD2(101L);
    }

    @Test
    @DisplayName("case3 — ACTIVE 매핑 + total=1 (단발성) → skip (회귀 보호)")
    void shouldSend_case3_singlePackage_skips() {
        when(tenantService.getAllActiveTenantIds()).thenReturn(List.of(TENANT_A));
        Schedule schedule = buildSchedule(101L, TENANT_A, 5001L, 6001L);
        when(scheduleRepository.findByTenantIdAndDateAndStatusIn(eq(TENANT_A), any(LocalDate.class), anyList()))
            .thenReturn(List.of(schedule));
        givenMapping(TENANT_A, 5001L, 6001L, 1, 1, MappingStatus.ACTIVE);

        scheduler.runDailyReminder();

        verify(dispatchService, never()).dispatchReservationReminderD2(any());
    }

    @Test
    @DisplayName("case4 — 매핑 없음 → skip (이상 데이터 차단)")
    void shouldSend_case4_noMapping_skips() {
        when(tenantService.getAllActiveTenantIds()).thenReturn(List.of(TENANT_A));
        Schedule schedule = buildSchedule(101L, TENANT_A, 5001L, 6001L);
        when(scheduleRepository.findByTenantIdAndDateAndStatusIn(eq(TENANT_A), any(LocalDate.class), anyList()))
            .thenReturn(List.of(schedule));
        when(mappingRepository
            .findActiveOrExhaustedListByTenantIdAndConsultantIdAndClientId(TENANT_A, 5001L, 6001L))
            .thenReturn(List.of());

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

    @Test
    @DisplayName("D-2 푸시 — 알림톡 발화 직후 mobilePushDispatchService.dispatchBookingReminder 호출 (내담자·상담사 양쪽)")
    void runDailyReminder_triggersD2BookingReminderPushPerSchedule() {
        when(tenantService.getAllActiveTenantIds()).thenReturn(List.of(TENANT_A));
        Schedule scheduleA = buildSchedule(101L, TENANT_A, 5001L, 6001L);
        when(scheduleRepository.findByTenantIdAndDateAndStatusIn(eq(TENANT_A), any(LocalDate.class), anyList()))
            .thenReturn(List.of(scheduleA));
        givenEligibleMapping(TENANT_A, 5001L, 6001L, 10, 7);
        when(dispatchService.dispatchReservationReminderD2(101L)).thenReturn(success(701L));

        scheduler.runDailyReminder();

        verify(mobilePushDispatchService, times(1)).dispatchBookingReminder(
            eq(TENANT_A), eq(scheduleA), any(String.class), eq("D2"));
    }

    @Test
    @DisplayName("D-2 푸시 실패는 본 배치 실행에 영향 없음 — 카운트 보존")
    void runDailyReminder_doesNotPropagatePushErrors() {
        when(tenantService.getAllActiveTenantIds()).thenReturn(List.of(TENANT_A));
        Schedule scheduleA = buildSchedule(101L, TENANT_A, 5001L, 6001L);
        when(scheduleRepository.findByTenantIdAndDateAndStatusIn(eq(TENANT_A), any(LocalDate.class), anyList()))
            .thenReturn(List.of(scheduleA));
        givenEligibleMapping(TENANT_A, 5001L, 6001L, 10, 7);
        when(dispatchService.dispatchReservationReminderD2(101L)).thenReturn(success(701L));
        org.mockito.Mockito.doThrow(new RuntimeException("expo down"))
            .when(mobilePushDispatchService).dispatchBookingReminder(
                eq(TENANT_A), eq(scheduleA), any(String.class), eq("D2"));

        scheduler.runDailyReminder();

        // 푸시 실패는 swallow — dispatched=1 이 그대로 기록되어야 한다.
        verify(logService).saveExecutionLog(any(), eq(TENANT_A),
            eq("ReservationReminderD2"), eq("SUCCESS"),
            eq("dispatched=1, skipped=0, failed=0"));
    }

    @Test
    @DisplayName("DB 플래그 OFF — 본문 진입 차단, TenantService/dispatch 호출 없음")
    void runDailyReminder_disabledByDbFlag_shortCircuits() {
        when(systemConfigService.getGlobalBoolean(
                eq(NotificationSchedulerFlagKeys.RESERVATION_REMINDER_ENABLED), anyBoolean()))
            .thenReturn(false);

        scheduler.runDailyReminder();

        verifyNoInteractions(tenantService);
        verifyNoInteractions(scheduleRepository);
        verify(dispatchService, never()).dispatchReservationReminderD2(any());
        verifyNoInteractions(logService);
    }

    @Test
    @DisplayName("DB 플래그 ON — 기존 다중 테넌트 실행 경로 그대로 동작")
    void runDailyReminder_enabledByDbFlag_executesNormally() {
        when(systemConfigService.getGlobalBoolean(
                eq(NotificationSchedulerFlagKeys.RESERVATION_REMINDER_ENABLED), anyBoolean()))
            .thenReturn(true);
        when(tenantService.getAllActiveTenantIds()).thenReturn(List.of(TENANT_A));
        Schedule scheduleA = buildSchedule(101L, TENANT_A, 5001L, 6001L);
        when(scheduleRepository.findByTenantIdAndDateAndStatusIn(eq(TENANT_A), any(LocalDate.class), anyList()))
            .thenReturn(List.of(scheduleA));
        givenEligibleMapping(TENANT_A, 5001L, 6001L, 10, 7);
        when(dispatchService.dispatchReservationReminderD2(101L)).thenReturn(success(701L));

        scheduler.runDailyReminder();

        verify(dispatchService).dispatchReservationReminderD2(101L);
    }

    // ---------------------------------------------------------------- fixtures

    private void givenEligibleMapping(String tenantId, Long consultantId, Long clientId,
            int total, int remaining) {
        givenMapping(tenantId, consultantId, clientId, total, remaining, MappingStatus.ACTIVE);
    }

    private void givenMapping(String tenantId, Long consultantId, Long clientId,
            int total, int remaining, MappingStatus status) {
        ConsultantClientMapping mapping = ConsultantClientMapping.builder()
            .consultant(buildUser(consultantId))
            .client(buildUser(clientId))
            .totalSessions(total)
            .remainingSessions(remaining)
            .usedSessions(total - remaining)
            .status(status)
            .build();
        mapping.setId(consultantId * 1000 + clientId);
        mapping.setTenantId(tenantId);
        when(mappingRepository
            .findActiveOrExhaustedListByTenantIdAndConsultantIdAndClientId(tenantId, consultantId, clientId))
            .thenReturn(java.util.List.of(mapping));
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
