package com.coresolution.consultation.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.util.ReservationSmsBusinessHours;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.service.TenantService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.context.ConfigurableApplicationContext;

/**
 * 지난 일정 자동 완료 배치 ({@link ScheduleAutoCompleteService}) — 조회 경로에서 옮겨진 뒤의 보장.
 *
 * <ul>
 *   <li>활성 테넌트마다 해당 테넌트 컨텍스트로만 처리하고 끝나면 비운다.</li>
 *   <li>두 번 돌거나 동시에 두 번 돌아도 회기 차감·저장·급여 동기화·통계는 일정당 1회.</li>
 *   <li>"오늘/지난 일정" 판정은 KST 시계 기준 (자정 경계).</li>
 * </ul>
 *
 * @author CoreSolution
 * @since 2026-10-04
 */
@DisplayName("ScheduleAutoCompleteService 배치 — 테넌트·멱등·동시성·KST 경계")
class ScheduleAutoCompleteServiceBatchTest {

    private static final String TENANT_A = "tenant-auto-complete-a";
    private static final String TENANT_B = "tenant-auto-complete-b";
    private static final Long CONSULTANT_ID = 10L;
    private static final Long CLIENT_ID = 20L;

    private ScheduleService scheduleService;
    private ScheduleRepository scheduleRepository;
    private ConsultationLogExistenceSsot logExistence;
    private RealTimeStatisticsService realTimeStatisticsService;
    private PlSqlScheduleValidationService plSqlService;
    private SalaryLateSessionAutoSyncService salarySync;
    private TenantService tenantService;
    private ConfigurableApplicationContext applicationContext;
    private ScheduleAutoCompleteService service;

    /** 테스트용 일정 저장소 (id → 일정). 저장소 mock 이 이 상태를 읽고 쓴다. */
    private Map<Long, Schedule> store;

