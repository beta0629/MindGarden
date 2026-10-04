package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.constant.ShopCheckoutConstants;
import com.coresolution.consultation.constant.ShopClientOrderStatus;
import com.coresolution.consultation.constant.ShopRefundConstants;
import com.coresolution.consultation.dto.shop.EffectivePointTenantPolicies;
import com.coresolution.consultation.dto.shop.admin.ShopOrderRefundResponse;
import com.coresolution.consultation.entity.Payment;
import com.coresolution.consultation.entity.ShopClientOrder;
import com.coresolution.consultation.exception.RefundLedgerNotRecordedException;
import com.coresolution.consultation.exception.SalaryTaxRateNotConfiguredException;
import com.coresolution.consultation.exception.ShopRefundClinicChainException;
import com.coresolution.consultation.exception.ShopRefundInProgressException;
import com.coresolution.consultation.repository.PaymentRepository;
import com.coresolution.consultation.repository.ShopClientOrderLineRepository;
import com.coresolution.consultation.repository.ShopClientOrderRepository;
import com.coresolution.consultation.service.AdminShopOrderRefundService;
import com.coresolution.consultation.service.ClientPointWalletService;
import com.coresolution.consultation.service.PaymentGatewayService;
import com.coresolution.consultation.service.PaymentService;
import com.coresolution.consultation.service.PointTenantPolicyService;
import com.coresolution.consultation.service.SalaryTaxRateLookupService;
import com.coresolution.consultation.service.ShopNotificationHelper;
import com.coresolution.consultation.service.ShopOrderFulfillmentService;
import com.coresolution.consultation.service.portone.PortOneV2PaymentCancelService;
import com.coresolution.consultation.service.portone.PortOneV2PaymentVerifyService;
import com.coresolution.consultation.service.shop.ShopOrderRefundableAmountResolver;
import com.coresolution.consultation.service.shop.ShopOrderRefundableAmountResolver.RefundableAmount;
import com.coresolution.consultation.util.OutsideTransactionScope;
import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.transaction.support.TransactionTemplate;
import lombok.extern.slf4j.Slf4j;

/**
 * 어드민 PAID 주문 전액 환불 — fail-closed: PG 실취소 증거 없이 Clinic REFUNDED 금지.
 *
 * <p><b>PortOne 호출은 DB 트랜잭션·커넥션 밖에서 한다.</b> 상태 전이:
 * <pre>
 *  PAID (lease 없음)
 *    │ ① 선점 트랜잭션: 주문 행 잠금, (매칭 연결 상담 라인이 있으면) 기관 VAT 세율 확인(없으면 422·변경 없음),
 *    │    lease_until = now + lease, attempted_at = now, 커밋
 *    ▼
 *  PAID + lease ── ② 트랜잭션 없음: 잔액 계산(PortOne 누적 취소액) → PortOne 취소 → 취소 증거 확인
 *    │   ├ PG 호출 전 거부(잔액 0 등)  → 새 트랜잭션: lease 해제 + attempted_at 원복 → PAID (변화 없음)
 *    │   └ PG 호출 후 실패/응답 유실    → 새 트랜잭션: lease 해제, attempted_at 유지 → PAID (재시도 가능)
 *    ▼
 *  ③ 반영 트랜잭션: 주문 재잠금 → Payment cancelledAt·REFUNDED, 회기 원복·EXPENSE, 포인트, 주문 REFUNDED, lease 해제
 *    │   └ 실패 → 롤백 + 새 트랜잭션: lease 해제(attempted_at 유지) → PAID + {@link ShopRefundClinicChainException}
 *    ▼
 *  REFUNDED → ④ 커밋 뒤 환불 알림 (트랜잭션 없음)
 * </pre>
 *
 * <p><b>이중 환불 방지</b>:
 * <ul>
 *   <li>lease 가 살아 있는 동안 같은 주문의 다른 요청은 PG 를 부르지 않고 409
 *       ({@link ShopRefundInProgressException}). 선점은 주문 행 잠금으로 직렬화한다.</li>
 *   <li>PortOne 취소 요청에는 {@code Idempotency-Key}(결제 ID + PG 기취소 누적액 + 취소액)를 싣는다.
 *       같은 PG 상태에서의 재요청은 같은 키라 PortOne 이 한 번만 처리한다.</li>
 *   <li>재시도는 항상 PortOne 누적 취소액으로 잔액을 다시 계산한다. 이전 시도(attempted_at)가 있고
 *       잔액 0·PG 기취소액 &gt; 0 이면 PG 호출 없이 취소 증거만 확인하고 ③만 수행한다.</li>
 *   <li>PortOne 이 아닌 PG 는 누적 취소액을 조회할 수 없으므로 이전 시도가 있으면 자동 재시도하지 않는다(409).</li>
 *   <li>③은 주문을 다시 잠그고 PAID 일 때만 반영한다. 이미 REFUNDED 면 반영 없이 멱등 응답.</li>
 * </ul>
 *
 * <p>누적 환불(매핑 측 부분 환불 + PG 취소)은 결제액을 넘지 않는다 — PG 는 잔액만 취소하고, 잔액 0 이면 거부.
 * PG 실패 시 회기·EXPENSE·주문 REFUNDED 를 호출하지 않는다.
 *
 * @author MindGarden
 * @since 2026-05-19
 */
