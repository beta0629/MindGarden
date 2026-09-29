package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.constant.ShopLatePaymentConstants;
import com.coresolution.consultation.entity.Payment;
import com.coresolution.consultation.entity.ShopClientOrder;
import com.coresolution.consultation.repository.PaymentRepository;
import com.coresolution.consultation.repository.ShopClientOrderRepository;
import com.coresolution.consultation.service.ShopLatePaymentOutcome;
import com.coresolution.consultation.service.ShopLatePaymentRefundService;
import com.coresolution.consultation.service.ShopNotificationHelper;
import com.coresolution.consultation.service.portone.PortOneV2PaymentCancelService;
import com.coresolution.core.monitoring.SchedulerFailureNotifier;
import java.time.LocalDateTime;
import java.util.Optional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.util.StringUtils;

/**
 * {@link ShopLatePaymentRefundService} 구현.
 * <p>① 주문 행 잠금 트랜잭션에서 대상 판정·결제 건 {@code REFUND_REQUIRED} 선점 →
 * ② 트랜잭션 밖 PortOne 전액 취소 → ③ 주문 행 잠금 트랜잭션에서 {@code REFUNDED}/{@code REFUND_REQUIRED} 확정.
 * ②와 ③ 사이에 서버가 죽어도 결제 건은 {@code REFUND_REQUIRED} 로 남아 재시도·관리자 재처리 대상이 된다.</p>
 *
 * @author MindGarden
 * @since 2026-09-30
 */
@Slf4j
@Service
@Transactional(propagation = Propagation.NOT_SUPPORTED)
public class ShopLatePaymentRefundServiceImpl implements ShopLatePaymentRefundService {

    private final PaymentRepository paymentRepository;
    private final ShopClientOrderRepository shopClientOrderRepository;
    private final PortOneV2PaymentCancelService portOneV2PaymentCancelService;
    private final ShopNotificationHelper shopNotificationHelper;
    private final ObjectProvider<SchedulerFailureNotifier> failureNotifierProvider;
    private final TransactionTemplate lockedTx;

    public ShopLatePaymentRefundServiceImpl(
            PaymentRepository paymentRepository,
            ShopClientOrderRepository shopClientOrderRepository,
            PortOneV2PaymentCancelService portOneV2PaymentCancelService,
            ShopNotificationHelper shopNotificationHelper,
            ObjectProvider<SchedulerFailureNotifier> failureNotifierProvider,
            PlatformTransactionManager transactionManager) {
        this.paymentRepository = paymentRepository;
        this.shopClientOrderRepository = shopClientOrderRepository;
        this.portOneV2PaymentCancelService = portOneV2PaymentCancelService;
        this.shopNotificationHelper = shopNotificationHelper;
        this.failureNotifierProvider = failureNotifierProvider;
        this.lockedTx = new TransactionTemplate(transactionManager);
        this.lockedTx.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
    }

    @Override
    public ShopLatePaymentOutcome refundIfOrderClosed(String tenantId, String paymentId) {
        if (!StringUtils.hasText(tenantId) || !StringUtils.hasText(paymentId)) {
            return ShopLatePaymentOutcome.NOT_APPLICABLE;
        }
        Claim claim = lockedTx.execute(status -> claim(tenantId, paymentId));
        if (claim == null || claim.outcome() != null) {
            return claim == null ? ShopLatePaymentOutcome.NOT_APPLICABLE : claim.outcome();
        }

        boolean cancelled = callPortOneCancel(tenantId, paymentId, claim.provider());

        Settled settled = lockedTx.execute(status -> settle(tenantId, paymentId, cancelled));
        if (settled == null) {
            return ShopLatePaymentOutcome.NOT_APPLICABLE;
        }
        afterSettled(tenantId, paymentId, settled);
        return settled.outcome();
    }

    private Claim claim(String tenantId, String paymentId) {
        Optional<Payment> paymentOpt =
                paymentRepository.findByTenantIdAndPaymentIdAndIsDeletedFalse(tenantId, paymentId);
        if (paymentOpt.isEmpty() || !StringUtils.hasText(paymentOpt.get().getOrderId())) {
            return new Claim(ShopLatePaymentOutcome.NOT_APPLICABLE, null);
        }
        Payment payment = paymentOpt.get();
        Optional<ShopClientOrder> orderOpt =
                shopClientOrderRepository.lockByTenantIdAndPublicId(tenantId, payment.getOrderId());
        if (orderOpt.isEmpty() || !ShopLatePaymentConstants.isClosedOrder(orderOpt.get().getStatus())) {
            return new Claim(ShopLatePaymentOutcome.NOT_APPLICABLE, null);
        }
        if (payment.getStatus() == Payment.PaymentStatus.REFUNDED) {
            return new Claim(ShopLatePaymentOutcome.ALREADY_REFUNDED, null);
        }
        if (payment.getStatus() != Payment.PaymentStatus.REFUND_REQUIRED) {
            payment.setStatus(Payment.PaymentStatus.REFUND_REQUIRED);
            payment.setFailureReason(ShopLatePaymentConstants.FAILURE_REASON_LATE_PAYMENT_ON_CLOSED_ORDER);
            paymentRepository.save(payment);
        }
        return new Claim(null, payment.getProvider());
    }

