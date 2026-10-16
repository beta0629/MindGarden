package com.coresolution.consultation.service.portone;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicInteger;
import com.coresolution.consultation.config.ShopPortOneProperties;
import com.coresolution.consultation.constant.ShopCheckoutConstants;
import com.coresolution.consultation.entity.Payment;
import com.coresolution.consultation.repository.PaymentRepository;
import com.coresolution.core.monitoring.SchedulerFailureNotifier;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.AbstractPlatformTransactionManager;
import org.springframework.transaction.support.DefaultTransactionStatus;

/**
 * {@link PortOneVerifyUnknownRetryTracker} 상한·알림 멱등·낙관적 락 재시도·소진 후 폴링 단위 검증.
 *
 * @author MindGarden
 * @since 2026-10-16
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("PortOneVerifyUnknownRetryTracker")
class PortOneVerifyUnknownRetryTrackerTest {

    private static final String TENANT = "tenant-unknown-retry";
    private static final String PAYMENT_ID = "pay-unknown-1";

    @Mock
    private PaymentRepository paymentRepository;
    @Mock
    private ObjectProvider<SchedulerFailureNotifier> notifierProvider;
    @Mock
    private SchedulerFailureNotifier notifier;

    private ShopPortOneProperties properties;
    private PortOneVerifyUnknownRetryTracker tracker;

    @BeforeEach
    void setUp() {
        properties = new ShopPortOneProperties();
        properties.setVerifyUnknownMaxAttempts(3);
        properties.setVerifyUnknownMaxAgeMs(0L);
        properties.setVerifyUnknownExhaustedPollIntervalMs(3_600_000L);
        properties.setVerifyUnknownLockMaxRetries(3);
        properties.setVerifyUnknownLockRetryDelayMs(0L);
        tracker = new PortOneVerifyUnknownRetryTracker(
                paymentRepository, properties, notifierProvider, passthroughTransactionManager());
        lenient().when(notifierProvider.getIfAvailable()).thenReturn(notifier);
        lenient().when(paymentRepository.save(any(Payment.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    @DisplayName("상한 미만이면 RETRYABLE·카운트 증가·알림 없음")
    void recordUnknown_underCap_retryable() {
        Payment payment = paymentWithAttempts(1);
        when(paymentRepository.findByTenantIdAndPaymentIdAndIsDeletedFalse(TENANT, PAYMENT_ID))
                .thenReturn(Optional.of(payment));

        PortOneVerifyUnknownRetryOutcome outcome = tracker.recordUnknownAndDecide(TENANT, PAYMENT_ID);

        assertEquals(PortOneVerifyUnknownRetryOutcome.RETRYABLE, outcome);
        assertEquals(2, payment.getVerifyUnknownAttemptCount());
        assertNotNull(payment.getVerifyUnknownFirstSeenAt());
        assertNull(payment.getVerifyUnknownExhaustedAt());
        verify(notifier, never()).notifyFailure(any(), any(), any(), any());
    }

    @Test
    @DisplayName("상한 도달 시 EXHAUSTED·알림 1회·exhausted_at 기록")
    void recordUnknown_reachesCap_exhaustedOnce() {
        Payment payment = paymentWithAttempts(2);
        when(paymentRepository.findByTenantIdAndPaymentIdAndIsDeletedFalse(TENANT, PAYMENT_ID))
                .thenReturn(Optional.of(payment));

        PortOneVerifyUnknownRetryOutcome first = tracker.recordUnknownAndDecide(TENANT, PAYMENT_ID);
        assertEquals(PortOneVerifyUnknownRetryOutcome.EXHAUSTED, first);
        assertNotNull(payment.getVerifyUnknownExhaustedAt());
        assertEquals(3, payment.getVerifyUnknownAttemptCount());

        ArgumentCaptor<String> source = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> step = ArgumentCaptor.forClass(String.class);
        verify(notifier, times(1)).notifyFailure(source.capture(), step.capture(), eq(TENANT), any());
        assertEquals(ShopCheckoutConstants.ADMIN_ALERT_SOURCE_VERIFY_UNKNOWN, source.getValue());
        assertEquals(ShopCheckoutConstants.ADMIN_ALERT_STEP_VERIFY_UNKNOWN_EXHAUSTED, step.getValue());

        PortOneVerifyUnknownRetryOutcome second = tracker.recordUnknownAndDecide(TENANT, PAYMENT_ID);
        assertEquals(PortOneVerifyUnknownRetryOutcome.EXHAUSTED, second);
        verify(notifier, times(1)).notifyFailure(any(), any(), any(), any());
        assertTrue(tracker.isExhausted(payment));
    }

    @Test
    @DisplayName("recordPortOnePaidAmount — 낙관적 락 1회 충돌 후 재조회로 성공·예외 비전파")
    void recordPortOnePaidAmount_optimisticConflict_retriesThenSucceeds() {
        Payment caller = paymentWithAttempts(0);
        Payment firstLoad = paymentWithAttempts(0);
        Payment secondLoad = paymentWithAttempts(0);
        AtomicInteger finds = new AtomicInteger();
        when(paymentRepository.findByTenantIdAndPaymentIdAndIsDeletedFalse(TENANT, PAYMENT_ID))
                .thenAnswer(inv -> Optional.of(finds.getAndIncrement() == 0 ? firstLoad : secondLoad));
        AtomicInteger saves = new AtomicInteger();
        when(paymentRepository.save(any(Payment.class))).thenAnswer(inv -> {
            if (saves.getAndIncrement() == 0) {
                throw new OptimisticLockingFailureException("simulated conflict");
            }
            return inv.getArgument(0);
        });

        BigDecimal paid = BigDecimal.valueOf(1000L);
        tracker.recordPortOnePaidAmount(caller, paid);

        assertEquals(0, paid.compareTo(caller.getPortonePaidAmount()));
        assertEquals(0, paid.compareTo(secondLoad.getPortonePaidAmount()));
        verify(paymentRepository, times(2)).save(any(Payment.class));
    }

    @Test
    @DisplayName("recordUnknownAndDecide — 낙관적 락 소진 시 RETRYABLE 반환·예외 비전파")
    void recordUnknown_optimisticConflictExhausted_returnsRetryable() {
        // 매 재시도마다 새 스냅샷 — 실패 TX 의 인메모리 증가가 다음 시도를 오염시키지 않게 함
        when(paymentRepository.findByTenantIdAndPaymentIdAndIsDeletedFalse(TENANT, PAYMENT_ID))
                .thenAnswer(inv -> Optional.of(paymentWithAttempts(1)));
        when(paymentRepository.save(any(Payment.class)))
                .thenThrow(new OptimisticLockingFailureException("simulated conflict"));

        PortOneVerifyUnknownRetryOutcome outcome = tracker.recordUnknownAndDecide(TENANT, PAYMENT_ID);

        assertEquals(PortOneVerifyUnknownRetryOutcome.RETRYABLE, outcome);
        verify(paymentRepository, times(3)).save(any(Payment.class));
        verify(notifier, never()).notifyFailure(any(), any(), any(), any());
    }

    @Test
    @DisplayName("shouldPollAfterExhausted — 소진·lastPolled 없으면 true, 간격 미도달이면 false")
    void shouldPollAfterExhausted_intervalGate() {
        Payment notExhausted = paymentWithAttempts(1);
        assertTrue(tracker.shouldPollAfterExhausted(notExhausted));

        Payment exhausted = paymentWithAttempts(3);
        exhausted.setVerifyUnknownExhaustedAt(LocalDateTime.now().minusHours(2));
        assertTrue(tracker.shouldPollAfterExhausted(exhausted));

        exhausted.setVerifyUnknownExhaustedLastPolledAt(LocalDateTime.now().minusMinutes(10));
        assertFalse(tracker.shouldPollAfterExhausted(exhausted));

        exhausted.setVerifyUnknownExhaustedLastPolledAt(LocalDateTime.now().minusHours(2));
        assertTrue(tracker.shouldPollAfterExhausted(exhausted));
    }

    @Test
    @DisplayName("markExhaustedPolled — lastPolledAt 기록")
    void markExhaustedPolled_setsTimestamp() {
        Payment payment = paymentWithAttempts(3);
        payment.setVerifyUnknownExhaustedAt(LocalDateTime.now().minusHours(1));
        when(paymentRepository.findByTenantIdAndPaymentIdAndIsDeletedFalse(TENANT, PAYMENT_ID))
                .thenReturn(Optional.of(payment));

        tracker.markExhaustedPolled(TENANT, PAYMENT_ID);

        assertNotNull(payment.getVerifyUnknownExhaustedLastPolledAt());
        verify(paymentRepository, times(1)).save(payment);
    }

    @Test
    @DisplayName("markExhaustedPolledOn — 필드만 set·save/REQUIRES_NEW 없음")
    void markExhaustedPolledOn_setsFieldWithoutSave() {
        Payment payment = paymentWithAttempts(3);
        payment.setVerifyUnknownExhaustedAt(LocalDateTime.now().minusHours(1));
        payment.setVersion(2L);

        tracker.markExhaustedPolledOn(payment);

        assertNotNull(payment.getVerifyUnknownExhaustedLastPolledAt());
        assertEquals(2L, payment.getVersion());
        verify(paymentRepository, never()).save(any());
        verify(paymentRepository, never()).findByTenantIdAndPaymentIdAndIsDeletedFalse(any(), any());
    }

    private static Payment paymentWithAttempts(int attempts) {
        Payment payment = Payment.builder()
                .paymentId(PAYMENT_ID)
                .orderId("ord-1")
                .amount(BigDecimal.valueOf(1000L))
                .status(Payment.PaymentStatus.PENDING)
                .verifyUnknownAttemptCount(attempts)
                .verifyUnknownFirstSeenAt(attempts > 0 ? LocalDateTime.now().minusMinutes(1) : null)
                .build();
        payment.setTenantId(TENANT);
        return payment;
    }

    private static PlatformTransactionManager passthroughTransactionManager() {
        return new AbstractPlatformTransactionManager() {
            @Override
            protected Object doGetTransaction() {
                return new Object();
            }

            @Override
            protected void doBegin(Object transaction, TransactionDefinition definition) {
                // no-op unit stub
            }

            @Override
            protected void doCommit(DefaultTransactionStatus status) {
                // no-op unit stub
            }

            @Override
            protected void doRollback(DefaultTransactionStatus status) {
                // no-op unit stub — conflict retries start a fresh template TX
            }
        };
    }
}
