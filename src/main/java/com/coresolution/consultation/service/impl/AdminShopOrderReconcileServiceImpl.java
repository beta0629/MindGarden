package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.constant.ShopClientOrderStatus;
import com.coresolution.consultation.constant.ShopOrderReconcileConstants;
import com.coresolution.consultation.dto.shop.admin.ShopOrderReconcilePaymentResponse;
import com.coresolution.consultation.entity.Payment;
import com.coresolution.consultation.entity.ShopClientOrder;
import com.coresolution.consultation.repository.PaymentRepository;
import com.coresolution.consultation.repository.ShopClientOrderRepository;
import com.coresolution.consultation.service.AdminShopOrderReconcileService;
import com.coresolution.consultation.service.ClientShopCheckoutService;
import com.coresolution.consultation.service.PaymentService;
import com.coresolution.consultation.service.portone.PortOneV2PaymentLookupService;
import com.coresolution.consultation.service.portone.PortOneV2PaymentVerifyService;
import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 어드민 쇼핑 주문 PortOne 결제 정합 — V2 검증 후 웹훅/verify 와 동일 SSOT 로 PAID 반영.
 * <p>
 * {@code EXPIRED} 주문도 PortOne 이 PAID 이고 금액이 일치하면
 * {@link ClientShopCheckoutService#completeOrderOnPaymentApproved} 로 복구한다.
 * paymentId 또는 카드 승인번호로 PortOne 결제를 해석한다.
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

    @Override
    @Transactional
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
        if (order.getStatus() == ShopClientOrderStatus.CANCELLED) {
            throw new IllegalArgumentException(ShopOrderReconcileConstants.MSG_ORDER_CANCELLED);
        }
        if (order.getStatus() == ShopClientOrderStatus.REFUNDED) {
            throw new IllegalArgumentException(ShopOrderReconcileConstants.MSG_ORDER_REFUNDED);
        }
        if (order.getStatus() != ShopClientOrderStatus.CREATED
                && order.getStatus() != ShopClientOrderStatus.PENDING_PAYMENT
                && order.getStatus() != ShopClientOrderStatus.EXPIRED) {
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

        boolean recoveringExpired = order.getStatus() == ShopClientOrderStatus.EXPIRED;
        BigDecimal expectedAmount = BigDecimal.valueOf(cashDueMinor);

        Optional<String> verifiedBody = portOneV2PaymentVerifyService.verifyPaidAmountBody(
                tenantId, trimmedPaymentId, expectedAmount);
        if (verifiedBody.isEmpty()) {
            throw new IllegalStateException(ShopOrderReconcileConstants.MSG_PORTONE_VERIFY_FAILED);
        }

        Payment payment = ensurePaymentRow(tenantId, order, trimmedPaymentId);
        payment.setExternalResponse(verifiedBody.get());
        paymentRepository.save(payment);

        if (payment.getStatus() != Payment.PaymentStatus.APPROVED) {
            paymentService.updatePaymentStatus(trimmedPaymentId, Payment.PaymentStatus.APPROVED);
        }
        // EXPIRED 복구·멱등: updatePaymentStatus 동기화와 별도로 SSOT 재호출 (이미 PAID 면 no-op)
        clientShopCheckoutService.completeOrderOnPaymentApproved(tenantId, orderPublicId);

        ShopClientOrder refreshed = shopClientOrderRepository
                .findByTenantIdAndPublicId(tenantId, orderPublicId)
                .orElse(order);
        Payment refreshedPayment = paymentRepository
                .findByTenantIdAndPaymentIdAndIsDeletedFalse(tenantId, trimmedPaymentId)
                .orElse(payment);

        log.info(
                "쇼핑 주문 결제 정합 완료: tenantId={}, orderPublicId={}, paymentId={}, orderStatus={}, recovered={}",
                tenantId,
                orderPublicId,
                trimmedPaymentId,
                refreshed.getStatus(),
                recoveringExpired && refreshed.getStatus() == ShopClientOrderStatus.PAID);

        return ShopOrderReconcilePaymentResponse.builder()
                .orderPublicId(orderPublicId)
                .paymentId(trimmedPaymentId)
                .orderStatus(refreshed.getStatus())
                .paymentStatus(refreshedPayment.getStatus())
                .recovered(recoveringExpired && refreshed.getStatus() == ShopClientOrderStatus.PAID)
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
            paymentService.updatePaymentStatus(payment.getPaymentId(), Payment.PaymentStatus.APPROVED);
            payment = paymentRepository
                    .findByTenantIdAndPaymentIdAndIsDeletedFalse(tenantId, payment.getPaymentId())
                    .orElse(payment);
        }

        return ShopOrderReconcilePaymentResponse.builder()
                .orderPublicId(order.getPublicId())
                .paymentId(payment != null ? payment.getPaymentId() : paymentId)
                .orderStatus(ShopClientOrderStatus.PAID)
                .paymentStatus(payment != null ? payment.getStatus() : null)
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
