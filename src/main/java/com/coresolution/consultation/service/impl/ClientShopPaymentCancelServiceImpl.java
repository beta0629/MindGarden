package com.coresolution.consultation.service.impl;

import java.time.LocalDateTime;
import java.util.EnumSet;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import com.coresolution.consultation.constant.ShopCheckoutConstants;
import com.coresolution.consultation.constant.ShopClientOrderStatus;
import com.coresolution.consultation.constant.ShopOrderFulfillmentRetryConstants;
import com.coresolution.consultation.constant.ShopUserPaymentCancelConstants;
import com.coresolution.consultation.dto.shop.ShopUserCancelPaymentResponse;
import com.coresolution.consultation.entity.Payment;
import com.coresolution.consultation.entity.ShopClientOrder;
import com.coresolution.consultation.entity.ShopClientOrderLine;
import com.coresolution.consultation.exception.ForbiddenException;
import com.coresolution.consultation.repository.PaymentRepository;
import com.coresolution.consultation.repository.ShopClientOrderLineRepository;
import com.coresolution.consultation.repository.ShopClientOrderRepository;
import com.coresolution.consultation.service.ClientPointWalletService;
import com.coresolution.consultation.service.ClientShopPaymentCancelService;
import com.coresolution.consultation.service.portone.PortOnePaymentPaidState;
import com.coresolution.consultation.service.portone.PortOneV2PaymentVerifyService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 결제창 사용자 취소 정리 구현.
 * <p>주문이 미결제({@code CREATED}/{@code PENDING_PAYMENT})이고 연결 결제 건 모두 PortOne 에서 미승인이
 * 확인될 때만 주문·결제 건을 {@code CANCELLED} 로 닫는다. 결과 알림(만료·실패)은 보내지 않는다.</p>
 * <p>PortOne 이 결제 진행 중(READY 등)이거나 애매하면 닫지 않고 {@code NOT_CANCELLABLE_IN_PROGRESS} 로 응답한다
 * (주문은 PENDING 유지, hold 만료 스케줄러가 정리). PortOne 조회는 DB 트랜잭션 밖에서 하고,
 * 닫기는 주문 행을 잠근 짧은 트랜잭션에서 상태를 다시 확인한 뒤에만 한다.</p>
 *
 * @author MindGarden
 * @since 2026-09-29
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ClientShopPaymentCancelServiceImpl implements ClientShopPaymentCancelService {

    private static final Set<ShopClientOrderStatus> CANCELLABLE_ORDER_STATUSES =
            EnumSet.of(ShopClientOrderStatus.CREATED, ShopClientOrderStatus.PENDING_PAYMENT);

    /** PortOne 에서 승인 여부를 확인해야 하는 결제 건 상태 */
    private static final Set<Payment.PaymentStatus> LOOKUP_PAYMENT_STATUSES = EnumSet.of(
            Payment.PaymentStatus.PENDING,
            Payment.PaymentStatus.PROCESSING,
            Payment.PaymentStatus.FAILED,
            Payment.PaymentStatus.EXPIRED);

    /** 사용자 취소 시 CANCELLED 로 닫는 결제 건 상태 */
    private static final Set<Payment.PaymentStatus> CLOSABLE_PAYMENT_STATUSES =
            EnumSet.of(Payment.PaymentStatus.PENDING, Payment.PaymentStatus.PROCESSING);

    private final ShopClientOrderRepository shopClientOrderRepository;
    private final ShopClientOrderLineRepository shopClientOrderLineRepository;
    private final PaymentRepository paymentRepository;
    private final ClientPointWalletService clientPointWalletService;
    private final PortOneV2PaymentVerifyService portOneV2PaymentVerifyService;
    private final PlatformTransactionManager transactionManager;

    @Override
    public ShopUserCancelPaymentResponse cancelByUser(String tenantId, Long clientUserId, String orderPublicId) {
        ShopClientOrder order = shopClientOrderRepository.findByTenantIdAndPublicId(tenantId, orderPublicId)
                .orElseThrow(() -> new IllegalArgumentException(
                        ShopOrderFulfillmentRetryConstants.MSG_ORDER_NOT_FOUND));
        if (clientUserId == null || !clientUserId.equals(order.getClientId())) {
            throw new ForbiddenException(ShopOrderFulfillmentRetryConstants.MSG_ORDER_ACCESS_DENIED);
        }

        if (order.getStatus() == ShopClientOrderStatus.CANCELLED) {
            return buildResponse(order, ShopUserPaymentCancelConstants.OUTCOME_CANCELLED, null);
        }
        if (!CANCELLABLE_ORDER_STATUSES.contains(order.getStatus())) {
            return buildResponse(order, ShopUserPaymentCancelConstants.OUTCOME_NOT_CANCELLABLE, null);
        }

        List<Payment> linked = paymentRepository.findByTenantIdAndOrderIdAndIsDeletedFalse(tenantId, orderPublicId);
        for (Payment payment : linked) {
            if (payment.getStatus() == Payment.PaymentStatus.APPROVED) {
                return buildResponse(order, ShopUserPaymentCancelConstants.OUTCOME_PAID, payment.getPaymentId());
            }
        }
        Set<Long> verifiedUnpaidPaymentIds = new HashSet<>();
        for (Payment payment : linked) {
            if (!LOOKUP_PAYMENT_STATUSES.contains(payment.getStatus())) {
                continue;
            }
            PortOnePaymentPaidState state = portOneV2PaymentVerifyService.isIamportPayment(payment)
                    ? portOneV2PaymentVerifyService.resolvePaidState(tenantId, payment.getPaymentId())
                    : PortOnePaymentPaidState.UNKNOWN;
            if (state == PortOnePaymentPaidState.PAID) {
                log.info("사용자 취소 요청이지만 PortOne PAID — 변경 없음: tenantId={}, orderPublicId={}",
                        tenantId, orderPublicId);
                return buildResponse(order, ShopUserPaymentCancelConstants.OUTCOME_PAID, payment.getPaymentId());
            }
            if (state == PortOnePaymentPaidState.UNKNOWN) {
                log.warn("사용자 취소 보류 — PortOne 승인 여부 불명: tenantId={}, orderPublicId={}",
                        tenantId, orderPublicId);
                return buildResponse(order, ShopUserPaymentCancelConstants.OUTCOME_UNVERIFIED, null);
            }
            if (state == PortOnePaymentPaidState.IN_PROGRESS) {
                log.info("사용자 취소 보류 — PortOne 결제 진행 중, 주문 PENDING 유지: tenantId={}, orderPublicId={}",
                        tenantId, orderPublicId);
                return buildResponse(
                        order, ShopUserPaymentCancelConstants.OUTCOME_NOT_CANCELLABLE_IN_PROGRESS, null);
            }
            verifiedUnpaidPaymentIds.add(payment.getId());
        }

        return new TransactionTemplate(transactionManager).execute(
                status -> closeIfStillUnpaid(tenantId, orderPublicId, verifiedUnpaidPaymentIds));
    }

    /**
     * 주문 행 잠금 후 재확인 — 조회 이후 승인됐거나 새 결제 시도가 붙었으면 닫지 않는다.
     */
    private ShopUserCancelPaymentResponse closeIfStillUnpaid(
            String tenantId, String orderPublicId, Set<Long> verifiedUnpaidPaymentIds) {
        ShopClientOrder order = shopClientOrderRepository.lockByTenantIdAndPublicId(tenantId, orderPublicId)
                .orElseThrow(() -> new IllegalArgumentException(
                        ShopOrderFulfillmentRetryConstants.MSG_ORDER_NOT_FOUND));
        if (order.getStatus() == ShopClientOrderStatus.CANCELLED) {
            return buildResponse(order, ShopUserPaymentCancelConstants.OUTCOME_CANCELLED, null);
        }
        if (!CANCELLABLE_ORDER_STATUSES.contains(order.getStatus())) {
            return buildResponse(order, ShopUserPaymentCancelConstants.OUTCOME_NOT_CANCELLABLE, null);
        }
        List<Payment> current = paymentRepository.findByTenantIdAndOrderIdAndIsDeletedFalse(tenantId, orderPublicId);
        for (Payment payment : current) {
            if (payment.getStatus() == Payment.PaymentStatus.APPROVED) {
                return buildResponse(order, ShopUserPaymentCancelConstants.OUTCOME_PAID, payment.getPaymentId());
            }
        }
        for (Payment payment : current) {
            if (LOOKUP_PAYMENT_STATUSES.contains(payment.getStatus())
                    && !verifiedUnpaidPaymentIds.contains(payment.getId())) {
                log.info("사용자 취소 보류 — 조회 이후 새 결제 시도, 주문 PENDING 유지: tenantId={}, orderPublicId={}",
                        tenantId, orderPublicId);
                return buildResponse(
                        order, ShopUserPaymentCancelConstants.OUTCOME_NOT_CANCELLABLE_IN_PROGRESS, null);
            }
        }

        closeOrder(tenantId, order, current);
        log.info("사용자 결제 취소로 주문 CANCELLED: tenantId={}, orderPublicId={}", tenantId, orderPublicId);
        return buildResponse(order, ShopUserPaymentCancelConstants.OUTCOME_CANCELLED, null);
    }

    private void closeOrder(String tenantId, ShopClientOrder order, List<Payment> linked) {
        long points = order.getPointsRedeemMinor() == null ? 0L : order.getPointsRedeemMinor();
        if (points > 0L) {
            clientPointWalletService.releaseHold(
                    tenantId,
                    order.getClientId(),
                    order.getPublicId(),
                    points,
                    ShopCheckoutConstants.pointReleaseKey(order.getPublicId()));
        }
        order.setStatus(ShopClientOrderStatus.CANCELLED);
        shopClientOrderRepository.save(order);

        LocalDateTime now = LocalDateTime.now();
        for (Payment payment : linked) {
            if (!CLOSABLE_PAYMENT_STATUSES.contains(payment.getStatus())) {
                continue;
            }
            payment.setStatus(Payment.PaymentStatus.CANCELLED);
            payment.setCancelledAt(now);
            payment.setFailureReason(ShopUserPaymentCancelConstants.PAYMENT_FAILURE_REASON_USER_CANCELLED);
            paymentRepository.save(payment);
        }
    }

    private ShopUserCancelPaymentResponse buildResponse(ShopClientOrder order, String outcome, String paymentId) {
        List<String> skuCodes = order.getId() == null
                ? List.of()
                : shopClientOrderLineRepository.findByClientOrder_IdAndIsDeletedFalseOrderByLineNoAsc(order.getId())
                        .stream()
                        .map(ShopClientOrderLine::getSkuCodeSnapshot)
                        .toList();
        return ShopUserCancelPaymentResponse.builder()
                .orderPublicId(order.getPublicId())
                .outcome(outcome)
                .orderStatus(order.getStatus())
                .paymentId(paymentId)
                .checkoutSource(order.getCheckoutSource())
                .skuCodes(skuCodes)
                .build();
    }
}
