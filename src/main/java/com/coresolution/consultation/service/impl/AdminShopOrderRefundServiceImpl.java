package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.constant.ShopCheckoutConstants;
import com.coresolution.consultation.constant.ShopClientOrderStatus;
import com.coresolution.consultation.constant.ShopRefundConstants;
import com.coresolution.consultation.dto.shop.EffectivePointTenantPolicies;
import com.coresolution.consultation.dto.shop.admin.ShopOrderRefundResponse;
import com.coresolution.consultation.entity.Payment;
import com.coresolution.consultation.entity.ShopClientOrder;
import com.coresolution.consultation.exception.ShopRefundClinicChainException;
import com.coresolution.consultation.repository.PaymentRepository;
import com.coresolution.consultation.repository.ShopClientOrderRepository;
import com.coresolution.consultation.service.AdminShopOrderRefundService;
import com.coresolution.consultation.service.ClientPointWalletService;
import com.coresolution.consultation.service.PaymentGatewayService;
import com.coresolution.consultation.service.PaymentService;
import com.coresolution.consultation.service.PointTenantPolicyService;
import com.coresolution.consultation.service.ShopNotificationHelper;
import com.coresolution.consultation.service.ShopOrderFulfillmentService;
import com.coresolution.consultation.service.portone.PortOneV2PaymentCancelService;
import com.coresolution.consultation.service.portone.PortOneV2PaymentVerifyService;
import java.math.BigDecimal;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.extern.slf4j.Slf4j;

