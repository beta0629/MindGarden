package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.constant.AuditAction;
import com.coresolution.consultation.constant.ShopAdminOrderConstants;
import com.coresolution.consultation.constant.ShopClientOrderStatus;
import com.coresolution.consultation.dto.shop.ShopOrderLineResponse;
import com.coresolution.consultation.dto.shop.admin.ShopOrderAdminDetailResponse;
import com.coresolution.consultation.dto.shop.admin.ShopOrderAdminSummaryItem;
import com.coresolution.consultation.dto.shop.admin.ShopOrderFulfillmentEventSummary;
import com.coresolution.consultation.entity.AuditLog;
import com.coresolution.consultation.entity.Payment;
import com.coresolution.consultation.entity.ShopClientOrder;
import com.coresolution.consultation.entity.ShopClientOrderLine;
import com.coresolution.consultation.entity.ShopOrderFulfillmentEvent;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.PaymentRepository;
import com.coresolution.consultation.repository.ShopClientOrderLineRepository;
import com.coresolution.consultation.repository.ShopClientOrderRepository;
import com.coresolution.consultation.repository.ShopOrderFulfillmentEventRepository;
import com.coresolution.consultation.service.AdminShopOrderService;
import com.coresolution.consultation.service.AuditLogService;
import com.coresolution.consultation.utils.SessionUtils;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 테넌트 어드민 — 온라인 주문 조회·soft-delete 구현.
 *
 * @author MindGarden
 * @since 2026-05-19
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AdminShopOrderServiceImpl implements AdminShopOrderService {

    private final ShopClientOrderRepository shopClientOrderRepository;
    private final ShopClientOrderLineRepository shopClientOrderLineRepository;
    private final ShopOrderFulfillmentEventRepository shopOrderFulfillmentEventRepository;
    private final PaymentRepository paymentRepository;
    private final AuditLogService auditLogService;
    private final ObjectMapper objectMapper;

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
            result.add(toSummaryItem(order, isOrderDeletable(tenantId, order)));
        }
        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public ShopOrderAdminDetailResponse getOrderDetail(String tenantId, String orderPublicId) {
        ShopClientOrder order = shopClientOrderRepository.findByTenantIdAndPublicId(tenantId, orderPublicId)
                .orElseThrow(() -> new IllegalArgumentException(ShopAdminOrderConstants.MSG_ORDER_NOT_FOUND));
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
                .deletable(isOrderDeletable(tenantId, order))
                .build();
    }

    @Override
    @Transactional
    public void softDeleteOrder(String tenantId, String orderPublicId) {
        ShopClientOrder order = shopClientOrderRepository.findByTenantIdAndPublicId(tenantId, orderPublicId)
                .orElseThrow(() -> new IllegalArgumentException(ShopAdminOrderConstants.MSG_ORDER_NOT_FOUND));

        assertDeletable(tenantId, order);

        String beforeJson = buildBeforeJson(order);
        order.delete();
        shopClientOrderRepository.save(order);

        List<ShopClientOrderLine> lines =
                shopClientOrderLineRepository.findByClientOrder_IdAndIsDeletedFalseOrderByLineNoAsc(order.getId());
        for (ShopClientOrderLine line : lines) {
            line.delete();
            shopClientOrderLineRepository.save(line);
        }

        recordSoftDeleteAudit(tenantId, order, beforeJson);
        log.info(
                "쇼핑 주문 soft-delete: tenantId={}, orderPublicId={}, status={}, lineCount={}",
                tenantId,
                orderPublicId,
                order.getStatus(),
                lines.size());
    }

    /**
     * 목록/상세 UI용 — 삭제 가능 여부(상태·환불 진행 가드).
     *
     * @param tenantId 테넌트 ID
     * @param order    주문
     * @return 삭제 가능하면 true
     */
    private boolean isOrderDeletable(String tenantId, ShopClientOrder order) {
        if (order.getStatus() == ShopClientOrderStatus.PAID) {
            return false;
        }
        if (!ShopAdminOrderConstants.isDeletableStatus(order.getStatus())) {
            return false;
        }
        return !isRefundInProgress(tenantId, order.getPublicId());
    }

    /**
     * soft-delete 전 가드. PAID·허용 외 상태·환불 진행 중이면 예외.
     *
     * @param tenantId 테넌트 ID
     * @param order    주문
     */
    private void assertDeletable(String tenantId, ShopClientOrder order) {
        if (order.getStatus() == ShopClientOrderStatus.PAID) {
            throw new IllegalArgumentException(ShopAdminOrderConstants.MSG_DELETE_DENIED_PAID);
        }
        if (isRefundInProgress(tenantId, order.getPublicId())) {
            throw new IllegalStateException(ShopAdminOrderConstants.MSG_DELETE_DENIED_REFUND_IN_PROGRESS);
        }
        if (!ShopAdminOrderConstants.isDeletableStatus(order.getStatus())) {
            throw new IllegalArgumentException(ShopAdminOrderConstants.MSG_DELETE_DENIED_STATUS);
        }
    }

    /**
     * 환불 진행 중 — 주문에 연결된 결제 row 가 {@link Payment.PaymentStatus#PROCESSING}.
     *
     * @param tenantId      테넌트 ID
     * @param orderPublicId 주문 공개 ID
     * @return 진행 중이면 true
     */
    private boolean isRefundInProgress(String tenantId, String orderPublicId) {
        List<Payment> payments =
                paymentRepository.findByTenantIdAndOrderIdAndIsDeletedFalse(tenantId, orderPublicId);
        for (Payment payment : payments) {
            if (payment.getStatus() == Payment.PaymentStatus.PROCESSING) {
                return true;
            }
        }
        return false;
    }

    private void recordSoftDeleteAudit(String tenantId, ShopClientOrder order, String beforeJson) {
        User actor = SessionUtils.getCurrentUser(null);
        Long actorUserId = actor != null ? actor.getId() : null;
        String actorRole = actor != null && actor.getRole() != null ? actor.getRole().name() : null;

        Map<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("orderPublicId", order.getPublicId());
        metadata.put("status", order.getStatus() != null ? order.getStatus().name() : null);
        metadata.put("clientId", order.getClientId());

        String metadataJson;
        try {
            metadataJson = objectMapper.writeValueAsString(metadata);
        } catch (JsonProcessingException e) {
            metadataJson = "{\"orderPublicId\":\"" + order.getPublicId() + "\"}";
        }

        AuditLog entry = AuditLog.builder()
                .tenantId(tenantId)
                .actorUserId(actorUserId)
                .actorRole(actorRole)
                .targetUserId(order.getClientId())
                .action(AuditAction.SHOP_ORDER_SOFT_DELETE)
                .entityType(ShopAdminOrderConstants.AUDIT_ENTITY_TYPE)
                .entityId(order.getId())
                .beforeJson(beforeJson)
                .metadataJson(metadataJson)
                .build();
        auditLogService.record(entry);
    }

    private String buildBeforeJson(ShopClientOrder order) {
        Map<String, Object> before = new LinkedHashMap<>();
        before.put("orderPublicId", order.getPublicId());
        before.put("status", order.getStatus() != null ? order.getStatus().name() : null);
        before.put("clientId", order.getClientId());
        before.put("subtotalMinor", order.getSubtotalMinor());
        before.put("pointsRedeemMinor", order.getPointsRedeemMinor());
        before.put("cashDueMinor", order.getCashDueMinor());
        before.put("isDeleted", false);
        try {
            return objectMapper.writeValueAsString(before);
        } catch (JsonProcessingException e) {
            return null;
        }
    }

    private static ShopOrderAdminSummaryItem toSummaryItem(ShopClientOrder order, boolean deletable) {
        return ShopOrderAdminSummaryItem.builder()
                .orderPublicId(order.getPublicId())
                .status(order.getStatus())
                .subtotalMinor(order.getSubtotalMinor())
                .pointsRedeemMinor(order.getPointsRedeemMinor())
                .cashDueMinor(order.getCashDueMinor())
                .clientId(order.getClientId())
                .createdAt(order.getCreatedAt())
                .deletable(deletable)
                .build();
    }
}