@Slf4j
@Service
public class AdminShopOrderRefundServiceImpl implements AdminShopOrderRefundService {

    private static final String PG_REFUND_REASON_PREFIX = "Shop admin refund: ";

    private final ShopClientOrderRepository shopClientOrderRepository;
    private final ClientPointWalletService clientPointWalletService;
    private final PointTenantPolicyService pointTenantPolicyService;
    private final PaymentRepository paymentRepository;
    private final PaymentService paymentService;
    private final PaymentGatewayService paymentGatewayService;
    private final ShopNotificationHelper shopNotificationHelper;
    private final ShopOrderFulfillmentService shopOrderFulfillmentService;
    private final PortOneV2PaymentCancelService portOneV2PaymentCancelService;
    private final PortOneV2PaymentVerifyService portOneV2PaymentVerifyService;
    private final ShopOrderRefundableAmountResolver shopOrderRefundableAmountResolver;
    private final SalaryTaxRateLookupService salaryTaxRateLookupService;
    private final ShopClientOrderLineRepository shopClientOrderLineRepository;
    private final TransactionTemplate newTx;
    private final Duration pgLease;

    public AdminShopOrderRefundServiceImpl(
            ShopClientOrderRepository shopClientOrderRepository,
            ClientPointWalletService clientPointWalletService,
            PointTenantPolicyService pointTenantPolicyService,
            PaymentRepository paymentRepository,
            PaymentService paymentService,
            ShopNotificationHelper shopNotificationHelper,
            ShopOrderFulfillmentService shopOrderFulfillmentService,
            PortOneV2PaymentCancelService portOneV2PaymentCancelService,
            PortOneV2PaymentVerifyService portOneV2PaymentVerifyService,
            ShopOrderRefundableAmountResolver shopOrderRefundableAmountResolver,
            SalaryTaxRateLookupService salaryTaxRateLookupService,
            ShopClientOrderLineRepository shopClientOrderLineRepository,
            PlatformTransactionManager transactionManager,
            @Value("${shop.admin-refund.pg-lease-ms:" + ShopRefundConstants.DEFAULT_ADMIN_REFUND_PG_LEASE_MS + "}")
            long pgLeaseMs,
            @Autowired(required = false) PaymentGatewayService paymentGatewayService) {
        this.shopOrderRefundableAmountResolver = shopOrderRefundableAmountResolver;
        this.salaryTaxRateLookupService = salaryTaxRateLookupService;
        this.shopClientOrderLineRepository = shopClientOrderLineRepository;
        this.shopClientOrderRepository = shopClientOrderRepository;
        this.clientPointWalletService = clientPointWalletService;
        this.pointTenantPolicyService = pointTenantPolicyService;
        this.paymentRepository = paymentRepository;
        this.paymentService = paymentService;
        this.shopNotificationHelper = shopNotificationHelper;
        this.shopOrderFulfillmentService = shopOrderFulfillmentService;
        this.portOneV2PaymentCancelService = portOneV2PaymentCancelService;
        this.portOneV2PaymentVerifyService = portOneV2PaymentVerifyService;
        this.paymentGatewayService = paymentGatewayService;
        this.newTx = new TransactionTemplate(transactionManager);
        this.newTx.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        this.pgLease = Duration.ofMillis(pgLeaseMs);
    }

    /**
     * @throws IllegalStateException DB 트랜잭션 안에서 호출했을 때 (PortOne 호출 동안 커넥션을 쥐지 않도록)
     */
    @Override
    public ShopOrderRefundResponse refundPaidOrder(String tenantId, String orderPublicId, String reasonCode) {
        if (TransactionSynchronizationManager.isActualTransactionActive()) {
            throw new IllegalStateException("쇼핑 주문 전액 환불은 DB 트랜잭션 밖에서 호출해야 합니다.");
        }
        return OutsideTransactionScope.call(() -> refund(tenantId, orderPublicId, reasonCode));
    }

