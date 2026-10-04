package com.coresolution.consultation.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
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
import com.coresolution.consultation.service.ScheduleAutoCompleteService.TenantAutoCompleteResult;
import com.coresolution.consultation.util.ReservationSmsBusinessHours;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.service.TenantService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.context.ConfigurableApplicationContext;

/**
 * 관리자 수동 실행 경로({@code autoCompleteExpiredSchedulesForTenant}) — 테넌트 격리·멱등·동시성.
 *
 * <p>수동 실행은 배치와 같은 코드 경로를 쓰되 <b>호출자 테넌트 1건</b>만 처리해야 한다.
 * 전 테넌트 루프({@code autoCompleteExpiredSchedules})를 타면 다른 기관 일정까지 완료·차감된다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-04
 */
@DisplayName("ScheduleAutoCompleteService 수동 실행 — 테넌트 1건 격리")
class ScheduleAutoCompleteServiceManualTenantScopeTest {

    private static final String TENANT_A = "tenant-manual-a";
    private static final String TENANT_B = "tenant-manual-b";
    private static final Long CONSULTANT_ID = 10L;
    private static final Long CLIENT_ID = 20L;
    private static final LocalDate PAST_DATE = LocalDate.of(2026, 10, 3);
    private static final String NOW_UTC = "2026-10-04T01:00:00Z";

    private ScheduleService scheduleService;
    private ScheduleRepository scheduleRepository;
    private ConsultationLogExistenceSsot logExistence;
    private RealTimeStatisticsService realTimeStatisticsService;
    private PlSqlScheduleValidationService plSqlService;
    private SalaryLateSessionAutoSyncService salarySync;
    private TenantService tenantService;
    private ConfigurableApplicationContext applicationContext;
    private ScheduleAutoCompleteService service;

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
        lenient().when(applicationContext.isActive()).thenReturn(true);
        service = new ScheduleAutoCompleteService(scheduleService, scheduleRepository, logExistence,
            realTimeStatisticsService, plSqlService, salarySync, tenantService, applicationContext);
        service.useClock(kstClock(NOW_UTC));
        service.useManualLockWaitSeconds(2);

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
    @DisplayName("반례(권한·테넌트) — 호출 테넌트 일정만 완료되고 다른 기관 일정은 그대로")
    void completesOnlyCallerTenant() {
        put(schedule(1L, TENANT_A, PAST_DATE, ScheduleStatus.BOOKED));
        put(schedule(2L, TENANT_B, PAST_DATE, ScheduleStatus.BOOKED));

        TenantAutoCompleteResult result = service.autoCompleteExpiredSchedulesForTenant(TENANT_A);

        assertEquals(TENANT_A, result.tenantId());
        assertEquals(1, result.completedCount());
        assertEquals(ScheduleStatus.COMPLETED, store.get(1L).getStatus());
        assertEquals(ScheduleStatus.BOOKED, store.get(2L).getStatus());
        verify(scheduleRepository, never()).findByDateBeforeAndStatus(eq(TENANT_B), any(), any());
        verify(tenantService, never()).getAllActiveTenantIds();
    }

    @Test
    @DisplayName("HTTP 요청 스레드의 테넌트 컨텍스트를 원래 값으로 되돌린다")
    void restoresPreviousTenantContext() {
        TenantContextHolder.setTenantId(TENANT_A);
        put(schedule(1L, TENANT_A, PAST_DATE, ScheduleStatus.BOOKED));

        service.autoCompleteExpiredSchedulesForTenant(TENANT_A);

        assertEquals(TENANT_A, TenantContextHolder.getTenantId());
    }

    @Test
    @DisplayName("컨텍스트가 없던 스레드에서는 실행 후 다시 비운다")
    void clearsContextWhenNoneBefore() {
        put(schedule(1L, TENANT_A, PAST_DATE, ScheduleStatus.BOOKED));

        service.autoCompleteExpiredSchedulesForTenant(TENANT_A);

        assertNull(TenantContextHolder.getTenantId());
    }

    @Test
    @DisplayName("반례(돈) — 수동 실행을 두 번 해도 회기 차감·저장·급여 동기화는 1회")
    void doubleManualRun_appliesSideEffectsOnce() {
        put(schedule(1L, TENANT_A, PAST_DATE, ScheduleStatus.BOOKED));

        service.autoCompleteExpiredSchedulesForTenant(TENANT_A);
        service.autoCompleteExpiredSchedulesForTenant(TENANT_A);

        verify(scheduleService, times(1)).deductSessionAtCompletionIfNeeded(any());
        verify(scheduleRepository, times(1)).save(any(Schedule.class));
        verify(salarySync, times(1)).syncAfterScheduleCompleted(any());
    }

    @Test
    @DisplayName("반례(동시성) — 배치가 도는 중 수동 실행은 기다렸다가 중복 차감 없이 끝난다")
    void concurrentWithBatch_deductsOnce() throws Exception {
        when(tenantService.getAllActiveTenantIds()).thenReturn(List.of(TENANT_A));
        put(schedule(1L, TENANT_A, PAST_DATE, ScheduleStatus.BOOKED));
        CountDownLatch batchEntered = new CountDownLatch(1);
        doAnswer(inv -> {
            batchEntered.countDown();
            Thread.sleep(200);
            return null;
        }).when(scheduleService).deductSessionAtCompletionIfNeeded(any());

        ExecutorService pool = Executors.newFixedThreadPool(2);
        try {
            Future<?> batch = pool.submit(service::autoCompleteExpiredSchedules);
            assertTrue(batchEntered.await(5, TimeUnit.SECONDS));
            Future<?> manual = pool.submit(() -> service.autoCompleteExpiredSchedulesForTenant(TENANT_A));
            batch.get(10, TimeUnit.SECONDS);
            manual.get(10, TimeUnit.SECONDS);
        } finally {
            pool.shutdownNow();
        }

        verify(scheduleService, times(1)).deductSessionAtCompletionIfNeeded(any());
        verify(scheduleRepository, times(1)).save(any(Schedule.class));
    }

    @Test
    @DisplayName("테넌트가 비면 실행하지 않는다 (전 테넌트 처리로 넓어지지 않음)")
    void blankTenant_rejected() {
        assertThrows(IllegalArgumentException.class,
            () -> service.autoCompleteExpiredSchedulesForTenant("  "));
        assertThrows(IllegalArgumentException.class,
            () -> service.autoCompleteExpiredSchedulesForTenant(null));
        verify(tenantService, never()).getAllActiveTenantIds();
        verify(scheduleRepository, never()).save(any(Schedule.class));
    }

    private void put(Schedule schedule) {
        store.put(schedule.getId(), schedule);
    }

    private static Clock kstClock(String instant) {
        return Clock.fixed(Instant.parse(instant), ReservationSmsBusinessHours.ZONE_SEOUL);
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