/**
 * 어드민 PAID 주문 전액 환불 — PortOne 취소 → 회기 원복·ERP EXPENSE·주문 REFUNDED → 포인트 원장.
 *
 * <p><b>트랜잭션·PG 실패 정책 (Path B SSOT)</b>:
 * <ol>
 *   <li>PortOne/PG 취소 먼저 (이미 취소됨 = 성공)</li>
 *   <li>결제 REFUNDED 반영 (쇼핑 매핑 입금 INCOME 은 CANCEL 하지 않음)</li>
 *   <li>주문 REFUNDED + 회기 원복 + EXPENSE 를 동일 fail-closed 단위로 수행</li>
 *   <li>포인트 복원/clawback 은 PG 성공 이후</li>
 * </ol>
 * PG 실패 시 회기·EXPENSE·주문 REFUNDED 를 호출하지 않는다.
 * PG 성공 후 Clinic 체인 실패 시 {@link ShopRefundClinicChainException} 으로
 * 부분 성공을 숨기지 않고 재시도·reconcile-refund 가능하게 한다(이메일 오매핑 금지).
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
            @Autowired(required = false) PaymentGatewayService paymentGatewayService) {
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
    }

    @Override
    @Transactional
    public ShopOrderRefundResponse refundPaidOrder(String tenantId, String orderPublicId, String reasonCode) {
        ShopClientOrder order = shopClientOrderRepository.findByTenantIdAndPublicId(tenantId, orderPublicId)
                .orElseThrow(() -> new IllegalArgumentException("주문을 찾을 수 없습니다."));

        if (order.getStatus() == ShopClientOrderStatus.REFUNDED) {
            // 멱등 + 과거 행 수리: fulfillment REVERSED·mapping.paymentStatus=REFUNDED 보강
            log.debug("쇼핑 주문 이미 REFUNDED(멱등·수리): tenantId={}, orderPublicId={}", tenantId, orderPublicId);
            try {
                shopOrderFulfillmentService.reversePaidOrderFulfillment(tenantId, order);
            } catch (RuntimeException ex) {
                throw wrapClinicFailure(orderPublicId, true, ex);
            }
            return buildResponse(
                    order, reasonCode, 0L, 0L, resolvePgRefundStatusForIdempotent(tenantId, orderPublicId, order));
        }
        if (order.getStatus() != ShopClientOrderStatus.PAID) {
            throw new IllegalArgumentException("PAID 상태의 주문만 전액 환불할 수 있습니다.");
        }

        // 1) PortOne/PG 먼저 — 실패 시 회기·EXPENSE·주문 상태 변경 없음
        String pgRefundStatus = executePgFullRefund(tenantId, orderPublicId, order.getCashDueMinor(), reasonCode);
        boolean pgCancelCompleted =
                ShopRefundConstants.PG_REFUND_STATUS_COMPLETED.equals(pgRefundStatus)
                        || ShopRefundConstants.PG_REFUND_STATUS_NOT_APPLICABLE.equals(pgRefundStatus);

        try {
            // 2) Clinic chain: 회기 원복 + ERP EXPENSE (fail-closed) + 주문 REFUNDED
            shopOrderFulfillmentService.reversePaidOrderFulfillment(tenantId, order);

            // 3) 포인트 원장 — PG 성공 이후 동일 단위
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
            shopClientOrderRepository.save(order);
            log.info(
                    "쇼핑 주문 전액 환불: tenantId={}, orderPublicId={}, reasonCode={}, restored={}, clawed={}, pg={}",
                    tenantId,
                    orderPublicId,
                    reasonCode,
                    pointsRestored,
                    pointsClawed,
                    pgRefundStatus);

            try {
                shopNotificationHelper.notifyOrderRefunded(tenantId, order);
            } catch (Exception ex) {
                log.warn("쇼핑 주문 환불 알림 실패: orderPublicId={}", orderPublicId, ex);
            }

            return buildResponse(order, reasonCode, pointsRestored, pointsClawed, pgRefundStatus);
        } catch (ShopRefundClinicChainException ex) {
            throw ex;
        } catch (RuntimeException ex) {
            // PG 는 이미 취소됐을 수 있음 — TX 롤백으로 주문은 PAID 유지, 재시도·reconcile 가능
            throw wrapClinicFailure(orderPublicId, pgCancelCompleted, ex);
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
     * 승인 결제에 대해 PortOne V2 전액 cancel(또는 기타 PG refund)·내부 결제 REFUNDED 반영.
     *
     * <p>쇼핑 주문은 {@link PaymentService#refundPayment} 가 매핑 입금 INCOME 을 CANCEL 하지 않는다.
     * 회기·EXPENSE 소유권은 호출자({@link #refundPaidOrder}) clinic chain 에 둔다(멱등 재호출 OK).</p>
     *
     * @return {@link ShopRefundConstants#PG_REFUND_STATUS_NOT_APPLICABLE} 또는 {@link ShopRefundConstants#PG_REFUND_STATUS_COMPLETED}
     */
    private String executePgFullRefund(
            String tenantId, String orderPublicId, long cashDueMinor, String reasonCode) {
        if (cashDueMinor <= 0L) {
            return ShopRefundConstants.PG_REFUND_STATUS_NOT_APPLICABLE;
        }

        Payment payment = paymentRepository
                .findFirstByTenantIdAndOrderIdAndStatusAndIsDeletedFalseOrderByIdDesc(
                        tenantId, orderPublicId, Payment.PaymentStatus.APPROVED)
                .orElseThrow(() -> new IllegalStateException(
                        "승인된 결제를 찾을 수 없습니다. orderPublicId=" + orderPublicId));

        BigDecimal refundAmount = payment.getAmount();
        String pgReason = PG_REFUND_REASON_PREFIX + reasonCode;

        if (portOneV2PaymentVerifyService.isIamportPayment(payment)) {
            boolean pgOk = portOneV2PaymentCancelService.cancelPayment(
                    tenantId, payment.getPaymentId(), pgReason);
            if (!pgOk) {
                throw new IllegalStateException(
                        "PortOne V2 결제 취소에 실패했습니다. paymentId=" + payment.getPaymentId());
            }
        } else if (paymentGatewayService != null) {
            boolean pgOk = paymentGatewayService.refundPayment(
                    payment.getPaymentId(), refundAmount, pgReason);
            if (!pgOk) {
                throw new IllegalStateException(
                        "PG 환불에 실패했습니다. paymentId=" + payment.getPaymentId());
            }
        } else {
            log.warn(
                    "PaymentGatewayService 미주입 — PG API 생략, 내부 결제만 환불: tenantId={}, paymentId={}",
                    tenantId,
                    payment.getPaymentId());
        }

        paymentService.refundPayment(payment.getPaymentId(), refundAmount, pgReason);
        return ShopRefundConstants.PG_REFUND_STATUS_COMPLETED;
    }

    private String resolvePgRefundStatusForIdempotent(
            String tenantId, String orderPublicId, ShopClientOrder order) {
        if (order.getCashDueMinor() <= 0L) {
            return ShopRefundConstants.PG_REFUND_STATUS_NOT_APPLICABLE;
        }
        Optional<Payment> refunded = paymentRepository
                .findFirstByTenantIdAndOrderIdAndStatusAndIsDeletedFalseOrderByIdDesc(
                        tenantId, orderPublicId, Payment.PaymentStatus.REFUNDED);
        if (refunded.isPresent()) {
            return ShopRefundConstants.PG_REFUND_STATUS_COMPLETED;
        }
        Optional<Payment> approved = paymentRepository
                .findFirstByTenantIdAndOrderIdAndStatusAndIsDeletedFalseOrderByIdDesc(
                        tenantId, orderPublicId, Payment.PaymentStatus.APPROVED);
        if (approved.isPresent()) {
            return ShopRefundConstants.PG_REFUND_STATUS_COMPLETED;
        }
        return ShopRefundConstants.PG_REFUND_STATUS_NOT_APPLICABLE;
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
}