    private ShopOrderRefundResponse refund(String tenantId, String orderPublicId, String reasonCode) {
        RefundClaim claim = newTx.execute(status -> claim(tenantId, orderPublicId));
        if (claim.alreadyRefunded()) {
            return repairRefunded(tenantId, orderPublicId, reasonCode);
        }

        PgStep pg = new PgStep();
        try {
            executePgRefund(tenantId, orderPublicId, reasonCode, claim, pg);
        } catch (RuntimeException ex) {
            releaseLease(tenantId, orderPublicId, !pg.called, claim.priorAttemptAt(), ex);
            throw ex;
        }

        boolean pgCancelCompleted = ShopRefundConstants.PG_REFUND_STATUS_COMPLETED.equals(pg.status)
                || ShopRefundConstants.PG_REFUND_STATUS_NOT_APPLICABLE.equals(pg.status);
        Finalized finalized;
        try {
            finalized = newTx.execute(status -> finalizeRefund(tenantId, orderPublicId, reasonCode, claim, pg.status));
        } catch (RuntimeException ex) {
            releaseLease(tenantId, orderPublicId, false, null, ex);
            throw wrapClinicFailure(orderPublicId, pgCancelCompleted, ex);
        }

        if (finalized.refundedNow()) {
            try {
                shopNotificationHelper.notifyOrderRefunded(tenantId, finalized.order());
            } catch (Exception ex) {
                log.warn("쇼핑 주문 환불 알림 실패: orderPublicId={}", orderPublicId, ex);
            }
        }
        return finalized.response();
    }

    /**
     * ① 선점: 주문 잠금 → PAID 확인 → lease·attempted_at 기록. PG 를 부르지 않는 거부는 여기서 롤백(변경 없음).
     */
    private RefundClaim claim(String tenantId, String orderPublicId) {
        ShopClientOrder order = shopClientOrderRepository.lockByTenantIdAndPublicId(tenantId, orderPublicId)
                .orElseThrow(() -> new IllegalArgumentException("주문을 찾을 수 없습니다."));
        if (order.getStatus() == ShopClientOrderStatus.REFUNDED) {
            return RefundClaim.refunded();
        }
        if (order.getStatus() != ShopClientOrderStatus.PAID) {
            throw new IllegalArgumentException("PAID 상태의 주문만 전액 환불할 수 있습니다.");
        }
        LocalDateTime now = LocalDateTime.now();
        requireNoActiveLease(order, orderPublicId, now);
        requireRefundLedgerTaxRate(tenantId, order);

        LocalDateTime priorAttemptAt = order.getRefundPgAttemptedAt();
        Payment payment = null;
        boolean iamport = false;
        if (order.getCashDueMinor() > 0L) {
            payment = paymentRepository
                    .findFirstByTenantIdAndOrderIdAndStatusAndIsDeletedFalseOrderByIdDesc(
                            tenantId, orderPublicId, Payment.PaymentStatus.APPROVED)
                    .orElseThrow(() -> new IllegalStateException(
                            "승인된 결제를 찾을 수 없습니다. orderPublicId=" + orderPublicId));
            iamport = portOneV2PaymentVerifyService.isIamportPayment(payment);
            if (!iamport) {
                if (paymentGatewayService == null) {
                    throw new IllegalStateException(String.format(
                            ShopRefundConstants.MSG_PG_GATEWAY_UNAVAILABLE_FMT, payment.getPaymentId()));
                }
                if (priorAttemptAt != null) {
                    log.warn("PortOne 외 결제 PG 환불 재시도 차단(이전 요청 결과 미확인): tenantId={}, orderPublicId={}",
                            tenantId, orderPublicId);
                    throw ShopRefundInProgressException.manualCheckRequired(orderPublicId);
                }
            }
            order.setRefundPgAttemptedAt(now);
        }
        order.setRefundPgLeaseUntil(now.plus(pgLease));
        shopClientOrderRepository.save(order);
        return new RefundClaim(false, order, payment, iamport, priorAttemptAt);
    }

