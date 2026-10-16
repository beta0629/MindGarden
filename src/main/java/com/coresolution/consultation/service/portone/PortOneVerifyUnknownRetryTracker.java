package com.coresolution.consultation.service.portone;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import com.coresolution.consultation.config.ShopPortOneProperties;
import com.coresolution.consultation.constant.ShopCheckoutConstants;
import com.coresolution.consultation.entity.Payment;
import com.coresolution.consultation.repository.PaymentRepository;
import com.coresolution.core.monitoring.SchedulerFailureNotifier;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.util.StringUtils;

/**
 * PortOne 검증 UNKNOWN/IN_PROGRESS 내구성 재시도 추적 공통 모듈.
 * <p>
 * expireOrderHold · 웹훅 UNKNOWN · doVerifyPayment(쇼핑 UNKNOWN) 가 공유한다.
 * 시도 횟수·최초 관측·소진 시각을 {@code payments} 에 남기고, 상한 도달 시
 * {@link SchedulerFailureNotifier} 로 관리자 알림을 한 번만 올린다(자동 취소 없음).
 * 감사·카운터 저장은 낙관적 락 충돌 시 재시도하며, 최종 실패해도 메인 결제 반영을 깨지 않는다.
 * </p>
 *
 * @author MindGarden
 * @since 2026-10-16
 */
@Slf4j
@Service
public class PortOneVerifyUnknownRetryTracker {

    private final PaymentRepository paymentRepository;
    private final ShopPortOneProperties shopPortOneProperties;
    private final ObjectProvider<SchedulerFailureNotifier> schedulerFailureNotifierProvider;
    private final TransactionTemplate requiresNewTx;

    /**
     * @param paymentRepository                   결제 저장소
     * @param shopPortOneProperties               PortOne 재시도 설정
     * @param schedulerFailureNotifierProvider    관리자 알림(선택)
     * @param transactionManager                  REQUIRES_NEW 템플릿용
     */
    public PortOneVerifyUnknownRetryTracker(
            PaymentRepository paymentRepository,
            ShopPortOneProperties shopPortOneProperties,
            ObjectProvider<SchedulerFailureNotifier> schedulerFailureNotifierProvider,
            PlatformTransactionManager transactionManager) {
        this.paymentRepository = paymentRepository;
        this.shopPortOneProperties = shopPortOneProperties;
        this.schedulerFailureNotifierProvider = schedulerFailureNotifierProvider;
        this.requiresNewTx = new TransactionTemplate(transactionManager);
        this.requiresNewTx.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
    }

    /**
     * 이미 UNKNOWN/IN_PROGRESS 재시도가 소진된 결제인지 (메모리 스냅샷 기준).
     *
     * @param payment 결제 행
     * @return {@code verify_unknown_exhausted_at} 이 있으면 true
     */
    public boolean isExhausted(Payment payment) {
        return payment != null && payment.getVerifyUnknownExhaustedAt() != null;
    }

    /**
     * 소진 이후 장주기 폴링 간격이 지났는지.
     * 소진 전이면 항상 true(호출측이 일반 경로를 쓰도록).
     *
     * @param payment 결제 행
     * @return 폴링 허용 여부
     */
    public boolean shouldPollAfterExhausted(Payment payment) {
        if (payment == null) {
            return false;
        }
        if (payment.getVerifyUnknownExhaustedAt() == null) {
            return true;
        }
        LocalDateTime lastPolled = payment.getVerifyUnknownExhaustedLastPolledAt();
        if (lastPolled == null) {
            return true;
        }
        long intervalMs = shopPortOneProperties.resolvedVerifyUnknownExhaustedPollIntervalMs();
        long elapsedMs = Duration.between(lastPolled, LocalDateTime.now()).toMillis();
        return elapsedMs >= intervalMs;
    }

