package com.coresolution.consultation.service.portone;

import java.time.Duration;
import java.time.LocalDateTime;
import com.coresolution.consultation.config.ShopPortOneProperties;
import com.coresolution.consultation.constant.ShopCheckoutConstants;
import com.coresolution.consultation.entity.Payment;
import com.coresolution.consultation.repository.PaymentRepository;
import com.coresolution.core.monitoring.SchedulerFailureNotifier;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * PortOne 검증 UNKNOWN 내구성 재시도 추적 공통 모듈.
 * <p>
 * expireOrderHold · 웹훅 UNKNOWN · doVerifyPayment(쇼핑 UNKNOWN) 가 공유한다.
 * 시도 횟수·최초 관측·소진 시각을 {@code payments} 에 남기고, 상한 도달 시
 * {@link SchedulerFailureNotifier} 로 관리자 알림을 한 번만 올린다(자동 취소 없음).
 * </p>
 *
 * @author MindGarden
 * @since 2026-10-16
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PortOneVerifyUnknownRetryTracker {

    private final PaymentRepository paymentRepository;
    private final ShopPortOneProperties shopPortOneProperties;
    private final ObjectProvider<SchedulerFailureNotifier> schedulerFailureNotifierProvider;

    /**
     * 이미 UNKNOWN 재시도가 소진된 결제인지 (메모리 스냅샷 기준).
     *
     * @param payment 결제 행
     * @return {@code verify_unknown_exhausted_at} 이 있으면 true
     */
    public boolean isExhausted(Payment payment) {
        return payment != null && payment.getVerifyUnknownExhaustedAt() != null;
    }

    /**
     * UNKNOWN 1회를 기록하고 재시도 가능 여부를 반환한다.
     * 소진 임계를 처음 넘을 때만 관리자 알림을 보낸다.
     *
     * @param tenantId  테넌트 ID
     * @param paymentId 결제 ID
     * @return {@link PortOneVerifyUnknownRetryOutcome#RETRYABLE} 또는 {@link PortOneVerifyUnknownRetryOutcome#EXHAUSTED}
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public PortOneVerifyUnknownRetryOutcome recordUnknownAndDecide(String tenantId, String paymentId) {
        if (!StringUtils.hasText(tenantId) || !StringUtils.hasText(paymentId)) {
            return PortOneVerifyUnknownRetryOutcome.RETRYABLE;
        }
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

    /**
     * MATCH/MISMATCH 검증에서 PortOne 실결제액을 감사 컬럼에 남긴다.
     * {@code requested_amount} 는 건드리지 않는다.
     *
     * @param payment          결제 행
     * @param actualPaidAmount PortOne {@code amount.paid}
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordPortOnePaidAmount(Payment payment, java.math.BigDecimal actualPaidAmount) {
        if (payment == null || actualPaidAmount == null
                || !StringUtils.hasText(payment.getTenantId())
                || !StringUtils.hasText(payment.getPaymentId())) {
            return;
        }
        Payment managed = paymentRepository
                .findByTenantIdAndPaymentIdAndIsDeletedFalse(payment.getTenantId(), payment.getPaymentId())
                .orElse(null);
        if (managed == null) {
            return;
        }
        managed.setPortonePaidAmount(actualPaidAmount);
        paymentRepository.save(managed);
        payment.setPortonePaidAmount(actualPaidAmount);
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
}
