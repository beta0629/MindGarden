package com.coresolution.core.deploy;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * 모든 {@code @Scheduled} 메서드에 트래픽 슬롯 가드를 적용하는 Aspect (SSOT).
 *
 * <p>{@link Order}{@link Ordered#HIGHEST_PRECEDENCE} 로 ShedLock 인터셉터보다 먼저 실행되어,
 * idle JVM 이 락을 선점한 뒤 스킵하는 일을 막는다. 기존 {@code @SchedulerLock} 은 유지한다
 * (defense in depth).</p>
 *
 * @author CoreSolution
 * @since 2026-11-12
 * @see ActiveBackendSlotGuard
 */
@Slf4j
@Aspect
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
@RequiredArgsConstructor
public class ActiveBackendScheduledAspect {

    private final ActiveBackendSlotGuard activeBackendSlotGuard;

    /**
     * {@code @Scheduled} 진입 전 트래픽 슬롯을 검사한다.
     *
     * @param joinPoint 스케줄 메서드 조인포인트
     * @return 허용 시 원본 반환값, 스킵 시 {@code null} (void 포함)
     * @throws Throwable 대상 메서드가 던진 예외
     */
    @Around("@annotation(org.springframework.scheduling.annotation.Scheduled)")
    public Object aroundScheduled(ProceedingJoinPoint joinPoint) throws Throwable {
        String schedulerName = joinPoint.getSignature().toShortString();
        if (!activeBackendSlotGuard.shouldRunScheduledJob(schedulerName)) {
            log.info("ActiveBackendScheduledAspect — scheduled job skipped: {}", schedulerName);
            return null;
        }
        return joinPoint.proceed();
    }
}
