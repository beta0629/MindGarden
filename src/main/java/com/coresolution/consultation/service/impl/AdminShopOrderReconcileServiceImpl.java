package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.constant.ShopClientOrderStatus;
import com.coresolution.consultation.constant.ShopLatePaymentConstants;
import com.coresolution.consultation.constant.ShopOrderReconcileConstants;
import com.coresolution.consultation.dto.shop.admin.ShopOrderReconcilePaymentResponse;
import com.coresolution.consultation.entity.Payment;
import com.coresolution.consultation.entity.ShopClientOrder;
import com.coresolution.consultation.exception.ShopDuplicatePaymentException;
import com.coresolution.consultation.exception.ShopOrderClosedForPaymentException;
import com.coresolution.consultation.repository.PaymentRepository;
import com.coresolution.consultation.repository.ShopClientOrderRepository;
import com.coresolution.consultation.service.AdminShopOrderReconcileService;
import com.coresolution.consultation.service.ClientShopCheckoutService;
import com.coresolution.consultation.service.PaymentService;
import com.coresolution.consultation.service.ShopLatePaymentOutcome;
import com.coresolution.consultation.service.ShopLatePaymentRefundService;
import com.coresolution.consultation.service.ShopOrderPaymentState;
import com.coresolution.consultation.service.portone.PortOneV2PaymentLookupService;
import com.coresolution.consultation.service.portone.PortOneV2PaymentVerifyService;
import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * 어드민 쇼핑 주문 PortOne 결제 정합 — V2 검증 후 웹훅/verify 와 동일 SSOT 로 PAID 반영.
 * <p>
 * {@code CANCELLED}/{@code EXPIRED} 주문은 되살리지 않는다. PortOne 이 PAID 인 늦은 결제(또는 {@code REFUND_REQUIRED})면
 * {@link ShopLatePaymentRefundService} 로 PG 자동 환불만 (재)시도한다.
 * paymentId 또는 카드 승인번호로 PortOne 결제를 해석한다.
 * </p>
 * <p>
 * PortOne 취소·Clinic APPROVED 불일치(예: {@link com.coresolution.consultation.constant.ShopAdminOrderConstants#OPS_HEAL_RECONCILE_REFUND_EXAMPLE_ORDER_PUBLIC_ID})
 * 는 {@link #reconcileRefund} 로 PG cancel 없이 clinic 체인을 맞춘다.
 * </p>
 *
 * @author MindGarden
 * @since 2026-09-17
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AdminShopOrderReconcileServiceImpl implements AdminShopOrderReconcileService {

    private final ShopClientOrderRepository shopClientOrderRepository;
    private final PaymentRepository paymentRepository;
    private final PortOneV2PaymentVerifyService portOneV2PaymentVerifyService;
    private final PortOneV2PaymentLookupService portOneV2PaymentLookupService;
    private final PaymentService paymentService;
    private final ClientShopCheckoutService clientShopCheckoutService;
    private final ShopLatePaymentRefundService shopLatePaymentRefundService;

    @Override
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public ShopOrderReconcilePaymentResponse reconcilePayment(
            String tenantId, String orderPublicId, String paymentId, String cardApprovalNumber) {
        requireNonBlank(tenantId, ShopOrderReconcileConstants.MSG_TENANT_REQUIRED);
        requireNonBlank(orderPublicId, ShopOrderReconcileConstants.MSG_ORDER_PUBLIC_ID_REQUIRED);

        boolean hasPaymentId = paymentId != null && !paymentId.isBlank();
        boolean hasApproval = cardApprovalNumber != null && !cardApprovalNumber.isBlank();
        if (!hasPaymentId && !hasApproval) {
            throw new IllegalArgumentException(ShopOrderReconcileConstants.MSG_PAYMENT_ID_OR_APPROVAL_REQUIRED);
        }

        ShopClientOrder order = shopClientOrderRepository
                .findByTenantIdAndPublicId(tenantId, orderPublicId)
                .orElseThrow(() -> new IllegalArgumentException(ShopOrderReconcileConstants.MSG_ORDER_NOT_FOUND));

        String trimmedPaymentId = hasPaymentId ? paymentId.trim() : null;

        if (order.getStatus() == ShopClientOrderStatus.PAID) {
            if (trimmedPaymentId == null) {
                trimmedPaymentId = resolvePaymentIdFromApproval(
                        tenantId, order, cardApprovalNumber.trim(), orderPublicId);
            }
            return buildIdempotentPaidResponse(tenantId, order, trimmedPaymentId);
        }
        if (ShopLatePaymentConstants.isClosedOrder(order.getStatus())) {
            return reconcileLatePaymentOnClosedOrder(
                    tenantId, order, order.getStatus(), trimmedPaymentId, cardApprovalNumber);
        }
        if (order.getStatus() == ShopClientOrderStatus.REFUNDED) {
            throw new IllegalArgumentException(ShopOrderReconcileConstants.MSG_ORDER_REFUNDED);
        }
        if (order.getStatus() != ShopClientOrderStatus.CREATED
                && order.getStatus() != ShopClientOrderStatus.PENDING_PAYMENT) {
            throw new IllegalArgumentException(ShopOrderReconcileConstants.MSG_ORDER_STATUS_NOT_ALLOWED);
        }

        long cashDueMinor = order.getCashDueMinor();
        if (cashDueMinor <= 0L) {
            throw new IllegalArgumentException(ShopOrderReconcileConstants.MSG_CASH_DUE_REQUIRED);
        }

        if (trimmedPaymentId == null) {
            trimmedPaymentId = resolvePaymentIdFromApproval(
                    tenantId, order, cardApprovalNumber.trim(), orderPublicId);
        }

        BigDecimal expectedAmount = BigDecimal.valueOf(cashDueMinor);

        Optional<String> verifiedBody = portOneV2PaymentVerifyService.verifyPaidAmountBody(
                tenantId, trimmedPaymentId, expectedAmount);
        if (verifiedBody.isEmpty()) {
            throw new IllegalStateException(ShopOrderReconcileConstants.MSG_PORTONE_VERIFY_FAILED);
        }

        Payment payment = ensurePaymentRow(tenantId, order, trimmedPaymentId);
        payment.setExternalResponse(verifiedBody.get());
        paymentRepository.save(payment);

        // PortOne 조회는 위에서 트랜잭션 밖에서 끝냄 — 승인은 주문 잠금·재확인을 하는 짧은 트랜잭션(approveShopOrderPayment)
        try {
            if (payment.getStatus() != Payment.PaymentStatus.APPROVED) {
                paymentService.approveShopOrderPayment(trimmedPaymentId);
            }
            // 멱등: approveShopOrderPayment 동기화와 별도로 SSOT 재호출 (이미 PAID 면 no-op)
            clientShopCheckoutService.completeOrderOnPaymentApproved(tenantId, orderPublicId);
        } catch (ShopDuplicatePaymentException duplicate) {
            // 검증 뒤 다른 결제로 주문이 먼저 PAID → 이 결제는 이중 결제로 PG 자동 취소
            return reconcileDuplicatePayment(tenantId, orderPublicId, trimmedPaymentId, payment);
        } catch (ShopOrderClosedForPaymentException | OptimisticLockingFailureException raced) {
            ShopClientOrder current = shopClientOrderRepository
                    .findByTenantIdAndPublicId(tenantId, orderPublicId)
                    .orElseThrow(() -> raced);
            // 이 메서드의 영속성 컨텍스트에는 승인 전 주문이 남아 있으므로 닫힘 여부는 커밋된 최신 상태로 판정
            ShopClientOrderStatus currentStatus = latestState(tenantId, orderPublicId, null)
                    .map(ShopOrderPaymentState::orderStatus)
                    .orElse(current.getStatus());
            if (!ShopLatePaymentConstants.isClosedOrder(currentStatus)) {
                throw raced;
            }
            // 검증 뒤 주문이 닫힘 → 되살리지 않고 늦은 결제 자동 환불
            return reconcileLatePaymentOnClosedOrder(
                    tenantId, current, currentStatus, trimmedPaymentId, cardApprovalNumber);
        }

        Optional<ShopOrderPaymentState> latest = latestState(tenantId, orderPublicId, trimmedPaymentId);
        ShopClientOrderStatus orderStatus;
        Payment.PaymentStatus paymentStatus;
        if (latest.isPresent()) {
            orderStatus = latest.get().orderStatus();
            paymentStatus = latest.get().paymentStatus();
        } else {
            orderStatus = shopClientOrderRepository.findByTenantIdAndPublicId(tenantId, orderPublicId)
                    .orElse(order)
                    .getStatus();
            paymentStatus = paymentRepository.findByTenantIdAndPaymentIdAndIsDeletedFalse(tenantId, trimmedPaymentId)
                    .orElse(payment)
                    .getStatus();
        }

        log.info(
                "쇼핑 주문 결제 정합 완료: tenantId={}, orderPublicId={}, paymentId={}, orderStatus={}",
                tenantId,
                orderPublicId,
                trimmedPaymentId,
                orderStatus);

        return ShopOrderReconcilePaymentResponse.builder()
                .orderPublicId(orderPublicId)
                .paymentId(trimmedPaymentId)
                .orderStatus(orderStatus)
                .paymentStatus(paymentStatus)
                .recovered(false)
                .build();
    }

    /**
     * 커밋된 최신 주문·결제 상태 (새 읽기 트랜잭션). 이 서비스는 NOT_SUPPORTED 로 도는 동안 영속성 컨텍스트가
     * 유지돼 리포지토리 재조회가 옛 엔티티를 돌려줄 수 있으므로 응답·판정은 이 값을 우선한다.
     */
    private Optional<ShopOrderPaymentState> latestState(String tenantId, String orderPublicId, String paymentId) {
        Optional<ShopOrderPaymentState> latest =
                paymentService.findShopOrderPaymentState(tenantId, orderPublicId, paymentId);
        return latest != null ? latest : Optional.empty();
    }

    /**
     * PAID 주문의 이중 결제 — PortOne PAID 를 확인한 경우에만 PG 자동 취소(REFUNDED / 실패 시 REFUND_REQUIRED).
     * 주문은 PAID 그대로 두고, 다른(정상) 결제는 건드리지 않는다.
     */
    private ShopOrderReconcilePaymentResponse reconcileDuplicatePayment(
            String tenantId, String orderPublicId, String paymentId, Payment fallbackPayment) {
        ShopLatePaymentOutcome outcome = shopLatePaymentRefundService.refundIfOrderClosed(tenantId, paymentId);
        if (outcome == null || outcome == ShopLatePaymentOutcome.NOT_APPLICABLE) {
            throw new IllegalStateException(ShopOrderReconcileConstants.MSG_ORDER_STATUS_NOT_ALLOWED);
        }
        log.warn("쇼핑 주문 이중 결제 자동 환불: tenantId={}, orderPublicId={}, paymentId={}, outcome={}",
                tenantId, orderPublicId, paymentId, outcome);
        Optional<ShopOrderPaymentState> latest = latestState(tenantId, orderPublicId, paymentId);
        return ShopOrderReconcilePaymentResponse.builder()
                .orderPublicId(orderPublicId)
                .paymentId(paymentId)
                .orderStatus(latest.map(ShopOrderPaymentState::orderStatus).orElse(ShopClientOrderStatus.PAID))
                .paymentStatus(latest.map(ShopOrderPaymentState::paymentStatus)
                        .orElseGet(() -> outcomeToPaymentStatus(outcome, fallbackPayment)))
                .recovered(false)
                .build();
    }

    private static Payment.PaymentStatus outcomeToPaymentStatus(ShopLatePaymentOutcome outcome, Payment fallback) {
        if (outcome == ShopLatePaymentOutcome.REFUNDED || outcome == ShopLatePaymentOutcome.ALREADY_REFUNDED) {
            return Payment.PaymentStatus.REFUNDED;
        }
        if (outcome == ShopLatePaymentOutcome.REFUND_REQUIRED
                || outcome == ShopLatePaymentOutcome.REFUND_IN_PROGRESS) {
            return Payment.PaymentStatus.REFUND_REQUIRED;
        }
        return fallback != null ? fallback.getStatus() : null;
    }

    /**
     * 취소·만료된 주문 — 주문은 되살리지 않는다. PortOne PAID(또는 이미 REFUND_REQUIRED)인 늦은 결제만
     * PG 자동 환불을 (재)시도한다. 이 트랜잭션에서는 주문·결제 행을 수정하지 않는다(가드가 별도 트랜잭션으로 반영).
     */
    private ShopOrderReconcilePaymentResponse reconcileLatePaymentOnClosedOrder(
            String tenantId, ShopClientOrder order, ShopClientOrderStatus closedStatus, String paymentId,
            String cardApprovalNumber) {
        String orderPublicId = order.getPublicId();
        String closedOrderMessage = closedStatus == ShopClientOrderStatus.CANCELLED
                ? ShopOrderReconcileConstants.MSG_ORDER_CANCELLED
                : ShopLatePaymentConstants.MSG_RECONCILE_LATE_PAYMENT_NOT_FOUND;
        String targetPaymentId = paymentId != null
                ? paymentId
                : resolvePaymentIdFromApproval(tenantId, order, cardApprovalNumber.trim(), orderPublicId);

        Payment payment = paymentRepository.findByTenantIdAndPaymentIdAndIsDeletedFalse(tenantId, targetPaymentId)
                .orElseThrow(() -> new IllegalArgumentException(closedOrderMessage));
        if (!orderPublicId.equals(payment.getOrderId())) {
            throw new IllegalArgumentException(ShopOrderReconcileConstants.MSG_PAYMENT_ORDER_MISMATCH);
        }
        if (payment.getProvider() != Payment.PaymentProvider.IAMPORT) {
            throw new IllegalArgumentException(ShopOrderReconcileConstants.MSG_PAYMENT_PROVIDER_NOT_IAMPORT);
        }
        if (payment.getStatus() != Payment.PaymentStatus.REFUND_REQUIRED
                && payment.getStatus() != Payment.PaymentStatus.REFUNDED) {
            Optional<String> paid = portOneV2PaymentVerifyService.verifyPaidAmountBody(
                    tenantId, targetPaymentId, BigDecimal.valueOf(order.getCashDueMinor()));
            if (paid.isEmpty()) {
                throw new IllegalArgumentException(closedOrderMessage);
            }
        }

        ShopLatePaymentOutcome outcome = shopLatePaymentRefundService.refundIfOrderClosed(tenantId, targetPaymentId);
        if (outcome == null || outcome == ShopLatePaymentOutcome.NOT_APPLICABLE) {
            throw new IllegalStateException(ShopOrderReconcileConstants.MSG_ORDER_STATUS_NOT_ALLOWED);
        }
        // 가드가 별도 트랜잭션에서 확정한 값을 다시 읽어 응답 (최신 상태)
        Optional<ShopOrderPaymentState> latest = latestState(tenantId, orderPublicId, targetPaymentId);
        ShopClientOrderStatus orderStatus = latest.map(ShopOrderPaymentState::orderStatus).orElse(closedStatus);
        Payment.PaymentStatus paymentStatus = latest.map(ShopOrderPaymentState::paymentStatus)
                .orElseGet(() -> outcomeToPaymentStatus(outcome, payment));
        log.info(
                "쇼핑 주문 늦은 결제 자동 환불 재처리: tenantId={}, orderPublicId={}, paymentId={}, orderStatus={}, outcome={}",
                tenantId,
                orderPublicId,
                targetPaymentId,
                orderStatus,
                outcome);
        return ShopOrderReconcilePaymentResponse.builder()
                .orderPublicId(orderPublicId)
                .paymentId(targetPaymentId)
                .orderStatus(orderStatus)
                .paymentStatus(paymentStatus)
                .recovered(false)
                .build();
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public ShopOrderReconcilePaymentResponse reconcileRefund(
            String tenantId, String orderPublicId, boolean force) {
        requireNonBlank(tenantId, ShopOrderReconcileConstants.MSG_TENANT_REQUIRED);
        requireNonBlank(orderPublicId, ShopOrderReconcileConstants.MSG_ORDER_PUBLIC_ID_REQUIRED);

        ShopClientOrder order = shopClientOrderRepository
                .findByTenantIdAndPublicId(tenantId, orderPublicId)
                .orElseThrow(() -> new IllegalArgumentException(ShopOrderReconcileConstants.MSG_ORDER_NOT_FOUND));

        if (order.getStatus() != ShopClientOrderStatus.PAID
                && order.getStatus() != ShopClientOrderStatus.REFUNDED) {
            throw new IllegalArgumentException(
                    ShopOrderReconcileConstants.MSG_RECONCILE_REFUND_ORDER_STATUS_NOT_ALLOWED);
        }

        Payment payment = resolveRefundTargetPayment(tenantId, orderPublicId)
                .orElseThrow(() -> new IllegalStateException(
                        ShopOrderReconcileConstants.MSG_RECONCILE_REFUND_PAYMENT_NOT_FOUND));

        String paymentId = payment.getPaymentId();
        boolean wasApprovedDesync = payment.getStatus() == Payment.PaymentStatus.APPROVED
                || order.getStatus() == ShopClientOrderStatus.PAID;

        // 이미 Clinic REFUNDED + Payment REFUNDED/CANCELLED → 멱등 수리만
        if (order.getStatus() == ShopClientOrderStatus.REFUNDED
                && (payment.getStatus() == Payment.PaymentStatus.REFUNDED
                        || payment.getStatus() == Payment.PaymentStatus.CANCELLED)) {
            clientShopCheckoutService.reconcileOrderOnPaymentCancelOrRefund(tenantId, orderPublicId);
            return buildReconcileRefundResponse(tenantId, orderPublicId, paymentId, false);
        }

        if (!force && !portOneV2PaymentVerifyService.isCancelledOrPartialCancelled(tenantId, paymentId)) {
            throw new IllegalStateException(ShopOrderReconcileConstants.MSG_PORTONE_NOT_CANCELLED);
        }

        String refundReason = force
                ? ShopOrderReconcileConstants.RECONCILE_REFUND_FORCE_REASON
                : ShopOrderReconcileConstants.RECONCILE_REFUND_REASON;
        if (force) {
            log.warn(
                    ShopOrderReconcileConstants.AUDIT_FORCE_RECONCILE_REFUND_FMT,
                    tenantId,
                    orderPublicId,
                    paymentId,
                    ShopOrderReconcileConstants.RECONCILE_REFUND_FORCE_REASON);
        }

        // PortOne 이미 취소(또는 force attest) — PG cancel 생략, Clinic Payment→order REFUNDED→reverse
        if (payment.getStatus() == Payment.PaymentStatus.APPROVED) {
            paymentService.refundPayment(paymentId, payment.getAmount(), refundReason);
        } else if (payment.getStatus() == Payment.PaymentStatus.CANCELLED
                || payment.getStatus() == Payment.PaymentStatus.REFUNDED) {
            clientShopCheckoutService.reconcileOrderOnPaymentCancelOrRefund(tenantId, orderPublicId);
        } else {
            paymentService.updatePaymentStatus(paymentId, Payment.PaymentStatus.REFUNDED);
        }

        ShopOrderReconcilePaymentResponse response =
                buildReconcileRefundResponse(tenantId, orderPublicId, paymentId, wasApprovedDesync);
        log.info(
                "쇼핑 주문 환불 정합 완료: tenantId={}, orderPublicId={}, paymentId={}, force={}, "
                        + "orderStatus={}, paymentStatus={}, recovered={}",
                tenantId,
                orderPublicId,
                paymentId,
                force,
                response.getOrderStatus(),
                response.getPaymentStatus(),
                response.isRecovered());
        return response;
    }

    /**
     * 환불 정합 대상 결제 — APPROVED 우선, 없으면 REFUNDED/CANCELLED.
     */
    private Optional<Payment> resolveRefundTargetPayment(String tenantId, String orderPublicId) {
        Optional<Payment> approved = paymentRepository
                .findFirstByTenantIdAndOrderIdAndStatusAndIsDeletedFalseOrderByIdDesc(
                        tenantId, orderPublicId, Payment.PaymentStatus.APPROVED);
        if (approved.isPresent()) {
            return approved;
        }
        Optional<Payment> refunded = paymentRepository
                .findFirstByTenantIdAndOrderIdAndStatusAndIsDeletedFalseOrderByIdDesc(
                        tenantId, orderPublicId, Payment.PaymentStatus.REFUNDED);
        if (refunded.isPresent()) {
            return refunded;
        }
        return paymentRepository.findFirstByTenantIdAndOrderIdAndStatusAndIsDeletedFalseOrderByIdDesc(
                tenantId, orderPublicId, Payment.PaymentStatus.CANCELLED);
    }

    private ShopOrderReconcilePaymentResponse buildReconcileRefundResponse(
            String tenantId, String orderPublicId, String paymentId, boolean recovered) {
        Optional<ShopOrderPaymentState> latest = latestState(tenantId, orderPublicId, paymentId);
        ShopClientOrderStatus orderStatus;
        Payment.PaymentStatus paymentStatus;
        if (latest.isPresent()) {
            orderStatus = latest.get().orderStatus();
            paymentStatus = latest.get().paymentStatus();
        } else {
            ShopClientOrder refreshed = shopClientOrderRepository
                    .findByTenantIdAndPublicId(tenantId, orderPublicId)
                    .orElseThrow(() -> new IllegalArgumentException(ShopOrderReconcileConstants.MSG_ORDER_NOT_FOUND));
            orderStatus = refreshed.getStatus();
            paymentStatus = paymentRepository
                    .findByTenantIdAndPaymentIdAndIsDeletedFalse(tenantId, paymentId)
                    .map(Payment::getStatus)
                    .orElse(null);
        }
        return ShopOrderReconcilePaymentResponse.builder()
                .orderPublicId(orderPublicId)
                .paymentId(paymentId)
                .orderStatus(orderStatus)
                .paymentStatus(paymentStatus)
                .recovered(recovered && orderStatus == ShopClientOrderStatus.REFUNDED)
                .build();
    }

    /**
     * 카드 승인번호로 PortOne paymentId 를 해석한다.
     *
     * @param tenantId           테넌트 ID
     * @param order              주문
     * @param cardApprovalNumber 카드 승인번호 (trim 된 값)
     * @param orderPublicId      주문 공개 ID
     * @return PortOne paymentId
     * @throws IllegalStateException 조회 실패·모호 매칭
     */
    private String resolvePaymentIdFromApproval(
            String tenantId, ShopClientOrder order, String cardApprovalNumber, String orderPublicId) {
        BigDecimal expectedAmount = BigDecimal.valueOf(order.getCashDueMinor());
        Optional<String> lookedUp = portOneV2PaymentLookupService.findPaidPaymentIdByCardApprovalNumber(
                tenantId, cardApprovalNumber, expectedAmount, orderPublicId);
        if (lookedUp.isEmpty()) {
            throw new IllegalStateException(ShopOrderReconcileConstants.MSG_APPROVAL_LOOKUP_FAILED);
        }
        return lookedUp.get();
    }

    /**
     * 이미 PAID 인 주문 — 멱등 성공. 연결 결제가 있으면 APPROVED 보장 시도.
     */
    private ShopOrderReconcilePaymentResponse buildIdempotentPaidResponse(
            String tenantId, ShopClientOrder order, String paymentId) {
        Optional<Payment> byId =
                paymentRepository.findByTenantIdAndPaymentIdAndIsDeletedFalse(tenantId, paymentId);
        Payment payment = byId.orElseGet(() -> paymentRepository
                .findFirstByTenantIdAndOrderIdAndStatusAndIsDeletedFalseOrderByIdDesc(
                        tenantId, order.getPublicId(), Payment.PaymentStatus.APPROVED)
                .orElse(null));

        if (payment != null
                && payment.getStatus() != Payment.PaymentStatus.APPROVED
                && paymentId.equals(payment.getPaymentId())) {
            try {
                paymentService.approveShopOrderPayment(payment.getPaymentId());
            } catch (ShopDuplicatePaymentException duplicate) {
                // 주문은 이미 다른 결제로 PAID — PortOne PAID 확인 시에만 이중 결제 자동 취소
                Optional<String> paid = portOneV2PaymentVerifyService.verifyPaidAmountBody(
                        tenantId, payment.getPaymentId(), BigDecimal.valueOf(order.getCashDueMinor()));
                if (paid.isEmpty()) {
                    throw new IllegalStateException(ShopOrderReconcileConstants.MSG_PORTONE_VERIFY_FAILED);
                }
                return reconcileDuplicatePayment(tenantId, order.getPublicId(), payment.getPaymentId(), payment);
            }
            payment = paymentRepository
                    .findByTenantIdAndPaymentIdAndIsDeletedFalse(tenantId, payment.getPaymentId())
                    .orElse(payment);
        }

        String responsePaymentId = payment != null ? payment.getPaymentId() : paymentId;
        Optional<ShopOrderPaymentState> latest = latestState(tenantId, order.getPublicId(), responsePaymentId);
        Payment fallbackPayment = payment;
        return ShopOrderReconcilePaymentResponse.builder()
                .orderPublicId(order.getPublicId())
                .paymentId(responsePaymentId)
                .orderStatus(latest.map(ShopOrderPaymentState::orderStatus).orElse(ShopClientOrderStatus.PAID))
                .paymentStatus(latest.map(ShopOrderPaymentState::paymentStatus)
                        .orElseGet(() -> fallbackPayment != null ? fallbackPayment.getStatus() : null))
                .recovered(false)
                .build();
    }

    /**
     * PortOne paymentId 에 대응하는 Payment 행을 확보한다 (테넌트·주문 격리 fail-closed).
     *
     * @param tenantId  테넌트 ID
     * @param order     주문
     * @param paymentId PortOne 결제 ID
     * @return 확보된 Payment (아직 PENDING 일 수 있음)
     */
    private Payment ensurePaymentRow(String tenantId, ShopClientOrder order, String paymentId) {
        String orderPublicId = order.getPublicId();
        Optional<Payment> existingByPaymentId =
                paymentRepository.findByTenantIdAndPaymentIdAndIsDeletedFalse(tenantId, paymentId);
        if (existingByPaymentId.isPresent()) {
            Payment existing = existingByPaymentId.get();
            if (!orderPublicId.equals(existing.getOrderId())) {
                throw new IllegalArgumentException(ShopOrderReconcileConstants.MSG_PAYMENT_ORDER_MISMATCH);
            }
            if (existing.getProvider() != Payment.PaymentProvider.IAMPORT) {
                throw new IllegalArgumentException(ShopOrderReconcileConstants.MSG_PAYMENT_PROVIDER_NOT_IAMPORT);
            }
            return existing;
        }

        Optional<Payment> updatable = findLatestUpdatableIamportPayment(tenantId, orderPublicId);
        if (updatable.isPresent()) {
            Payment candidate = updatable.get();
            // paymentId 유니크: 위에서 by paymentId 조회가 empty 이므로 충돌 없음
            candidate.setPaymentId(paymentId);
            return paymentRepository.save(candidate);
        }

        Payment created = Payment.builder()
                .paymentId(paymentId)
                .orderId(orderPublicId)
                .amount(BigDecimal.valueOf(order.getCashDueMinor()))
                .status(Payment.PaymentStatus.PENDING)
                .method(Payment.PaymentMethod.CARD)
                .provider(Payment.PaymentProvider.IAMPORT)
                .payerId(order.getClientId())
                .description(ShopOrderReconcileConstants.PAYMENT_DESCRIPTION_PREFIX + orderPublicId)
                .build();
        created.setTenantId(tenantId);
        return paymentRepository.save(created);
    }

    private Optional<Payment> findLatestUpdatableIamportPayment(String tenantId, String orderPublicId) {
        List<Payment> payments =
                paymentRepository.findByTenantIdAndOrderIdAndIsDeletedFalse(tenantId, orderPublicId);
        return payments.stream()
                .filter(p -> p.getProvider() == Payment.PaymentProvider.IAMPORT)
                .filter(p -> isUpdatablePaymentStatus(p.getStatus()))
                .max(Comparator.comparing(Payment::getId, Comparator.nullsLast(Long::compareTo)));
    }

    private static boolean isUpdatablePaymentStatus(Payment.PaymentStatus status) {
        return status == Payment.PaymentStatus.PENDING
                || status == Payment.PaymentStatus.PROCESSING
                || status == Payment.PaymentStatus.EXPIRED;
    }

    private static void requireNonBlank(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(message);
        }
    }
}