    private boolean callPortOneCancel(String tenantId, String paymentId, Payment.PaymentProvider provider) {
        if (provider != Payment.PaymentProvider.IAMPORT) {
            log.error("늦은 결제 자동 취소 불가(PortOne 결제 아님): tenantId={}, paymentId={}, provider={}",
                    tenantId, paymentId, provider);
            return false;
        }
        try {
            return portOneV2PaymentCancelService.cancelPayment(
                    tenantId, paymentId, ShopLatePaymentConstants.PORTONE_CANCEL_REASON);
        } catch (RuntimeException ex) {
            log.error("늦은 결제 PortOne 취소 호출 실패: tenantId={}, paymentId={}", tenantId, paymentId, ex);
            return false;
        }
    }

    private Settled settle(String tenantId, String paymentId, boolean cancelled) {
        Payment payment = paymentRepository.findByTenantIdAndPaymentIdAndIsDeletedFalse(tenantId, paymentId)
                .orElse(null);
        if (payment == null) {
            return null;
        }
        ShopClientOrder order = shopClientOrderRepository
                .lockByTenantIdAndPublicId(tenantId, payment.getOrderId())
                .orElse(null);
        if (payment.getStatus() == Payment.PaymentStatus.REFUNDED) {
            return new Settled(ShopLatePaymentOutcome.ALREADY_REFUNDED, order);
        }
        payment.setFailureReason(ShopLatePaymentConstants.FAILURE_REASON_LATE_PAYMENT_ON_CLOSED_ORDER);
        if (cancelled) {
            LocalDateTime now = LocalDateTime.now();
            payment.setStatus(Payment.PaymentStatus.REFUNDED);
            payment.setRefundedAt(now);
            if (payment.getCancelledAt() == null) {
                payment.setCancelledAt(now);
            }
        } else {
            payment.setStatus(Payment.PaymentStatus.REFUND_REQUIRED);
        }
        paymentRepository.save(payment);
        return new Settled(
                cancelled ? ShopLatePaymentOutcome.REFUNDED : ShopLatePaymentOutcome.REFUND_REQUIRED, order);
    }

    private void afterSettled(String tenantId, String paymentId, Settled settled) {
        ShopClientOrder order = settled.order();
        if (settled.outcome() == ShopLatePaymentOutcome.REFUNDED) {
            alertAdmin(tenantId, paymentId, order, ShopLatePaymentConstants.ADMIN_ALERT_STEP_REFUNDED, settled.outcome());
            if (order != null) {
                try {
                    shopNotificationHelper.notifyLatePaymentAutoCancelled(tenantId, order);
                } catch (RuntimeException ex) {
                    log.warn("늦은 결제 자동 취소 내담자 알림 실패: paymentId={}", paymentId, ex);
                }
            }
        } else if (settled.outcome() == ShopLatePaymentOutcome.REFUND_REQUIRED) {
            alertAdmin(tenantId, paymentId, order,
                    ShopLatePaymentConstants.ADMIN_ALERT_STEP_REFUND_REQUIRED, settled.outcome());
        }
    }

    private void alertAdmin(
            String tenantId, String paymentId, ShopClientOrder order, String step, ShopLatePaymentOutcome outcome) {
        String message = String.format(
                ShopLatePaymentConstants.ADMIN_ALERT_MESSAGE_FMT,
                outcome,
                order != null ? order.getPublicId() : null,
                order != null ? order.getStatus() : null,
                paymentId);
        log.error("[{}] {} tenantId={}", ShopLatePaymentConstants.ADMIN_ALERT_SOURCE, message, tenantId);
        try {
            SchedulerFailureNotifier notifier = failureNotifierProvider.getIfAvailable();
            if (notifier != null) {
                notifier.notifyFailure(
                        ShopLatePaymentConstants.ADMIN_ALERT_SOURCE, step, tenantId, new IllegalStateException(message));
            }
        } catch (RuntimeException ex) {
            log.warn("늦은 결제 관리자 알림 전송 실패: paymentId={}", paymentId, ex);
        }
    }

    /** outcome 이 null 이면 PortOne 취소 진행 */
    private record Claim(ShopLatePaymentOutcome outcome, Payment.PaymentProvider provider) {
    }

    private record Settled(ShopLatePaymentOutcome outcome, ShopClientOrder order) {
    }
}
