package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.lang.reflect.Constructor;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.constant.admin.AdminServiceUserFacingMessages;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.service.ScheduleAutoCompleteService;
import com.coresolution.consultation.service.ScheduleService;
import com.coresolution.core.context.TenantContextHolder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

/**
 * 스케줄 자동 완료 + 상담일지 미작성 알림 수동 실행 — 동시 실행 차단·멱등성·오류 문구 (#1407 검증 FAIL 보완).
 *
 * <p>.dev 측정에서 이 수동 실행은 동시 호출을 막지 않았고, 두 번째 호출이 같은 일정을 다시
 * 완료 처리하며 회기를 재차감할 수 있었다. 또 실패 시 원시 예외 문구가 응답 message 에 실렸다.</p>
 *
 * <p>처리 규칙 자체(지난 {@code BOOKED} 일정은 상담일지 작성 여부와 무관하게 완료·차감)는 바꾸지
 * 않는다. 이 테스트는 그 규칙을 그대로 둔 채 재실행 안전성만 고정한다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-05
 */
@DisplayName("자동 완료 + 미작성 알림 — 동시 실행 차단·멱등성·오류 문구")
class AdminServiceAutoCompleteWithReminderTest {

    private static final String TENANT_ID = "tenant-auto-complete";
    private static final long SCHEDULE_ID = 7001L;

    private AdminServiceImpl adminService;
    private ScheduleRepository scheduleRepository;
    private ScheduleService scheduleService;
    private ScheduleAutoCompleteService autoCompleteService;

