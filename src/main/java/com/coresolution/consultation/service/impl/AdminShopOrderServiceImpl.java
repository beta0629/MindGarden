package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.constant.ShopAdminOrderConstants;
import com.coresolution.consultation.constant.ShopSessionCountConstants;
import com.coresolution.consultation.dto.shop.ShopOrderLineResponse;
import com.coresolution.consultation.dto.shop.admin.ShopOrderAdminDetailResponse;
import com.coresolution.consultation.dto.shop.admin.ShopOrderAdminSummaryItem;
import com.coresolution.consultation.dto.shop.admin.ShopOrderFulfillmentEventSummary;
import com.coresolution.consultation.entity.ShopClientOrder;
import com.coresolution.consultation.entity.ShopClientOrderLine;
import com.coresolution.consultation.entity.ShopOrderFulfillmentEvent;
import com.coresolution.consultation.repository.ShopClientOrderLineRepository;
import com.coresolution.consultation.repository.ShopClientOrderRepository;
import com.coresolution.consultation.repository.ShopOrderFulfillmentEventRepository;
import com.coresolution.consultation.service.AdminShopOrderService;
import java.util.ArrayList;
import java.util.List;
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
            int sessionCount = resolveOrderLineSessionCount(line);
            lineResponses.add(ShopOrderLineResponse.builder()
                    .lineNo(line.getLineNo())
                    .skuCode(line.getSkuCodeSnapshot())
                    .title(line.getTitleSnapshot())
                    .quantity(line.getQuantity())
                    .unitPriceMinor(line.getUnitPriceMinor())
                    .lineTotalMinor(line.getLineTotalMinor())
                    .sessionCount(sessionCount)
                    .packageType(ShopSessionCountConstants.resolvePackageType(sessionCount))
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
        return ShopOrderAdminDetailResponse.builder()
                .orderPublicId(order.getPublicId())
                .status(order.getStatus())
                .subtotalMinor(order.getSubtotalMinor())
                .pointsRedeemMinor(order.getPointsRedeemMinor())
                .cashDueMinor(order.getCashDueMinor())
                .clientId(order.getClientId())
                .createdAt(order.getCreatedAt())
                .lines(lineResponses)
                .fulfillmentEvents(eventSummaries)
                .build();
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

    private static int resolveOrderLineSessionCount(ShopClientOrderLine line) {
        Integer snapshot = line.getSessionCountSnapshot();
        if (snapshot != null && snapshot >= ShopSessionCountConstants.MIN_SESSION_COUNT) {
            return snapshot;
        }
        if (line.getSku() != null
                && line.getSku().getSessionCount() != null
                && line.getSku().getSessionCount() >= ShopSessionCountConstants.MIN_SESSION_COUNT) {
            return line.getSku().getSessionCount();
        }
        return ShopSessionCountConstants.MIN_SESSION_COUNT;
    }

}