    /**
     * 소진 후 PortOne 폴링을 수행했음을 기록한다.
     * 메인 플로우 예외로 전파하지 않는다.
     *
     * @param tenantId  테넌트 ID
     * @param paymentId 결제 ID
     */
    public void markExhaustedPolled(String tenantId, String paymentId) {
        if (!StringUtils.hasText(tenantId) || !StringUtils.hasText(paymentId)) {
            return;
        }
        int maxRetries = shopPortOneProperties.resolvedVerifyUnknownLockMaxRetries();
        for (int attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                requiresNewTx.executeWithoutResult(status -> markExhaustedPolledOnce(tenantId, paymentId));
                return;
            } catch (OptimisticLockingFailureException conflict) {
                log.warn(
                        "PortOne 소진 후 폴링 시각 저장 충돌 attempt={}/{} tenantId={}, paymentId={}",
                        attempt,
                        maxRetries,
                        tenantId,
                        paymentId);
                sleepBeforeLockRetry(attempt, maxRetries);
            } catch (RuntimeException ex) {
                log.warn(
                        "PortOne 소진 후 폴링 시각 저장 실패(메인 플로우 유지) tenantId={}, paymentId={}",
                        tenantId,
                        paymentId,
                        ex);
                return;
            }
        }
        log.warn(
                "PortOne 소진 후 폴링 시각 저장 포기(메인 플로우 유지) tenantId={}, paymentId={}",
                tenantId,
                paymentId);
    }

    /**
     * UNKNOWN/IN_PROGRESS 1회를 기록하고 재시도 가능 여부를 반환한다.
     * 소진 임계를 처음 넘을 때만 관리자 알림을 보낸다.
     * 낙관적 락 최종 실패 시 {@link PortOneVerifyUnknownRetryOutcome#RETRYABLE} 을 반환해
     * 메인 결제 반영을 500 으로 깨지 않는다.
     *
     * @param tenantId  테넌트 ID
     * @param paymentId 결제 ID
     * @return {@link PortOneVerifyUnknownRetryOutcome#RETRYABLE} 또는 {@link PortOneVerifyUnknownRetryOutcome#EXHAUSTED}
     */
    public PortOneVerifyUnknownRetryOutcome recordUnknownAndDecide(String tenantId, String paymentId) {
        if (!StringUtils.hasText(tenantId) || !StringUtils.hasText(paymentId)) {
            return PortOneVerifyUnknownRetryOutcome.RETRYABLE;
        }
        int maxRetries = shopPortOneProperties.resolvedVerifyUnknownLockMaxRetries();
        for (int attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return requiresNewTx.execute(status -> recordUnknownAndDecideOnce(tenantId, paymentId));
            } catch (OptimisticLockingFailureException conflict) {
                log.warn(
                        "PortOne UNKNOWN 재시도 기록 충돌 attempt={}/{} tenantId={}, paymentId={}",
                        attempt,
                        maxRetries,
                        tenantId,
                        paymentId);
                sleepBeforeLockRetry(attempt, maxRetries);
            } catch (RuntimeException ex) {
                log.warn(
                        "PortOne UNKNOWN 재시도 기록 실패(메인 플로우 유지) tenantId={}, paymentId={}",
                        tenantId,
                        paymentId,
                        ex);
                return PortOneVerifyUnknownRetryOutcome.RETRYABLE;
            }
        }
        log.warn(
                "PortOne UNKNOWN 재시도 기록 포기(메인 플로우 유지) tenantId={}, paymentId={}",
                tenantId,
                paymentId);
        return PortOneVerifyUnknownRetryOutcome.RETRYABLE;
    }

    /**
     * MATCH/MISMATCH 검증에서 PortOne 실결제액을 감사 컬럼에 남긴다.
     * {@code requested_amount} 는 건드리지 않는다.
     * 낙관적 락 최종 실패 시 로그만 남기고 삼킨다(메인 approve 를 깨지 않음).
     *
     * @param payment          결제 행(호출측 스냅샷 — 성공 시 portonePaidAmount 동기화)
     * @param actualPaidAmount PortOne {@code amount.paid}
     */
    public void recordPortOnePaidAmount(Payment payment, BigDecimal actualPaidAmount) {
        if (payment == null || actualPaidAmount == null
                || !StringUtils.hasText(payment.getTenantId())
                || !StringUtils.hasText(payment.getPaymentId())) {
            return;
        }
        String tenantId = payment.getTenantId();
        String paymentId = payment.getPaymentId();
        int maxRetries = shopPortOneProperties.resolvedVerifyUnknownLockMaxRetries();
        for (int attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                requiresNewTx.executeWithoutResult(
                        status -> recordPortOnePaidAmountOnce(tenantId, paymentId, actualPaidAmount));
                payment.setPortonePaidAmount(actualPaidAmount);
                return;
            } catch (OptimisticLockingFailureException conflict) {
                log.warn(
                        "PortOne paid 감사 저장 충돌 attempt={}/{} tenantId={}, paymentId={}",
                        attempt,
                        maxRetries,
                        tenantId,
                        paymentId);
                sleepBeforeLockRetry(attempt, maxRetries);
            } catch (RuntimeException ex) {
                log.warn(
                        "PortOne paid 감사 저장 실패(메인 플로우 유지) tenantId={}, paymentId={}",
                        tenantId,
                        paymentId,
                        ex);
                payment.setPortonePaidAmount(actualPaidAmount);
                return;
            }
        }
        log.warn(
                "PortOne paid 감사 저장 포기(메인 플로우 유지) tenantId={}, paymentId={}",
                tenantId,
                paymentId);
        payment.setPortonePaidAmount(actualPaidAmount);
    }

    private void markExhaustedPolledOnce(String tenantId, String paymentId) {
        Payment payment = paymentRepository
                .findByTenantIdAndPaymentIdAndIsDeletedFalse(tenantId, paymentId)
                .orElse(null);
        if (payment == null) {
            return;
        }
        payment.setVerifyUnknownExhaustedLastPolledAt(LocalDateTime.now());
        paymentRepository.save(payment);
    }

    private PortOneVerifyUnknownRetryOutcome recordUnknownAndDecideOnce(String tenantId, String paymentId) {
        Payment payment = paymentRepository
                .findByTenantIdAndPaymentIdAndIsDeletedFalse(tenantId, paymentId)
                .orElse(null);
        if (payment == null) {
            log.warn(
                    "PortOne UNKNOWN 재시도 추적: 결제 없음 tenantId={}, paymentId={}",
                    tenantId,
                    paymentId);
            return PortOneVerifyUnknownRetryOutcome.RETRYABLE;
        }
        if (payment.getVerifyUnknownExhaustedAt() != null) {
            return PortOneVerifyUnknownRetryOutcome.EXHAUSTED;
        }

        LocalDateTime now = LocalDateTime.now();
        int attemptCount = payment.getVerifyUnknownAttemptCount() == null
                ? 0
                : payment.getVerifyUnknownAttemptCount();
        attemptCount = attemptCount + 1;
        payment.setVerifyUnknownAttemptCount(attemptCount);
        if (payment.getVerifyUnknownFirstSeenAt() == null) {
            payment.setVerifyUnknownFirstSeenAt(now);
        }

        boolean exhaustedByCount = attemptCount >= shopPortOneProperties.resolvedVerifyUnknownMaxAttempts();
        boolean exhaustedByAge = isExhaustedByAge(payment.getVerifyUnknownFirstSeenAt(), now);
        if (!exhaustedByCount && !exhaustedByAge) {
            paymentRepository.save(payment);
            log.info(
                    "PortOne UNKNOWN 재시도 기록: tenantId={}, paymentId={}, attempt={}/{}",
                    tenantId,
                    paymentId,
                    attemptCount,
                    shopPortOneProperties.resolvedVerifyUnknownMaxAttempts());
            return PortOneVerifyUnknownRetryOutcome.RETRYABLE;
        }

        payment.setVerifyUnknownExhaustedAt(now);
        paymentRepository.save(payment);
        notifyExhaustedOnce(tenantId, payment, attemptCount);
        log.error(
                "PortOne UNKNOWN 재시도 소진: tenantId={}, paymentId={}, orderId={}, attempt={}, firstSeenAt={}",
                tenantId,
                paymentId,
                payment.getOrderId(),
                attemptCount,
                payment.getVerifyUnknownFirstSeenAt());
        return PortOneVerifyUnknownRetryOutcome.EXHAUSTED;
    }

    private void recordPortOnePaidAmountOnce(String tenantId, String paymentId, BigDecimal actualPaidAmount) {
        Payment managed = paymentRepository
                .findByTenantIdAndPaymentIdAndIsDeletedFalse(tenantId, paymentId)
                .orElse(null);
        if (managed == null) {
            return;
        }
        if (managed.getPortonePaidAmount() != null
                && managed.getPortonePaidAmount().compareTo(actualPaidAmount) == 0) {
            return;
        }
        managed.setPortonePaidAmount(actualPaidAmount);
        paymentRepository.save(managed);
    }

    private boolean isExhaustedByAge(LocalDateTime firstSeenAt, LocalDateTime now) {
        long maxAgeMs = shopPortOneProperties.resolvedVerifyUnknownMaxAgeMs();
        if (maxAgeMs <= 0L || firstSeenAt == null) {
            return false;
        }
        long ageMs = Duration.between(firstSeenAt, now).toMillis();
        return ageMs >= maxAgeMs;
    }

    private void notifyExhaustedOnce(String tenantId, Payment payment, int attemptCount) {
        SchedulerFailureNotifier notifier = schedulerFailureNotifierProvider.getIfAvailable();
        if (notifier == null) {
            return;
        }
        String detail = "paymentId=" + payment.getPaymentId()
                + " orderPublicId=" + payment.getOrderId()
                + " attemptCount=" + attemptCount
                + " maxAttempts=" + shopPortOneProperties.resolvedVerifyUnknownMaxAttempts();
        notifier.notifyFailure(
                ShopCheckoutConstants.ADMIN_ALERT_SOURCE_VERIFY_UNKNOWN,
                ShopCheckoutConstants.ADMIN_ALERT_STEP_VERIFY_UNKNOWN_EXHAUSTED,
                tenantId,
                new IllegalStateException(detail));
    }

    private void sleepBeforeLockRetry(int attempt, int maxRetries) {
        if (attempt >= maxRetries) {
            return;
        }
        long delayMs = shopPortOneProperties.resolvedVerifyUnknownLockRetryDelayMs();
        if (delayMs <= 0L) {
            return;
        }
        try {
            Thread.sleep(delayMs);
        } catch (InterruptedException interrupted) {
            Thread.currentThread().interrupt();
        }
    }
}