    @BeforeEach
    void setUp() throws Exception {
        TenantContextHolder.setTenantId(TENANT_ID);
        scheduleRepository = mock(ScheduleRepository.class);
        scheduleService = mock(ScheduleService.class);
        adminService = build(AdminServiceImpl.class, scheduleRepository, scheduleService);

        autoCompleteService = build(ScheduleAutoCompleteService.class);
        // 점유 중이면 기다리지 않고 바로 거부하도록 대기 시간을 0 으로 둔다 (테스트 결정성).
        ReflectionTestUtils.setField(autoCompleteService, "manualLockWaitSeconds", 0L);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("멱등성 — 두 번째 실행은 이미 완료된 일정을 건너뛰어 회기를 다시 차감하지 않는다")
    void secondRun_deductsNothing() {
        Schedule schedule = schedule(ScheduleStatus.BOOKED);
        when(scheduleRepository.findByDateBeforeAndStatus(eq(TENANT_ID), any(LocalDate.class),
            eq(ScheduleStatus.BOOKED))).thenReturn(List.of(schedule));
        when(scheduleRepository.findByTenantIdAndId(TENANT_ID, SCHEDULE_ID))
            .thenReturn(Optional.of(schedule));
        when(scheduleService.hasActiveConsultationLogSsot(anyString(), anyLong())).thenReturn(true);

        Map<String, Object> first = adminService.autoCompleteSchedulesWithReminder();
        assertThat(first.get("success")).isEqualTo(true);
        assertThat(first.get("completedSchedules")).isEqualTo(1);
        verify(scheduleService, times(1)).deductSessionAtCompletionIfNeeded(schedule);
        assertThat(schedule.getStatus()).isEqualTo(ScheduleStatus.COMPLETED);

        // 두 번째 실행: 후보 목록에는 남아 있어도 최신 상태가 COMPLETED 라 건너뛴다.
        Map<String, Object> second = adminService.autoCompleteSchedulesWithReminder();
        assertThat(second.get("completedSchedules")).isEqualTo(0);
        verify(scheduleService, times(1)).deductSessionAtCompletionIfNeeded(schedule);
    }

    @Test
    @DisplayName("멱등성 — 후보 조회 이후 다른 실행이 완료시킨 일정은 저장·차감하지 않는다")
    void staleCandidate_isSkipped() {
        Schedule stale = schedule(ScheduleStatus.BOOKED);
        Schedule fresh = schedule(ScheduleStatus.COMPLETED);
        when(scheduleRepository.findByDateBeforeAndStatus(eq(TENANT_ID), any(LocalDate.class),
            eq(ScheduleStatus.BOOKED))).thenReturn(List.of(stale));
        when(scheduleRepository.findByTenantIdAndId(TENANT_ID, SCHEDULE_ID))
            .thenReturn(Optional.of(fresh));

        Map<String, Object> result = adminService.autoCompleteSchedulesWithReminder();

        assertThat(result.get("completedSchedules")).isEqualTo(0);
        verify(scheduleService, never()).deductSessionAtCompletionIfNeeded(any());
        verify(scheduleRepository, never()).save(any());
    }

    @Test
    @DisplayName("오류 문구 — 실패해도 원시 예외 문구를 응답에 싣지 않는다")
    void failure_doesNotLeakRawMessage() {
        String rawMessage = "PROCEDURE mindgarden.GetMissingConsultationRecordAlerts does not exist";
        when(scheduleRepository.findByDateBeforeAndStatus(anyString(), any(LocalDate.class), any()))
            .thenThrow(new org.springframework.dao.InvalidDataAccessResourceUsageException(rawMessage));

        Map<String, Object> result = adminService.autoCompleteSchedulesWithReminder();

        assertThat(result.get("success")).isEqualTo(false);
        assertThat(String.valueOf(result.get("message")))
            .isEqualTo(AdminServiceUserFacingMessages.MSG_SCHEDULE_AUTO_COMPLETE_FAILED)
            .doesNotContain("does not exist")
            .doesNotContain("PROCEDURE");
        assertThat(result.get("completedSchedules")).isEqualTo(0);
    }

    @Test
    @DisplayName("테넌트 컨텍스트가 없으면 처리하지 않는다")
    void withoutTenant_rejected() {
        TenantContextHolder.clear();

        Map<String, Object> result = adminService.autoCompleteSchedulesWithReminder();

        assertThat(result.get("success")).isEqualTo(false);
        assertThat(result.get("completedSchedules")).isEqualTo(0);
        verify(scheduleService, never()).deductSessionAtCompletionIfNeeded(any());
    }

    // ---- 동시 실행 차단 (컨트롤러 진입점이 쓰는 run lock) ----

    @Test
    @DisplayName("동시 호출 — 하나만 실행되고 나머지는 거부된다")
    void concurrentRuns_onlyOneExecutes() throws Exception {
        AtomicInteger executed = new AtomicInteger();
        AtomicInteger rejected = new AtomicInteger();
        CountDownLatch inside = new CountDownLatch(1);
        CountDownLatch release = new CountDownLatch(1);
        ExecutorService pool = Executors.newFixedThreadPool(2);
        try {
            Future<?> first = pool.submit(() -> autoCompleteService.runExclusively("test", () -> {
                executed.incrementAndGet();
                inside.countDown();
                await(release);
                return Boolean.TRUE;
            }));
            assertThat(inside.await(5, TimeUnit.SECONDS)).isTrue();

            Future<?> second = pool.submit(() -> {
                try {
                    return autoCompleteService.runExclusively("test", () -> {
                        executed.incrementAndGet();
                        return Boolean.TRUE;
                    });
                } catch (IllegalStateException e) {
                    rejected.incrementAndGet();
                    return Boolean.FALSE;
                }
            });
            assertThat(second.get(5, TimeUnit.SECONDS)).isEqualTo(Boolean.FALSE);
            release.countDown();
            first.get(5, TimeUnit.SECONDS);
        } finally {
            release.countDown();
            pool.shutdownNow();
        }

        assertThat(executed.get()).isEqualTo(1);
        assertThat(rejected.get()).isEqualTo(1);
    }

    @Test
    @DisplayName("점유가 풀리면 다음 호출은 정상 실행된다")
    void lockReleased_nextRunSucceeds() {
        assertThat(autoCompleteService.runExclusively("test", () -> 1)).isEqualTo(1);
        assertThat(autoCompleteService.runExclusively("test", () -> 2)).isEqualTo(2);
    }

    @Test
    @DisplayName("작업이 예외로 끝나도 점유는 해제된다")
    void lockReleasedOnException() {
        try {
            autoCompleteService.runExclusively("test", () -> {
                throw new IllegalArgumentException("boom");
            });
        } catch (IllegalArgumentException ignored) {
            // 기대한 예외
        }
        assertThat(autoCompleteService.runExclusively("test", () -> 3)).isEqualTo(3);
    }

    // ---- helpers ----

    private static void await(CountDownLatch latch) {
        try {
            latch.await(5, TimeUnit.SECONDS);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    private static Schedule schedule(ScheduleStatus status) {
        Schedule s = new Schedule();
        s.setId(SCHEDULE_ID);
        s.setTenantId(TENANT_ID);
        s.setConsultantId(41L);
        s.setClientId(20L);
        s.setDate(LocalDate.now().minusDays(1));
        s.setStatus(status);
        return s;
    }

    /** 가장 긴 생성자로 대상을 만든다. 제공 객체가 없으면 해당 타입 mock 을 넣는다. */
    private static <T> T build(Class<T> type, Object... provided) throws Exception {
        Constructor<?> ctor = Arrays.stream(type.getDeclaredConstructors())
            .max(Comparator.comparingInt(Constructor::getParameterCount))
            .orElseThrow();
        List<Object> args = new ArrayList<>();
        for (Class<?> parameterType : ctor.getParameterTypes()) {
            args.add(Arrays.stream(provided).filter(parameterType::isInstance).findFirst()
                .orElseGet(() -> mock(parameterType)));
        }
        ctor.setAccessible(true);
        return type.cast(ctor.newInstance(args.toArray()));
    }
}
