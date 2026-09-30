package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.constant.ShopClientOrderStatus;
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
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.util.StringUtils;

/**
 * {@link ShopLatePaymentRefundService} 구현.
 * <p>① 주문 행 잠금 트랜잭션에서 대상 판정·결제 건 {@code REFUND_REQUIRED} + 취소 진행 선점 →
 * ② 트랜잭션 밖 PortOne 전액 취소 → ③ 주문 행 잠금 트랜잭션에서 {@code REFUNDED}/{@code REFUND_REQUIRED} 확정.
 * ②와 ③ 사이에 서버가 죽어도 결제 건은 {@code REFUND_REQUIRED} 로 남아 임대 시간 뒤 재시도·관리자 재처리 대상이 된다.</p>
 * <p>대상: 취소·만료로 닫힌 주문의 늦은 결제, 이미 다른 결제로 PAID 인 주문의 이중 결제.
 * 선점 임대 시간 안의 동시 요청은 취소 API 를 다시 부르지 않는다({@link ShopLatePaymentOutcome#REFUND_IN_PROGRESS}).</p>
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
    private final long refundClaimLeaseMs;

    public ShopLatePaymentRefundServiceImpl(
            PaymentRepository paymentRepository,
            ShopClientOrderRepository shopClientOrderRepository,
            PortOneV2PaymentCancelService portOneV2PaymentCancelService,
            ShopNotificationHelper shopNotificationHelper,
            ObjectProvider<SchedulerFailureNotifier> failureNotifierProvider,
            PlatformTransactionManager transactionManager) {
        this(paymentRepository, shopClientOrderRepository, portOneV2PaymentCancelService, shopNotificationHelper,
                failureNotifierProvider, transactionManager, ShopLatePaymentConstants.DEFAULT_REFUND_CLAIM_LEASE_MS);
    }

    @Autowired
    public ShopLatePaymentRefundServiceImpl(
            PaymentRepository paymentRepository,
            ShopClientOrderRepository shopClientOrderRepository,
            PortOneV2PaymentCancelService portOneV2PaymentCancelService,
            ShopNotificationHelper shopNotificationHelper,
            ObjectProvider<SchedulerFailureNotifier> failureNotifierProvider,
            PlatformTransactionManager transactionManager,
            @Value("${shop.late-payment.refund-claim-lease-ms:"
                    + ShopLatePaymentConstants.DEFAULT_REFUND_CLAIM_LEASE_MS + "}") long refundClaimLeaseMs) {
        this.paymentRepository = paymentRepository;
        this.shopClientOrderRepository = shopClientOrderRepository;
        this.portOneV2PaymentCancelService = portOneV2PaymentCancelService;
        this.shopNotificationHelper = shopNotificationHelper;
        this.failureNotifierProvider = failureNotifierProvider;
        this.lockedTx = new TransactionTemplate(transactionManager);
        this.lockedTx.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        this.refundClaimLeaseMs = refundClaimLeaseMs;
    }

    @Override
    public ShopLatePaymentOutcome refundIfOrderClosed(String tenantId, String paymentId) {
        if (!StringUtils.hasText(tenantId) || !StringUtils.hasText(paymentId)) {
            return ShopLatePaymentOutcome.NOT_APPLICABLE;
        }
        // 잠금 트랜잭션 밖 단건 조회로 주문 ID 만 얻는다. 결제 상태는 주문 잠금 뒤 다시 읽는다(주문 → 결제 순서).
        String orderPublicId = paymentRepository.findByTenantIdAndPaymentIdAndIsDeletedFalse(tenantId, paymentId)
                .map(Payment::getOrderId)
                .filter(StringUtils::hasText)
                .orElse(null);
        if (orderPublicId == null) {
            return ShopLatePaymentOutcome.NOT_APPLICABLE;
        }
        Claim claim = lockedTx.execute(status -> claim(tenantId, paymentId, orderPublicId));
        if (claim == null || claim.outcome() != null) {
            return claim == null ? ShopLatePaymentOutcome.NOT_APPLICABLE : claim.outcome();
        }

        boolean cancelled = callPortOneCancel(tenantId, paymentId, claim.provider(), claim.duplicate());

        Settled settled = lockedTx.execute(status -> settle(tenantId, paymentId, orderPublicId, cancelled, claim));
        if (settled == null) {
            return ShopLatePaymentOutcome.NOT_APPLICABLE;
        }
        afterSettled(tenantId, paymentId, settled, claim.duplicate());
        return settled.outcome();
    }

    private Claim claim(String tenantId, String paymentId, String orderPublicId) {
        Optional<ShopClientOrder> orderOpt =
                shopClientOrderRepository.lockByTenantIdAndPublicId(tenantId, orderPublicId);
        if (orderOpt.isEmpty()) {
            return new Claim(ShopLatePaymentOutcome.NOT_APPLICABLE, null, false);
        }
        ShopClientOrder order = orderOpt.get();
        boolean closed = ShopLatePaymentConstants.isClosedOrder(order.getStatus());
        if (!closed && order.getStatus() != ShopClientOrderStatus.PAID) {
            return new Claim(ShopLatePaymentOutcome.NOT_APPLICABLE, null, false);
        }
        Optional<Payment> paymentOpt =
                paymentRepository.findByTenantIdAndPaymentIdAndIsDeletedFalse(tenantId, paymentId);
        if (paymentOpt.isEmpty() || !orderPublicId.equals(paymentOpt.get().getOrderId())) {
            return new Claim(ShopLatePaymentOutcome.NOT_APPLICABLE, null, false);
        }
        Payment payment = paymentOpt.get();
        boolean duplicate = !closed && isDuplicateOnPaidOrder(tenantId, orderPublicId, payment);
        if (!closed && !duplicate) {
            return new Claim(ShopLatePaymentOutcome.NOT_APPLICABLE, null, false);
        }
        if (payment.getStatus() == Payment.PaymentStatus.REFUNDED) {
            return new Claim(ShopLatePaymentOutcome.ALREADY_REFUNDED, null, duplicate);
        }
        if (isClaimLeaseActive(payment)) {
            log.warn("늦은·중복 결제 자동 취소 진행 중 — 취소 API 재호출 안 함: tenantId={}, paymentId={}",
                    tenantId, paymentId);
            return new Claim(ShopLatePaymentOutcome.REFUND_IN_PROGRESS, null, duplicate);
        }
        payment.setStatus(Payment.PaymentStatus.REFUND_REQUIRED);
        payment.setFailureReason(ShopLatePaymentConstants.FAILURE_REASON_AUTO_REFUND_IN_PROGRESS);
        payment.setUpdatedAt(LocalDateTime.now());
        paymentRepository.save(payment);
        return new Claim(null, payment.getProvider(), duplicate);
    }

    /**
     * 주문이 PAID 이고 이 결제가 아닌 다른 결제가 APPROVED 면 이중 결제.
     * 이 결제가 APPROVED 이면(정상 승인 결제) 대상이 아니다.
     */
    private boolean isDuplicateOnPaidOrder(String tenantId, String orderPublicId, Payment payment) {
        if (payment.getStatus() == Payment.PaymentStatus.APPROVED) {
            return false;
        }
        List<Payment> linked = paymentRepository.lockByTenantIdAndOrderId(tenantId, orderPublicId);
        return linked != null && linked.stream().anyMatch(other ->
                other.getStatus() == Payment.PaymentStatus.APPROVED
                        && other.getPaymentId() != null
                        && !other.getPaymentId().equals(payment.getPaymentId()));
    }

    private boolean isClaimLeaseActive(Payment payment) {
        if (payment.getStatus() != Payment.PaymentStatus.REFUND_REQUIRED
                || !ShopLatePaymentConstants.FAILURE_REASON_AUTO_REFUND_IN_PROGRESS.equals(payment.getFailureReason())
                || payment.getUpdatedAt() == null) {
            return false;
        }
        return payment.getUpdatedAt().plus(Duration.ofMillis(refundClaimLeaseMs)).isAfter(LocalDateTime.now());
    }

    private boolean callPortOneCancel(
            String tenantId, String paymentId, Payment.PaymentProvider provider, boolean duplicate) {
        if (provider != Payment.PaymentProvider.IAMPORT) {
            log.error("늦은 결제 자동 취소 불가(PortOne 결제 아님): tenantId={}, paymentId={}, provider={}",
                    tenantId, paymentId, provider);
            return false;
        }
        try {
            return portOneV2PaymentCancelService.cancelPayment(
                    tenantId,
                    paymentId,
                    duplicate
                            ? ShopLatePaymentConstants.PORTONE_CANCEL_REASON_DUPLICATE
                            : ShopLatePaymentConstants.PORTONE_CANCEL_REASON);
        } catch (RuntimeException ex) {
            log.error("늦은 결제 PortOne 취소 호출 실패: tenantId={}, paymentId={}", tenantId, paymentId, ex);
            return false;
        }
    }

    private Settled settle(String tenantId, String paymentId, String orderPublicId, boolean cancelled, Claim claim) {
        ShopClientOrder order = shopClientOrderRepository
                .lockByTenantIdAndPublicId(tenantId, orderPublicId)
                .orElse(null);
        Payment payment = paymentRepository.findByTenantIdAndPaymentIdAndIsDeletedFalse(tenantId, paymentId)
                .orElse(null);
        if (payment == null) {
            return null;
        }
        if (payment.getStatus() == Payment.PaymentStatus.REFUNDED) {
            return new Settled(ShopLatePaymentOutcome.ALREADY_REFUNDED, order);
        }
        payment.setFailureReason(claim.duplicate()
                ? ShopLatePaymentConstants.FAILURE_REASON_DUPLICATE_PAYMENT_ON_PAID_ORDER
                : ShopLatePaymentConstants.FAILURE_REASON_LATE_PAYMENT_ON_CLOSED_ORDER);
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

    private void afterSettled(String tenantId, String paymentId, Settled settled, boolean duplicate) {
        ShopClientOrder order = settled.order();
        if (settled.outcome() == ShopLatePaymentOutcome.REFUNDED) {
            alertAdmin(tenantId, paymentId, order, ShopLatePaymentConstants.ADMIN_ALERT_STEP_REFUNDED,
                    settled.outcome(), duplicate);
            // 늦은 결제 안내 문구는 '닫힌 주문' 기준 — 이중 결제(주문 PAID 유지)에는 보내지 않는다
            if (order != null && !duplicate) {
                try {
                    shopNotificationHelper.notifyLatePaymentAutoCancelled(tenantId, order);
                } catch (RuntimeException ex) {
                    log.warn("늦은 결제 자동 취소 내담자 알림 실패: paymentId={}", paymentId, ex);
                }
            }
        } else if (settled.outcome() == ShopLatePaymentOutcome.REFUND_REQUIRED) {
            alertAdmin(tenantId, paymentId, order,
                    ShopLatePaymentConstants.ADMIN_ALERT_STEP_REFUND_REQUIRED, settled.outcome(), duplicate);
        }
    }

    private void alertAdmin(String tenantId, String paymentId, ShopClientOrder order, String step,
            ShopLatePaymentOutcome outcome, boolean duplicate) {
        String message = String.format(
                duplicate
                        ? ShopLatePaymentConstants.ADMIN_ALERT_MESSAGE_DUPLICATE_FMT
                        : ShopLatePaymentConstants.ADMIN_ALERT_MESSAGE_FMT,
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

    /** outcome 이 null 이면 PortOne 취소 진행. duplicate 는 이중 결제(주문 PAID) 대상 여부 */
    private record Claim(ShopLatePaymentOutcome outcome, Payment.PaymentProvider provider, boolean duplicate) {
    }

    private record Settled(ShopLatePaymentOutcome outcome, ShopClientOrder order) {
    }
}