    @BeforeEach
    void setUp() {
        TenantContextHolder.clear();
        scheduleService = mock(ScheduleService.class);
        scheduleRepository = mock(ScheduleRepository.class);
        logExistence = mock(ConsultationLogExistenceSsot.class);
        realTimeStatisticsService = mock(RealTimeStatisticsService.class);
        plSqlService = mock(PlSqlScheduleValidationService.class);
        salarySync = mock(SalaryLateSessionAutoSyncService.class);
        tenantService = mock(TenantService.class);
        applicationContext = mock(ConfigurableApplicationContext.class);
        when(applicationContext.isActive()).thenReturn(true);
        service = new ScheduleAutoCompleteService(scheduleService, scheduleRepository, logExistence,
            realTimeStatisticsService, plSqlService, salarySync, tenantService, applicationContext);

        store = new ConcurrentHashMap<>();
        lenient().when(logExistence.existsActiveForSchedule(anyString(), any())).thenReturn(true);
        lenient().when(scheduleRepository.findExpiredConfirmedSchedules(anyString(), any(), any()))
            .thenReturn(List.of());
        lenient().when(scheduleRepository.findByDateBeforeAndStatus(anyString(), any(), any()))
            .thenAnswer(inv -> {
                String tenantId = inv.getArgument(0);
                LocalDate today = inv.getArgument(1);
                ScheduleStatus status = inv.getArgument(2);
                List<Schedule> result = new ArrayList<>();
                for (Schedule s : store.values()) {
                    if (tenantId.equals(s.getTenantId()) && s.getDate().isBefore(today)
                            && status == s.getStatus()) {
                        result.add(copyOf(s));
                    }
                }
                return result;
            });
        lenient().when(scheduleRepository.findByTenantIdAndId(anyString(), any()))
            .thenAnswer(inv -> {
                Schedule s = store.get(inv.<Long>getArgument(1));
                if (s == null || !s.getTenantId().equals(inv.getArgument(0))) {
                    return Optional.empty();
                }
                return Optional.of(copyOf(s));
            });
        lenient().when(scheduleRepository.save(any(Schedule.class))).thenAnswer(inv -> {
            Schedule saved = inv.getArgument(0);
            store.put(saved.getId(), copyOf(saved));
            return saved;
        });
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("활성 테넌트마다 그 테넌트 컨텍스트로 처리하고, 실행 후 컨텍스트를 비운다")
    void iteratesTenants_withOwnContext() {
        when(tenantService.getAllActiveTenantIds()).thenReturn(List.of(TENANT_A, TENANT_B));
        put(schedule(1L, TENANT_A, LocalDate.of(2026, 10, 3), ScheduleStatus.BOOKED));
        put(schedule(2L, TENANT_B, LocalDate.of(2026, 10, 3), ScheduleStatus.CONFIRMED));
        List<String> contextAtDeduct = new ArrayList<>();
        doAnswer(inv -> {
            Schedule s = inv.getArgument(0);
            contextAtDeduct.add(s.getTenantId() + "=" + TenantContextHolder.getTenantId());
            return null;
        }).when(scheduleService).deductSessionAtCompletionIfNeeded(any());
        service.useClock(kstClock("2026-10-04T01:00:00Z"));

        service.autoCompleteExpiredSchedules();

        assertEquals(List.of(TENANT_A + "=" + TENANT_A, TENANT_B + "=" + TENANT_B), contextAtDeduct);
        verify(scheduleRepository).findByDateBeforeAndStatus(TENANT_A, LocalDate.of(2026, 10, 4),
            ScheduleStatus.BOOKED);
        verify(scheduleRepository).findByDateBeforeAndStatus(TENANT_B, LocalDate.of(2026, 10, 4),
            ScheduleStatus.BOOKED);
        assertEquals(ScheduleStatus.COMPLETED, store.get(1L).getStatus());
        assertEquals(ScheduleStatus.COMPLETED, store.get(2L).getStatus());
        assertNull(TenantContextHolder.getTenantId());
    }

    @Test
    @DisplayName("한 테넌트 실패가 다음 테넌트 처리를 막지 않는다")
    void tenantFailure_doesNotStopOthers() {
        when(tenantService.getAllActiveTenantIds()).thenReturn(List.of(TENANT_A, TENANT_B));
        when(scheduleRepository.findExpiredConfirmedSchedules(eq(TENANT_A), any(), any()))
            .thenThrow(new IllegalStateException("db down"));
        put(schedule(2L, TENANT_B, LocalDate.of(2026, 10, 3), ScheduleStatus.BOOKED));
        service.useClock(kstClock("2026-10-04T01:00:00Z"));

        service.autoCompleteExpiredSchedules();

        assertEquals(ScheduleStatus.COMPLETED, store.get(2L).getStatus());
        assertNull(TenantContextHolder.getTenantId());
    }

    @Test
    @DisplayName("반례(돈) — 배치를 두 번 돌려도 회기 차감·저장·급여 동기화·통계는 1회")
    void doubleRun_appliesSideEffectsOnce() {
        when(tenantService.getAllActiveTenantIds()).thenReturn(List.of(TENANT_A));
        put(schedule(1L, TENANT_A, LocalDate.of(2026, 10, 3), ScheduleStatus.BOOKED));
        service.useClock(kstClock("2026-10-04T01:00:00Z"));

        service.autoCompleteExpiredSchedules();
        service.autoCompleteExpiredSchedules();

        verify(scheduleService, times(1)).deductSessionAtCompletionIfNeeded(any());
        verify(scheduleRepository, times(1)).save(any(Schedule.class));
        verify(salarySync, times(1)).syncAfterScheduleCompleted(any());
        verify(realTimeStatisticsService, times(1)).updateStatisticsOnScheduleCompletion(any());
        assertEquals(ScheduleStatus.COMPLETED, store.get(1L).getStatus());
    }

    @Test
    @DisplayName("반례(동시성) — 주기 배치와 자정 정리가 동시에 돌아도 같은 일정 회기 차감 1회")
    void concurrentRuns_deductOnce() throws Exception {
        when(tenantService.getAllActiveTenantIds()).thenReturn(List.of(TENANT_A));
        put(schedule(1L, TENANT_A, LocalDate.of(2026, 10, 3), ScheduleStatus.BOOKED));
        service.useClock(kstClock("2026-10-04T01:00:00Z"));
        CountDownLatch firstDeductEntered = new CountDownLatch(1);
        doAnswer(inv -> {
            firstDeductEntered.countDown();
            Thread.sleep(200);
            return null;
        }).when(scheduleService).deductSessionAtCompletionIfNeeded(any());

        ExecutorService pool = Executors.newFixedThreadPool(2);
        try {
            Future<?> first = pool.submit(service::autoCompleteExpiredSchedules);
            assertTrue(firstDeductEntered.await(5, TimeUnit.SECONDS));
            Future<?> second = pool.submit(service::autoCompleteExpiredSchedules);
            first.get(5, TimeUnit.SECONDS);
            second.get(5, TimeUnit.SECONDS);
        } finally {
            pool.shutdownNow();
        }

        verify(scheduleService, times(1)).deductSessionAtCompletionIfNeeded(any());
        verify(scheduleRepository, times(1)).save(any(Schedule.class));
        verify(salarySync, times(1)).syncAfterScheduleCompleted(any());
    }

    @Test
    @DisplayName("반례(시간) — KST 자정 직전 23:55: 같은 날 일정은 '지난 일정'이 아니다")
    void kstBeforeMidnight_sameDayNotPast() {
        when(tenantService.getAllActiveTenantIds()).thenReturn(List.of(TENANT_A));
        put(schedule(1L, TENANT_A, LocalDate.of(2026, 10, 4), ScheduleStatus.BOOKED));
        // 2026-10-04 14:55Z = 2026-10-04 23:55 KST (UTC 기준이면 날짜가 같아도 시각이 9시간 어긋난다)
        service.useClock(kstClock("2026-10-04T14:55:00Z"));

        service.autoCompleteExpiredSchedules();

        verify(scheduleRepository).findExpiredConfirmedSchedules(TENANT_A, LocalDate.of(2026, 10, 4),
            LocalTime.of(23, 55));
        verify(scheduleRepository).findByDateBeforeAndStatus(TENANT_A, LocalDate.of(2026, 10, 4),
            ScheduleStatus.BOOKED);
        verify(scheduleService, never()).deductSessionAtCompletionIfNeeded(any());
        assertEquals(ScheduleStatus.BOOKED, store.get(1L).getStatus());
    }

    @Test
    @DisplayName("반례(시간) — KST 자정 직후 00:05: 전날 일정은 '지난 일정'으로 완료 (UTC 로는 아직 전날)")
    void kstAfterMidnight_previousDayIsPast() {
        when(tenantService.getAllActiveTenantIds()).thenReturn(List.of(TENANT_A));
        put(schedule(1L, TENANT_A, LocalDate.of(2026, 10, 4), ScheduleStatus.BOOKED));
        // 2026-10-04 15:05Z = 2026-10-05 00:05 KST
        service.useClock(kstClock("2026-10-04T15:05:00Z"));

        service.autoCompleteExpiredSchedules();

        verify(scheduleRepository).findExpiredConfirmedSchedules(TENANT_A, LocalDate.of(2026, 10, 5),
            LocalTime.of(0, 5));
        verify(scheduleRepository).findByDateBeforeAndStatus(TENANT_A, LocalDate.of(2026, 10, 5),
            ScheduleStatus.BOOKED);
        verify(scheduleService, times(1)).deductSessionAtCompletionIfNeeded(any());
        assertEquals(ScheduleStatus.COMPLETED, store.get(1L).getStatus());
    }

    @Test
    @DisplayName("상담일지 없는 지난 일정은 완료하지 않고 차감도 하지 않는다 (기존 업무 규칙 유지)")
    void pastWithoutLog_notCompleted() {
        when(tenantService.getAllActiveTenantIds()).thenReturn(List.of(TENANT_A));
        put(schedule(1L, TENANT_A, LocalDate.of(2026, 10, 3), ScheduleStatus.BOOKED));
        when(logExistence.existsActiveForSchedule(TENANT_A, 1L)).thenReturn(false);
        when(plSqlService.createConsultationRecordReminder(any(), any(), any(), any(), any()))
            .thenReturn(Map.of("success", true));
        service.useClock(kstClock("2026-10-04T01:00:00Z"));

        service.autoCompleteExpiredSchedules();

        verify(scheduleService, never()).deductSessionAtCompletionIfNeeded(any());
        verify(scheduleRepository, never()).save(any(Schedule.class));
        assertEquals(ScheduleStatus.BOOKED, store.get(1L).getStatus());
    }

    @Test
    @DisplayName("자정 정리 배치 — 테넌트마다 컨텍스트를 세우고 서비스 정리 로직을 호출, 실행 후 비움")
    void dailyCleanup_iteratesTenants() {
        when(tenantService.getAllActiveTenantIds()).thenReturn(List.of(TENANT_A, TENANT_B));
        List<String> contexts = new ArrayList<>();
        doAnswer(inv -> {
            contexts.add(TenantContextHolder.getTenantId());
            return null;
        }).when(scheduleService).autoCompleteExpiredSchedules();

        service.cleanupDailySchedules();

        assertEquals(List.of(TENANT_A, TENANT_B), contexts);
        assertNull(TenantContextHolder.getTenantId());
    }

    @Test
    @DisplayName("애플리케이션 종료 중이면 아무것도 하지 않는다")
    void inactiveContext_skips() {
        when(applicationContext.isActive()).thenReturn(false);
        service.autoCompleteExpiredSchedules();
        service.cleanupDailySchedules();
        verify(tenantService, never()).getAllActiveTenantIds();
    }

    // ---- helpers ----

    private static Clock kstClock(String instant) {
        return Clock.fixed(Instant.parse(instant), ReservationSmsBusinessHours.ZONE_SEOUL);
    }

    private void put(Schedule schedule) {
        store.put(schedule.getId(), schedule);
    }

    private static Schedule schedule(Long id, String tenantId, LocalDate date, ScheduleStatus status) {
        Schedule s = new Schedule();
        s.setId(id);
        s.setTenantId(tenantId);
        s.setDate(date);
        s.setStartTime(LocalTime.of(10, 0));
        s.setEndTime(LocalTime.of(10, 50));
        s.setStatus(status);
        s.setConsultantId(CONSULTANT_ID);
        s.setClientId(CLIENT_ID);
        s.setTitle("상담");
        return s;
    }

    private static Schedule copyOf(Schedule source) {
        Schedule s = schedule(source.getId(), source.getTenantId(), source.getDate(), source.getStatus());
        s.setStartTime(source.getStartTime());
        s.setEndTime(source.getEndTime());
        return s;
    }
}
