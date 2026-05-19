package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.constant.ShopCheckoutConstants;
import com.coresolution.consultation.constant.ShopClientOrderStatus;
import com.coresolution.consultation.constant.ShopRefundConstants;
import com.coresolution.consultation.dto.shop.EffectivePointTenantPolicies;
import com.coresolution.consultation.dto.shop.admin.ShopOrderRefundResponse;
import com.coresolution.consultation.entity.Payment;
import com.coresolution.consultation.entity.ShopClientOrder;
import com.coresolution.consultation.repository.PaymentRepository;
import com.coresolution.consultation.repository.ShopClientOrderRepository;
import com.coresolution.consultation.service.AdminShopOrderRefundService;
import com.coresolution.consultation.service.ClientPointWalletService;
import com.coresolution.consultation.service.PaymentGatewayService;
import com.coresolution.consultation.service.PaymentService;
import com.coresolution.consultation.service.PointTenantPolicyService;
import com.coresolution.consultation.service.ShopNotificationHelper;
import java.math.BigDecimal;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.extern.slf4j.Slf4j;

/**
 * 어드민 PAID 주문 전액 환불 — 포인트 원장·PG 전액 환불·주문 REFUNDED(MVP).
 *
 * <p><b>트랜잭션·PG 실패 정책(MVP)</b>: 포인트 원장 처리 후 PG 환불을 호출한다. PG 환불 실패 시
 * {@link IllegalStateException}을 던져 <em>전체</em> {@code @Transactional}을 롤백한다(포인트 복원·clawback·주문
 * REFUNDED 미반영). 운영 대안으로 주문만 {@code REFUNDED}·{@code pgRefundStatus=PG_PENDING} 후 비동기 재시도는
 * 미구현 — 수동 정산·웹훅 정합이 필요할 때 별도 배치로 도입한다.
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

    public AdminShopOrderRefundServiceImpl(
            ShopClientOrderRepository shopClientOrderRepository,
            ClientPointWalletService clientPointWalletService,
            PointTenantPolicyService pointTenantPolicyService,
            PaymentRepository paymentRepository,
            PaymentService paymentService,
            ShopNotificationHelper shopNotificationHelper,
            @Autowired(required = false) PaymentGatewayService paymentGatewayService) {
        this.shopClientOrderRepository = shopClientOrderRepository;
        this.clientPointWalletService = clientPointWalletService;
        this.pointTenantPolicyService = pointTenantPolicyService;
        this.paymentRepository = paymentRepository;
        this.paymentService = paymentService;
        this.shopNotificationHelper = shopNotificationHelper;
        this.paymentGatewayService = paymentGatewayService;
    }

    @Override
    @Transactional
    public ShopOrderRefundResponse refundPaidOrder(String tenantId, String orderPublicId, String reasonCode) {
        ShopClientOrder order = shopClientOrderRepository.findByTenantIdAndPublicId(tenantId, orderPublicId)
                .orElseThrow(() -> new IllegalArgumentException("주문을 찾을 수 없습니다."));

        if (order.getStatus() == ShopClientOrderStatus.REFUNDED) {
            log.debug("쇼핑 주문 이미 REFUNDED(멱등): tenantId={}, orderPublicId={}", tenantId, orderPublicId);
            return buildResponse(
                    order, reasonCode, 0L, 0L, resolvePgRefundStatusForIdempotent(tenantId, orderPublicId, order));
        }
        if (order.getStatus() != ShopClientOrderStatus.PAID) {
            throw new IllegalArgumentException("PAID 상태의 주문만 전액 환불할 수 있습니다.");
        }

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

        String pgRefundStatus = executePgFullRefund(tenantId, orderPublicId, order.getCashDueMinor(), reasonCode);

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
    }

    /**
     * 승인 결제({@code payments.order_id} = 주문 {@code public_id})에 대해 PG 취소·내부 결제 REFUNDED 반영.
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

        if (paymentGatewayService != null) {
            boolean pgOk = paymentGatewayService.refundPayment(payment.getPaymentId(), refundAmount, pgReason);
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