    /**
     * ② PG 취소 (트랜잭션 없음). {@code pg.called} 는 PG 취소 API 를 부르기 직전에 true 가 된다.
     */
    private void executePgRefund(
            String tenantId, String orderPublicId, String reasonCode, RefundClaim claim, PgStep pg) {
        Payment payment = claim.payment();
        if (payment == null) {
            pg.status = ShopRefundConstants.PG_REFUND_STATUS_NOT_APPLICABLE;
            return;
        }
        RefundableAmount refundable = shopOrderRefundableAmountResolver.resolve(tenantId, claim.order(), payment);
        if (refundable.isExhausted()) {
            if (claim.iamport() && claim.priorAttemptAt() != null && refundable.pgCancelledAmount() > 0L) {
                log.info("이전 PG 취소 반영 확인 — PG 재호출 없이 Clinic 반영: tenantId={}, orderPublicId={}, pgCancelled={}",
                        tenantId, orderPublicId, refundable.pgCancelledAmount());
                requirePortOneCancelEvidence(tenantId, payment.getPaymentId(), true);
                pg.status = ShopRefundConstants.PG_REFUND_STATUS_COMPLETED;
                return;
            }
            String message = exhaustedMessage(orderPublicId, refundable);
            log.warn("쇼핑 주문 환불 거부(PG 호출 없음): tenantId={}, {}", tenantId, message);
            throw new IllegalArgumentException(message);
        }

        String pgReason = PG_REFUND_REASON_PREFIX + reasonCode;
        pg.called = true;
        if (claim.iamport()) {
            cancelRemainingViaPortOneWithEvidence(tenantId, payment.getPaymentId(), pgReason, refundable);
        } else {
            BigDecimal pgRefundAmount = refundable.isFullAmount()
                    ? payment.getAmount()
                    : BigDecimal.valueOf(refundable.remainingAmount());
            boolean pgOk = paymentGatewayService.refundPayment(payment.getPaymentId(), pgRefundAmount, pgReason);
            if (!pgOk) {
                throw new IllegalStateException("PG 환불에 실패했습니다. paymentId=" + payment.getPaymentId());
            }
        }
        pg.status = ShopRefundConstants.PG_REFUND_STATUS_COMPLETED;
    }

    /**
     * ③ 반영: 주문 재잠금 → PAID 일 때만 결제 REFUNDED·회기 원복·EXPENSE·포인트·주문 REFUNDED·lease 해제.
     */
    private Finalized finalizeRefund(
            String tenantId, String orderPublicId, String reasonCode, RefundClaim claim, String pgRefundStatus) {
        ShopClientOrder order = shopClientOrderRepository.lockByTenantIdAndPublicId(tenantId, orderPublicId)
                .orElseThrow(() -> new IllegalArgumentException("주문을 찾을 수 없습니다."));
        if (order.getStatus() == ShopClientOrderStatus.REFUNDED) {
            log.info("쇼핑 주문 이미 REFUNDED(동시 반영) — 반영 생략: tenantId={}, orderPublicId={}",
                    tenantId, orderPublicId);
            return new Finalized(order, buildResponse(order, reasonCode, 0L, 0L, pgRefundStatus), false);
        }
        if (order.getStatus() != ShopClientOrderStatus.PAID) {
            throw new IllegalStateException("PAID 상태가 아니어서 환불을 반영할 수 없습니다. orderPublicId=" + orderPublicId);
        }

        if (claim.payment() != null) {
            String paymentId = claim.payment().getPaymentId();
            Payment payment = paymentRepository.findByTenantIdAndPaymentIdAndIsDeletedFalse(tenantId, paymentId)
                    .orElseThrow(() -> new IllegalStateException("결제를 찾을 수 없습니다. paymentId=" + paymentId));
            // PG 실취소 증거 → cancelledAt 기록 (REFUNDED 전환 전). clinic reverse 는 아래에서 1회만 수행
            payment.setCancelledAt(LocalDateTime.now());
            paymentRepository.save(payment);
            paymentService.refundPayment(paymentId, payment.getAmount(), PG_REFUND_REASON_PREFIX + reasonCode, false);
            assertCancelledAtPresent(tenantId, paymentId);
        }

        shopOrderFulfillmentService.reversePaidOrderFulfillment(tenantId, order);

        long pointsRestored = 0L;
        long pointsRedeem = order.getPointsRedeemMinor();
        if (pointsRedeem > 0L) {
            clientPointWalletService.restoreRedeemOnRefund(
                    tenantId,
                    order.getClientId(),
                    orderPublicId,
                    pointsRedeem,
                    ShopCheckoutConstants.pointCommitReversalKey(orderPublicId));
            pointsRestored = pointsRedeem;
        }

        EffectivePointTenantPolicies policies = pointTenantPolicyService.getEffectivePoliciesTyped(tenantId);
        long earnTarget = policies.computeEarnAmountMinor(order.getSubtotalMinor(), order.getCashDueMinor());
        long pointsClawed = 0L;
        if (earnTarget > 0L) {
            pointsClawed = clientPointWalletService.clawbackEarn(
                    tenantId,
                    order.getClientId(),
                    orderPublicId,
                    earnTarget,
                    ShopCheckoutConstants.pointClawbackKey(orderPublicId));
        }

        order.setStatus(ShopClientOrderStatus.REFUNDED);
        order.setRefundPgLeaseUntil(null);
        shopClientOrderRepository.save(order);
        log.info(
                "쇼핑 주문 전액 환불: tenantId={}, orderPublicId={}, reasonCode={}, restored={}, clawed={}, pg={}",
                tenantId,
                orderPublicId,
                reasonCode,
                pointsRestored,
                pointsClawed,
                pgRefundStatus);
        return new Finalized(order, buildResponse(order, reasonCode, pointsRestored, pointsClawed, pgRefundStatus),
                true);
    }

