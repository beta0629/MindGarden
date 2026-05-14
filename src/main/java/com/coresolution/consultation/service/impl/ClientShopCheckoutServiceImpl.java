package com.coresolution.consultation.service.impl;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import com.coresolution.consultation.constant.PaymentConstants;
import com.coresolution.consultation.constant.ShopCheckoutConstants;
import com.coresolution.consultation.constant.ShopClientOrderStatus;
import com.coresolution.consultation.dto.PaymentRequest;
import com.coresolution.consultation.dto.PaymentResponse;
import com.coresolution.consultation.dto.shop.ShopCheckoutRequest;
import com.coresolution.consultation.dto.shop.ShopCheckoutResponse;
import com.coresolution.consultation.dto.shop.ShopOrderLineResponse;
import com.coresolution.consultation.dto.shop.ShopOrderResponse;
import com.coresolution.consultation.dto.shop.ShopOrderSummaryResponse;
import com.coresolution.consultation.dto.shop.ShopPreparePaymentRequest;
import com.coresolution.consultation.dto.shop.ShopPreparePaymentResponse;
import com.coresolution.consultation.entity.Payment;
import com.coresolution.consultation.entity.ShopCart;
import com.coresolution.consultation.entity.ShopCartLine;
import com.coresolution.consultation.entity.ShopCatalogSku;
import com.coresolution.consultation.entity.ShopClientOrder;
import com.coresolution.consultation.entity.ShopClientOrderLine;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.PaymentRepository;
import com.coresolution.consultation.repository.ShopCartLineRepository;
import com.coresolution.consultation.repository.ShopCartRepository;
import com.coresolution.consultation.repository.ShopClientOrderLineRepository;
import com.coresolution.consultation.repository.ShopClientOrderRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.ClientPointWalletService;
import com.coresolution.consultation.service.ClientShopCheckoutService;
import com.coresolution.consultation.service.PaymentService;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 체크아웃·주문·PG intent 구현.
 *
 * @author MindGarden
 * @since 2026-05-14
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ClientShopCheckoutServiceImpl implements ClientShopCheckoutService {

    private final ShopCartRepository shopCartRepository;
    private final ShopCartLineRepository shopCartLineRepository;
    private final ShopClientOrderRepository shopClientOrderRepository;
    private final ShopClientOrderLineRepository shopClientOrderLineRepository;
    private final ClientPointWalletService clientPointWalletService;
    private final PaymentService paymentService;
    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public ShopCheckoutResponse checkout(String tenantId, Long clientUserId, ShopCheckoutRequest request) {
        Optional<ShopClientOrder> existed = shopClientOrderRepository.findByTenantClientAndCheckoutKey(
                tenantId, clientUserId, request.getIdempotencyKey());
        if (existed.isPresent()) {
            return toCheckoutResponse(existed.get());
        }

        ShopCart cart = shopCartRepository.findByTenantIdAndClientId(tenantId, clientUserId)
                .orElseThrow(() -> new IllegalArgumentException("장바구니가 비어 있습니다."));
        List<ShopCartLine> cartLines = shopCartLineRepository.findByCart_IdAndIsDeletedFalse(cart.getId());
        if (cartLines.isEmpty()) {
            throw new IllegalArgumentException("장바구니가 비어 있습니다.");
        }

        long subtotal = 0L;
        for (ShopCartLine cl : cartLines) {
            ShopCatalogSku sku = cl.getSku();
            subtotal += sku.getUnitPriceMinor() * cl.getQuantity();
        }
        if (subtotal <= 0L) {
            throw new IllegalArgumentException("주문 금액이 유효하지 않습니다.");
        }

        long requestedPoints = Math.max(0L, request.getPointsToRedeemMinor());
        var balance = clientPointWalletService.getBalance(tenantId, clientUserId);
        long maxPoints = Math.min(subtotal, balance.getAvailableMinor());
        long points = Math.min(requestedPoints, maxPoints);

        long cashDue = subtotal - points;
        if (points > 0L && cashDue > 0L) {
            throw new IllegalArgumentException(
                    "현재 단계에서는 포인트와 카드 결제를 동시에 사용할 수 없습니다. 포인트 전액 또는 카드 전액으로 결제해 주세요.");
        }
        if (cashDue > 0L && cashDue < ShopCheckoutConstants.MIN_CASH_FOR_PAYMENT_GATEWAY) {
            throw new IllegalArgumentException(
                    "카드 결제 최소 금액 미만입니다. 상품 구성을 변경하거나 관리자에 문의해 주세요.");
        }

        String publicId = UUID.randomUUID().toString();
        ShopClientOrder order = ShopClientOrder.builder()
                .publicId(publicId)
                .clientId(clientUserId)
                .status(ShopClientOrderStatus.CREATED)
                .subtotalMinor(subtotal)
                .pointsRedeemMinor(points)
                .cashDueMinor(cashDue)
                .checkoutIdempotencyKey(request.getIdempotencyKey())
                .build();
        order.setTenantId(tenantId);
        order = shopClientOrderRepository.save(order);

        int lineNo = 1;
        for (ShopCartLine cl : cartLines) {
            ShopCatalogSku sku = cl.getSku();
            long lineTotal = sku.getUnitPriceMinor() * cl.getQuantity();
            ShopClientOrderLine ol = ShopClientOrderLine.builder()
                    .clientOrder(order)
                    .lineNo(lineNo++)
                    .sku(sku)
                    .skuCodeSnapshot(sku.getSkuCode())
                    .titleSnapshot(sku.getTitle())
                    .unitPriceMinor(sku.getUnitPriceMinor())
                    .quantity(cl.getQuantity())
                    .lineTotalMinor(lineTotal)
                    .build();
            ol.setTenantId(tenantId);
            shopClientOrderLineRepository.save(ol);
        }

        String holdKey = request.getIdempotencyKey() + ":POINT_HOLD";
        if (points > 0L) {
            clientPointWalletService.hold(tenantId, clientUserId, publicId, points, holdKey);
        }

        if (cashDue == 0L) {
            order.setStatus(ShopClientOrderStatus.PAID);
            shopClientOrderRepository.save(order);
            if (points > 0L) {
                clientPointWalletService.commitHold(
                        tenantId, clientUserId, publicId, points, publicId + ":POINT_COMMIT");
            }
        }

        clearCartLines(tenantId, clientUserId);
        ShopClientOrder refreshed = shopClientOrderRepository.findByTenantIdAndPublicId(tenantId, publicId).orElse(order);
        return toCheckoutResponse(refreshed);
    }

    private void clearCartLines(String tenantId, Long clientUserId) {
        shopCartRepository.findByTenantIdAndClientId(tenantId, clientUserId)
                .ifPresent(c -> shopCartLineRepository.hardDeleteByCartId(c.getId()));
    }

    private ShopCheckoutResponse toCheckoutResponse(ShopClientOrder o) {
        String next;
        if (o.getStatus() == ShopClientOrderStatus.PAID) {
            next = "DONE";
        } else if (o.getCashDueMinor() > 0L) {
            next = "PAYMENT";
        } else {
            next = "DONE";
        }
        return ShopCheckoutResponse.builder()
                .orderPublicId(o.getPublicId())
                .status(o.getStatus())
                .subtotalMinor(o.getSubtotalMinor())
                .pointsRedeemMinor(o.getPointsRedeemMinor())
                .cashDueMinor(o.getCashDueMinor())
                .nextStep(next)
                .build();
    }

    @Override
    @Transactional
    public ShopPreparePaymentResponse preparePayment(
            String tenantId,
            Long clientUserId,
            String orderPublicId,
            ShopPreparePaymentRequest request) {

        ShopClientOrder order = shopClientOrderRepository.findByTenantIdAndPublicId(tenantId, orderPublicId)
                .orElseThrow(() -> new IllegalArgumentException("주문을 찾을 수 없습니다."));
        if (!order.getClientId().equals(clientUserId)) {
            throw new IllegalArgumentException("주문에 접근할 수 없습니다.");
        }
        if (order.getStatus() != ShopClientOrderStatus.CREATED) {
            throw new IllegalArgumentException("결제를 준비할 수 없는 주문 상태입니다.");
        }
        if (order.getCashDueMinor() == 0L) {
            throw new IllegalArgumentException("현금 결제 금액이 없는 주문입니다.");
        }
        if (order.getCashDueMinor() < ShopCheckoutConstants.MIN_CASH_FOR_PAYMENT_GATEWAY) {
            throw new IllegalArgumentException("결제 금액이 최소 금액 미만입니다.");
        }

        Optional<Payment> pending = paymentRepository.findFirstByTenantIdAndOrderIdAndStatusAndIsDeletedFalseOrderByIdDesc(
                tenantId, orderPublicId, Payment.PaymentStatus.PENDING);
        if (pending.isPresent()) {
            PaymentResponse pr = paymentService.getPayment(pending.get().getPaymentId());
            return toPrepareResponse(orderPublicId, pr);
        }

        User user = userRepository.findById(clientUserId)
                .orElseThrow(() -> new IllegalStateException("사용자를 찾을 수 없습니다."));

        String method = normalizePaymentMethod(request);
        String provider = normalizePaymentProvider(request);
        String orderName = buildOrderName(order);
        String email = user.getEmail();
        String customerName = user.getName() != null && !user.getName().isBlank() ? user.getName() : "고객";

        @SuppressWarnings("deprecation")
        PaymentRequest paymentRequest = PaymentRequest.builder()
                .orderId(orderPublicId)
                .amount(BigDecimal.valueOf(order.getCashDueMinor()))
                .method(method)
                .provider(provider)
                .payerId(clientUserId)
                .recipientId(null)
                .branchId(null)
                .orderName(orderName)
                .customerEmail(email)
                .customerName(customerName)
                .description("Shop order " + orderPublicId)
                .build();

        PaymentResponse pr = paymentService.createPayment(paymentRequest);
        order.setStatus(ShopClientOrderStatus.PENDING_PAYMENT);
        shopClientOrderRepository.save(order);
        return toPrepareResponse(orderPublicId, pr);
    }

    private static String buildOrderName(ShopClientOrder order) {
        String raw = "주문-" + order.getPublicId();
        return raw.length() <= 100 ? raw : raw.substring(0, 100);
    }

    private static String normalizePaymentMethod(ShopPreparePaymentRequest request) {
        String m = request.getPaymentMethod();
        if (m == null || m.isBlank()) {
            return PaymentConstants.METHOD_CARD;
        }
        try {
            Payment.PaymentMethod.valueOf(m);
            return m;
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("유효하지 않은 결제 방법입니다.");
        }
    }

    private static String normalizePaymentProvider(ShopPreparePaymentRequest request) {
        String p = request.getPaymentProvider();
        if (p == null || p.isBlank()) {
            return PaymentConstants.PROVIDER_TOSS;
        }
        try {
            Payment.PaymentProvider.valueOf(p);
            return p;
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("유효하지 않은 결제 대행사입니다.");
        }
    }

    private ShopPreparePaymentResponse toPrepareResponse(String orderPublicId, PaymentResponse pr) {
        return ShopPreparePaymentResponse.builder()
                .orderPublicId(orderPublicId)
                .paymentId(pr.getPaymentId())
                .cashAmount(pr.getAmount())
                .paymentUrl(pr.getPaymentUrl())
                .paymentStatus(pr.getStatus())
                .build();
    }

    @Override
    @Transactional
    public void cancelOrder(String tenantId, Long clientUserId, String orderPublicId) {
        ShopClientOrder order = shopClientOrderRepository.findByTenantIdAndPublicId(tenantId, orderPublicId)
                .orElseThrow(() -> new IllegalArgumentException("주문을 찾을 수 없습니다."));
        if (!order.getClientId().equals(clientUserId)) {
            throw new IllegalArgumentException("주문에 접근할 수 없습니다.");
        }
        if (order.getStatus() != ShopClientOrderStatus.CREATED) {
            throw new IllegalArgumentException("취소할 수 없는 주문 상태입니다.");
        }
        long points = order.getPointsRedeemMinor();
        if (points > 0L) {
            clientPointWalletService.releaseHold(
                    tenantId, clientUserId, orderPublicId, points, orderPublicId + ":POINT_RELEASE");
        }
        order.setStatus(ShopClientOrderStatus.CANCELLED);
        shopClientOrderRepository.save(order);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ShopOrderSummaryResponse> listMyOrders(String tenantId, Long clientUserId, int page, int size) {
        int p = Math.max(0, page);
        int s = Math.min(Math.max(1, size), 50);
        List<ShopClientOrder> list = shopClientOrderRepository.findRecentByTenantAndClient(
                tenantId, clientUserId, PageRequest.of(p, s));
        List<ShopOrderSummaryResponse> result = new ArrayList<>();
        for (ShopClientOrder o : list) {
            result.add(ShopOrderSummaryResponse.builder()
                    .orderPublicId(o.getPublicId())
                    .status(o.getStatus())
                    .subtotalMinor(o.getSubtotalMinor())
                    .pointsRedeemMinor(o.getPointsRedeemMinor())
                    .cashDueMinor(o.getCashDueMinor())
                    .createdAt(o.getCreatedAt())
                    .build());
        }
        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public ShopOrderResponse getOrder(String tenantId, Long clientUserId, String orderPublicId) {
        ShopClientOrder order = shopClientOrderRepository.findByTenantIdAndPublicId(tenantId, orderPublicId)
                .orElseThrow(() -> new IllegalArgumentException("주문을 찾을 수 없습니다."));
        if (!order.getClientId().equals(clientUserId)) {
            throw new IllegalArgumentException("주문에 접근할 수 없습니다.");
        }
        List<ShopClientOrderLine> lines =
                shopClientOrderLineRepository.findByClientOrder_IdAndIsDeletedFalseOrderByLineNoAsc(order.getId());
        List<ShopOrderLineResponse> lr = new ArrayList<>();
        for (ShopClientOrderLine l : lines) {
            lr.add(ShopOrderLineResponse.builder()
                    .lineNo(l.getLineNo())
                    .skuCode(l.getSkuCodeSnapshot())
                    .title(l.getTitleSnapshot())
                    .quantity(l.getQuantity())
                    .unitPriceMinor(l.getUnitPriceMinor())
                    .lineTotalMinor(l.getLineTotalMinor())
                    .build());
        }
        return ShopOrderResponse.builder()
                .orderPublicId(order.getPublicId())
                .status(order.getStatus())
                .subtotalMinor(order.getSubtotalMinor())
                .pointsRedeemMinor(order.getPointsRedeemMinor())
                .cashDueMinor(order.getCashDueMinor())
                .lines(lr)
                .build();
    }
}
