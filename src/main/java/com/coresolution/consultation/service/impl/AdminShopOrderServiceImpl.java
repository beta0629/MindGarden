package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.constant.ShopAdminOrderConstants;
import com.coresolution.consultation.dto.shop.ShopOrderLineResponse;
import com.coresolution.consultation.dto.shop.admin.ShopOrderAdminDetailResponse;
import com.coresolution.consultation.dto.shop.admin.ShopOrderAdminSummaryItem;
import com.coresolution.consultation.dto.shop.admin.ShopOrderFulfillmentEventSummary;
import com.coresolution.consultation.entity.Payment;
import com.coresolution.consultation.entity.ShopClientOrder;
import com.coresolution.consultation.entity.ShopClientOrderLine;
import com.coresolution.consultation.entity.ShopOrderFulfillmentEvent;
import com.coresolution.consultation.repository.PaymentRepository;
import com.coresolution.consultation.repository.ShopClientOrderLineRepository;
import com.coresolution.consultation.repository.ShopClientOrderRepository;
import com.coresolution.consultation.repository.ShopOrderFulfillmentEventRepository;
import com.coresolution.consultation.service.AdminShopOrderService;
import com.coresolution.consultation.service.ClientShopCheckoutService;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 테넌트 어드민 — 온라인 주문 조회 구현.
 *
 * @author MindGarden
 * @since 2026-05-19
 */
@Service
@RequiredArgsConstructor
public class AdminShopOrderServiceImpl implements AdminShopOrderService {

    private final ShopClientOrderRepository shopClientOrderRepository;
    private final ShopClientOrderLineRepository shopClientOrderLineRepository;
    private final ShopOrderFulfillmentEventRepository shopOrderFulfillmentEventRepository;
    private final PaymentRepository paymentRepository;
    private final ClientShopCheckoutService clientShopCheckoutService;

    @Override
    @Transactional(readOnly = true)
    public List<ShopOrderAdminSummaryItem> listRecentOrders(String tenantId, int limit) {
        int capped = Math.min(
                Math.max(1, limit),
                ShopAdminOrderConstants.MAX_LIST_LIMIT);
        List<ShopClientOrder> orders = shopClientOrderRepository.findRecentByTenant(
                tenantId, PageRequest.of(0, capped));
        List<ShopOrderAdminSummaryItem> result = new ArrayList<>();
        for (ShopClientOrder order : orders) {
            result.add(toSummaryItem(order));
        }
        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public ShopOrderAdminDetailResponse getOrderDetail(String tenantId, String orderPublicId) {
        ShopClientOrder order = shopClientOrderRepository.findByTenantIdAndPublicId(tenantId, orderPublicId)
                .orElseThrow(() -> new IllegalArgumentException("주문을 찾을 수 없습니다."));
        List<ShopClientOrderLine> lines =
                shopClientOrderLineRepository.findByClientOrder_IdAndIsDeletedFalseOrderByLineNoAsc(order.getId());
        List<ShopOrderLineResponse> lineResponses = new ArrayList<>();
        for (ShopClientOrderLine line : lines) {
            lineResponses.add(ShopOrderLineResponse.builder()
                    .lineNo(line.getLineNo())
                    .skuCode(line.getSkuCodeSnapshot())
                    .title(line.getTitleSnapshot())
                    .quantity(line.getQuantity())
                    .unitPriceMinor(line.getUnitPriceMinor())
                    .lineTotalMinor(line.getLineTotalMinor())
                    .build());
        }
        List<ShopOrderFulfillmentEvent> events =
                shopOrderFulfillmentEventRepository
                        .findByTenantIdAndOrderPublicIdAndIsDeletedFalseOrderBySkuCodeAsc(
                                tenantId, orderPublicId);
        List<ShopOrderFulfillmentEventSummary> eventSummaries = new ArrayList<>();
        for (ShopOrderFulfillmentEvent event : events) {
            eventSummaries.add(ShopOrderFulfillmentEventSummary.builder()
                    .skuCode(event.getSkuCode())
                    .category(event.getCategory())
                    .status(event.getStatus())
                    .message(event.getMessage())
                    .createdAt(event.getCreatedAt())
                    .build());
        }
        Optional<Payment> paymentOpt = resolveLatestPayment(tenantId, orderPublicId);
        String paymentId = paymentOpt.map(Payment::getPaymentId).orElse(null);
        String paymentStatus = paymentOpt
                .map(Payment::getStatus)
                .map(Enum::name)
                .orElse(null);
        return ShopOrderAdminDetailResponse.builder()
                .orderPublicId(order.getPublicId())
                .status(order.getStatus())
                .subtotalMinor(order.getSubtotalMinor())
                .pointsRedeemMinor(order.getPointsRedeemMinor())
                .cashDueMinor(order.getCashDueMinor())
                .clientId(order.getClientId())
                .createdAt(order.getCreatedAt())
                .paymentId(paymentId)
                .paymentStatus(paymentStatus)
                .lines(lineResponses)
                .fulfillmentEvents(eventSummaries)
                .build();
    }

    /**
     * 주문에 연결된 최신 결제 — APPROVED 우선, 없으면 REFUNDED, 아니면 id 최대 1건.
     *
     * @param tenantId 테넌트 ID
     * @param orderPublicId 주문 공개 ID
     * @return 결제 (없으면 empty)
     */
    private Optional<Payment> resolveLatestPayment(String tenantId, String orderPublicId) {
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
        return paymentRepository.findByTenantIdAndOrderIdAndIsDeletedFalse(tenantId, orderPublicId)
                .stream()
                .max(Comparator.comparing(Payment::getId, Comparator.nullsLast(Long::compareTo)));
    }

    @Override
    @Transactional
    public void cancelUnpaidOrder(String tenantId, String orderPublicId) {
        ShopClientOrder order = shopClientOrderRepository.findByTenantIdAndPublicId(tenantId, orderPublicId)
                .orElseThrow(() -> new IllegalArgumentException("주문을 찾을 수 없습니다."));
        clientShopCheckoutService.cancelOrder(tenantId, order.getClientId(), orderPublicId);
    }

    private static ShopOrderAdminSummaryItem toSummaryItem(ShopClientOrder order) {
        return ShopOrderAdminSummaryItem.builder()
                .orderPublicId(order.getPublicId())
                .status(order.getStatus())
                .subtotalMinor(order.getSubtotalMinor())
                .pointsRedeemMinor(order.getPointsRedeemMinor())
                .cashDueMinor(order.getCashDueMinor())
                .clientId(order.getClientId())
                .createdAt(order.getCreatedAt())
                .build();
    }
}