    /**
     * 이미 REFUNDED 주문 멱등 처리: PG 증거(내부 Payment REFUNDED·cancelledAt) 확인 후 회기 수리.
     *
     * <p>PG 증거가 없는 IAMPORT 결제는 같은 선점 → PortOne(트랜잭션 없음) → 반영 순서로 누락된 PG 실취소를
     * 보완한다 (fail-closed). 비-IAMPORT 결제는 PG 보완 불가.</p>
     */
    private ShopOrderRefundResponse repairRefunded(String tenantId, String orderPublicId, String reasonCode) {
        log.debug("쇼핑 주문 이미 REFUNDED(멱등): tenantId={}, orderPublicId={}", tenantId, orderPublicId);
        RepairClaim claim = newTx.execute(status -> claimRepair(tenantId, orderPublicId));

        String pgRefundStatus = claim.pgRefundStatus();
        if (claim.payment() != null) {
            PgStep pg = new PgStep();
            try {
                pgRefundStatus = attemptPgCancelForMissingEvidence(tenantId, orderPublicId, claim, pg);
            } catch (RuntimeException ex) {
                releaseLease(tenantId, orderPublicId, !pg.called, claim.priorAttemptAt(), ex);
                throw ex;
            }
        }

        String finalPgStatus = pgRefundStatus;
        try {
            return newTx.execute(status -> finalizeRepair(tenantId, orderPublicId, reasonCode, claim, finalPgStatus));
        } catch (RuntimeException ex) {
            if (claim.payment() != null) {
                releaseLease(tenantId, orderPublicId, false, null, ex);
            }
            throw wrapClinicFailure(orderPublicId, true, ex);
        }
    }

    private RepairClaim claimRepair(String tenantId, String orderPublicId) {
        ShopClientOrder order = shopClientOrderRepository.lockByTenantIdAndPublicId(tenantId, orderPublicId)
                .orElseThrow(() -> new IllegalArgumentException("주문을 찾을 수 없습니다."));
        String pgRefundStatus = resolvePgRefundStatusForIdempotent(tenantId, orderPublicId, order);
        if (!ShopRefundConstants.PG_REFUND_STATUS_NOT_APPLICABLE.equals(pgRefundStatus)
                || order.getCashDueMinor() <= 0L) {
            return new RepairClaim(order, null, pgRefundStatus, null);
        }
        Optional<Payment> paymentOpt = paymentRepository
                .findFirstByTenantIdAndOrderIdAndStatusAndIsDeletedFalseOrderByIdDesc(
                        tenantId, orderPublicId, Payment.PaymentStatus.REFUNDED);
        if (paymentOpt.isEmpty()) {
            paymentOpt = paymentRepository
                    .findFirstByTenantIdAndOrderIdAndStatusAndIsDeletedFalseOrderByIdDesc(
                            tenantId, orderPublicId, Payment.PaymentStatus.APPROVED);
        }
        if (paymentOpt.isEmpty() || !portOneV2PaymentVerifyService.isIamportPayment(paymentOpt.get())) {
            return new RepairClaim(order, null, pgRefundStatus, null);
        }
        LocalDateTime now = LocalDateTime.now();
        requireNoActiveLease(order, orderPublicId, now);
        requireRefundLedgerTaxRate(tenantId, order);
        LocalDateTime priorAttemptAt = order.getRefundPgAttemptedAt();
        order.setRefundPgAttemptedAt(now);
        order.setRefundPgLeaseUntil(now.plus(pgLease));
        shopClientOrderRepository.save(order);
        return new RepairClaim(order, paymentOpt.get(), pgRefundStatus, priorAttemptAt);
    }

