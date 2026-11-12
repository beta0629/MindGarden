package com.coresolution.core.deploy;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.scheduler.ReservationReminderScheduler;
import java.lang.reflect.Method;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.Signature;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;

/**
 * {@link ActiveBackendScheduledAspect} 단위 테스트 — idle 슬롯에서 proceed 차단·ShedLock 유지.
 *
 * @author CoreSolution
 * @since 2026-11-12
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ActiveBackendScheduledAspect — @Scheduled 슬롯 가드")
class ActiveBackendScheduledAspectTest {

    @Mock
    private ActiveBackendSlotGuard activeBackendSlotGuard;

    @Mock
    private ProceedingJoinPoint joinPoint;

    @Mock
    private Signature signature;

    @InjectMocks
    private ActiveBackendScheduledAspect aspect;

    @Test
    @DisplayName("Given guard false When aroundScheduled Then proceed 호출 없이 null")
    void aroundScheduled_whenGuardFalse_skipsProceed() throws Throwable {
        // Given
        when(joinPoint.getSignature()).thenReturn(signature);
        when(signature.toShortString()).thenReturn("DemoScheduler.tick()");
        when(activeBackendSlotGuard.shouldRunScheduledJob(anyString())).thenReturn(false);

        // When
        Object result = aspect.aroundScheduled(joinPoint);

        // Then
        assertThat(result).isNull();
        verify(joinPoint, never()).proceed();
        verify(activeBackendSlotGuard).shouldRunScheduledJob("DemoScheduler.tick()");
    }

    @Test
    @DisplayName("Given guard true When aroundScheduled Then proceed 결과를 반환")
    void aroundScheduled_whenGuardTrue_callsProceed() throws Throwable {
        // Given
        when(joinPoint.getSignature()).thenReturn(signature);
        when(signature.toShortString()).thenReturn("DemoScheduler.tick()");
        when(activeBackendSlotGuard.shouldRunScheduledJob(anyString())).thenReturn(true);
        when(joinPoint.proceed()).thenReturn("ok");

        // When
        Object result = aspect.aroundScheduled(joinPoint);

        // Then
        assertThat(result).isEqualTo("ok");
        verify(joinPoint).proceed();
    }

    @Test
    @DisplayName("Aspect 는 ShedLock 보다 먼저 실행되도록 HIGHEST_PRECEDENCE")
    void aspect_hasHighestPrecedenceOrder() {
        // Given / When
        Order order = ActiveBackendScheduledAspect.class.getAnnotation(Order.class);

        // Then
        assertThat(order).isNotNull();
        assertThat(order.value()).isEqualTo(Ordered.HIGHEST_PRECEDENCE);
    }

    @Test
    @DisplayName("runDailyReminder 는 @SchedulerLock(name=reservation-reminder-daily) 유지")
    void runDailyReminder_stillHasSchedulerLock() throws Exception {
        // Given / When
        Method method = ReservationReminderScheduler.class.getMethod("runDailyReminder");
        SchedulerLock lock = method.getAnnotation(SchedulerLock.class);

        // Then
        assertThat(lock).isNotNull();
        assertThat(lock.name()).isEqualTo("reservation-reminder-daily");
        assertThat(lock.name()).isEqualTo(ReservationReminderScheduler.SCHEDULER_LOCK_NAME);
    }
}