    /**
     * Clinic REFUNDED인데 PG 실취소 증거(cancelledAt)가 없는 IAMPORT 결제에 대해 PortOne 취소를 시도한다
     * (트랜잭션 없음). cancelledAt 기록은 {@link #finalizeRepair} 가 한다.
     *
     * @return {@link ShopRefundConstants#PG_REFUND_STATUS_COMPLETED} 또는
     *         {@link ShopRefundConstants#PG_REFUND_STATUS_NOT_APPLICABLE}
     */
    private String attemptPgCancelForMissingEvidence(
            String tenantId, String orderPublicId, RepairClaim claim, PgStep pg) {
        Payment payment = claim.payment();
        // 이미 REFUNDED 주문의 Clinic 수리 경로 — 잔액이 없으면 PG 호출 없이 수리만 진행한다
        RefundableAmount refundable = shopOrderRefundableAmountResolver.resolve(tenantId, claim.order(), payment);
        if (refundable.isExhausted()) {
            if (claim.priorAttemptAt() != null && refundable.pgCancelledAmount() > 0L) {
                requirePortOneCancelEvidence(tenantId, payment.getPaymentId(), true);
                return ShopRefundConstants.PG_REFUND_STATUS_COMPLETED;
            }
            log.warn("REFUNDED 주문 PG 취소 생략 — {}", exhaustedMessage(orderPublicId, refundable));
            return ShopRefundConstants.PG_REFUND_STATUS_NOT_APPLICABLE;
        }

        log.warn("REFUNDED 주문 PG 취소 증거 누락 — PortOne 취소 시도: tenantId={}, orderPublicId={}, paymentId={}",
                tenantId, orderPublicId, payment.getPaymentId());
        String reason = PG_REFUND_REASON_PREFIX + "idempotent retry (missing PG cancel evidence)";
        pg.called = true;
        cancelRemainingViaPortOneWithEvidence(tenantId, payment.getPaymentId(), reason, refundable);
        log.info("REFUNDED 주문 PG 취소 보완 완료: tenantId={}, orderPublicId={}, paymentId={}",
                tenantId, orderPublicId, payment.getPaymentId());
        return ShopRefundConstants.PG_REFUND_STATUS_COMPLETED;
    }

    private ShopOrderRefundResponse finalizeRepair(
            String tenantId, String orderPublicId, String reasonCode, RepairClaim claim, String pgRefundStatus) {
        ShopClientOrder order = shopClientOrderRepository.lockByTenantIdAndPublicId(tenantId, orderPublicId)
                .orElseThrow(() -> new IllegalArgumentException("주문을 찾을 수 없습니다."));
        if (claim.payment() != null && ShopRefundConstants.PG_REFUND_STATUS_COMPLETED.equals(pgRefundStatus)) {
            String paymentId = claim.payment().getPaymentId();
            paymentRepository.findByTenantIdAndPaymentIdAndIsDeletedFalse(tenantId, paymentId)
                    .ifPresent(payment -> {
                        payment.setCancelledAt(LocalDateTime.now());
                        paymentRepository.save(payment);
                    });
        }
        shopOrderFulfillmentService.reversePaidOrderFulfillment(tenantId, order);
        if (claim.payment() != null) {
            order.setRefundPgLeaseUntil(null);
            shopClientOrderRepository.save(order);
        }
        return buildResponse(order, reasonCode, 0L, 0L, pgRefundStatus);
    }

    /**
     * 매칭에 연결된 상담 라인이 있는 주문은 ③에서 환불 전표(EXPENSE)를 기관 VAT 세율로 나눠 기록한다.
     * 세율이 없으면 PG 를 부르기 전에 422 로 끝낸다 (PG 만 취소되고 전표가 없는 상태 방지).
     */
    private void requireRefundLedgerTaxRate(String tenantId, ShopClientOrder order) {
        boolean writesRefundLedger = shopClientOrderLineRepository
                .findByClientOrder_IdAndIsDeletedFalseOrderByLineNoAsc(order.getId()).stream()
                .anyMatch(line -> line.getConsultantClientMappingId() != null);
        if (!writesRefundLedger) {
            return;
        }
        try {
            salaryTaxRateLookupService.getVatRate(tenantId);
        } catch (SalaryTaxRateNotConfiguredException e) {
            log.warn("쇼핑 주문 환불 거부(PG 호출 없음) — 기관 VAT 세율 미설정: orderPublicId={}", order.getPublicId());
            throw RefundLedgerNotRecordedException.of(null, e);
        }
    }

    private void requireNoActiveLease(ShopClientOrder order, String orderPublicId, LocalDateTime now) {
        LocalDateTime leaseUntil = order.getRefundPgLeaseUntil();
        if (leaseUntil != null && leaseUntil.isAfter(now)) {
            log.warn("쇼핑 주문 환불 진행 중 — PG 재호출 안 함: orderPublicId={}", orderPublicId);
            throw ShopRefundInProgressException.inProgress(orderPublicId);
        }
    }

    /**
     * lease 해제 (새 트랜잭션). PG 를 부르기 전에 끝난 경우에만 attempted_at 을 이전 값으로 되돌린다.
     * 해제에 실패해도 lease 는 만료 시각이 지나면 풀리므로 원래 예외를 우선한다.
     */
    private void releaseLease(String tenantId, String orderPublicId, boolean restoreAttempt,
            LocalDateTime priorAttemptAt, RuntimeException original) {
        try {
            newTx.executeWithoutResult(status -> shopClientOrderRepository
                    .lockByTenantIdAndPublicId(tenantId, orderPublicId)
                    .ifPresent(order -> {
                        order.setRefundPgLeaseUntil(null);
                        if (restoreAttempt) {
                            order.setRefundPgAttemptedAt(priorAttemptAt);
                        }
                        shopClientOrderRepository.save(order);
                    }));
        } catch (RuntimeException releaseEx) {
            log.error("쇼핑 주문 환불 lease 해제 실패(만료 시각 뒤 자동 해제): orderPublicId={}", orderPublicId, releaseEx);
            original.addSuppressed(releaseEx);
        }
    }

    private static ShopRefundClinicChainException wrapClinicFailure(
            String orderPublicId, boolean pgCancelCompleted, RuntimeException ex) {
        if (ex instanceof ShopRefundClinicChainException clinicEx) {
            return clinicEx;
        }
        if (ex instanceof DataIntegrityViolationException) {
            return new ShopRefundClinicChainException(orderPublicId, pgCancelCompleted, ex);
        }
        return new ShopRefundClinicChainException(orderPublicId, pgCancelCompleted, ex);
    }

    /**
     * 기환불이 없으면 PortOne 전액 취소, 있으면 잔액만 부분 취소 + 취소 증거 확인.
     */
    private void cancelRemainingViaPortOneWithEvidence(
            String tenantId, String paymentId, String reason, RefundableAmount refundable) {
        String idempotencyKey = String.format(ShopRefundConstants.PORTONE_CANCEL_IDEMPOTENCY_KEY_FMT,
                paymentId, refundable.pgCancelledAmount(), refundable.remainingAmount());
        boolean pgOk = refundable.isFullAmount()
                ? portOneV2PaymentCancelService.cancelPayment(tenantId, paymentId, reason, idempotencyKey)
                : portOneV2PaymentCancelService.cancelPaymentAmount(
                        tenantId, paymentId, reason, BigDecimal.valueOf(refundable.remainingAmount()),
                        idempotencyKey);
        requirePortOneCancelEvidence(tenantId, paymentId, pgOk);
    }

    private void requirePortOneCancelEvidence(String tenantId, String paymentId, boolean pgOk) {
        if (!pgOk) {
            throw new IllegalStateException(
                    "PortOne V2 결제 취소에 실패했습니다. paymentId=" + paymentId);
        }

        boolean hasCancelEvidence = portOneV2PaymentVerifyService.isCancelledOrPartialCancelled(tenantId, paymentId);
        if (!hasCancelEvidence) {
            log.error("PortOne 취소 증거 없음(fail-closed): tenantId={}, paymentId={}", tenantId, paymentId);
            throw new IllegalStateException(
                    String.format(ShopRefundConstants.MSG_PG_CANCEL_NO_EVIDENCE_FMT, paymentId));
        }

        log.info("PortOne 취소 증거 확인 완료: tenantId={}, paymentId={}", tenantId, paymentId);
    }

    /**
     * cancelledAt 최종 검증: Payment 엔티티에 cancelledAt 이 null 이면 COMPLETED 반환 금지.
     */
    private void assertCancelledAtPresent(String tenantId, String paymentId) {
        Payment persisted = paymentRepository
                .findByTenantIdAndPaymentIdAndIsDeletedFalse(tenantId, paymentId)
                .orElse(null);
        if (persisted == null || persisted.getCancelledAt() == null) {
            log.error(
                    "cancelledAt 최종 검증 실패(fail-closed): tenantId={}, paymentId={}, "
                            + "cancelledAt=null — COMPLETED 반환 금지",
                    tenantId,
                    paymentId);
            throw new IllegalStateException(
                    "PG 실취소 증거(cancelledAt) 없이 COMPLETED 전환 불가: paymentId=" + paymentId);
        }
    }

    /**
     * 이미 REFUNDED인 주문의 멱등 응답에서 pgRefundStatus 결정.
     * <p>fail-closed: 내부 Payment가 REFUNDED이고 {@code cancelledAt}이 존재할 때만 COMPLETED.
     * cancelledAt 없으면 PG 실취소 증거 불충분 → NOT_APPLICABLE.</p>
     */
    private String resolvePgRefundStatusForIdempotent(
            String tenantId, String orderPublicId, ShopClientOrder order) {
        if (order.getCashDueMinor() <= 0L) {
            return ShopRefundConstants.PG_REFUND_STATUS_NOT_APPLICABLE;
        }
        Optional<Payment> refunded = paymentRepository
                .findFirstByTenantIdAndOrderIdAndStatusAndIsDeletedFalseOrderByIdDesc(
                        tenantId, orderPublicId, Payment.PaymentStatus.REFUNDED);
        if (refunded.isPresent() && refunded.get().getCancelledAt() != null) {
            return ShopRefundConstants.PG_REFUND_STATUS_COMPLETED;
        }
        return ShopRefundConstants.PG_REFUND_STATUS_NOT_APPLICABLE;
    }

    private static String exhaustedMessage(String orderPublicId, RefundableAmount refundable) {
        return String.format(
                ShopRefundConstants.MSG_REFUND_AMOUNT_EXHAUSTED_FMT,
                orderPublicId,
                refundable.paidAmount(),
                refundable.mappingRefundedAmount(),
                refundable.pgCancelledAmount());
    }

    private static ShopOrderRefundResponse buildResponse(
            ShopClientOrder order,
            String reasonCode,
            long pointsRestored,
            long pointsClawed,
            String pgRefundStatus) {
        return ShopOrderRefundResponse.builder()
                .orderPublicId(order.getPublicId())
                .status(ShopClientOrderStatus.REFUNDED)
                .reasonCode(reasonCode)
                .pointsRestoredMinor(pointsRestored)
                .pointsClawedBackMinor(pointsClawed)
                .pgRefundStatus(pgRefundStatus)
                .build();
    }

    /**
     * ① 선점 결과. order·payment 는 선점 트랜잭션이 끝난 분리 엔티티(기본 컬럼만 읽는다).
     *
     * @param alreadyRefunded 주문이 이미 REFUNDED (수리 경로)
     * @param order           잠근 주문
     * @param payment         환불 대상 승인 결제 (현금 결제액 0 이면 null)
     * @param iamport         PortOne 결제 여부
     * @param priorAttemptAt  이번 선점 전 PG 취소 요청 시각 (없으면 null)
     */
    private record RefundClaim(
            boolean alreadyRefunded, ShopClientOrder order, Payment payment, boolean iamport,
            LocalDateTime priorAttemptAt) {

        static RefundClaim refunded() {
            return new RefundClaim(true, null, null, false, null);
        }
    }

    /**
     * 이미 REFUNDED 주문 수리 선점 결과.
     *
     * @param order           잠근 주문
     * @param payment         PG 보완 대상 PortOne 결제 (보완 불필요하면 null — lease 도 잡지 않음)
     * @param pgRefundStatus  DB 기준 PG 환불 상태
     * @param priorAttemptAt  이번 선점 전 PG 취소 요청 시각
     */
    private record RepairClaim(
            ShopClientOrder order, Payment payment, String pgRefundStatus, LocalDateTime priorAttemptAt) {
    }

    /**
     * ③ 반영 결과.
     *
     * @param order       반영된 주문
     * @param response    응답
     * @param refundedNow 이번 요청이 REFUNDED 로 전환했는지 (알림 발송 여부)
     */
    private record Finalized(ShopClientOrder order, ShopOrderRefundResponse response, boolean refundedNow) {
    }

    /** ② PG 단계 진행 상태 */
    private static final class PgStep {
        private boolean called;
        private String status;
    }
}
