package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.constant.AuditAction;
import com.coresolution.consultation.constant.ShopAdminOrderConstants;
import com.coresolution.consultation.constant.ShopClientOrderStatus;
import com.coresolution.consultation.constant.ShopOrderFulfillmentRetryConstants;
import com.coresolution.consultation.constant.ShopSessionCountConstants;
import com.coresolution.consultation.dto.shop.ShopOrderLineResponse;
import com.coresolution.consultation.dto.shop.admin.ShopOrderAdminDetailResponse;
import com.coresolution.consultation.dto.shop.admin.ShopOrderAdminSummaryItem;
import com.coresolution.consultation.dto.shop.admin.ShopOrderFulfillmentEventSummary;
import com.coresolution.consultation.entity.AuditLog;
import com.coresolution.consultation.entity.Payment;
import com.coresolution.consultation.util.PaymentSourceResolver;
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
import com.coresolution.consultation.service.ShopOrderFulfillmentService;
import com.coresolution.consultation.service.portone.PortOneV2PaymentVerifyService;
import com.coresolution.consultation.utils.SessionUtils;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
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
    private final ShopOrderFulfillmentService shopOrderFulfillmentService;
    private final PortOneV2PaymentVerifyService portOneV2PaymentVerifyService;

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
            result.add(toSummaryItem(tenantId, order, isOrderDeletable(tenantId, order)));
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
                    .retryable(ShopOrderFulfillmentRetryConstants.isRetryableFailed(
                            event.getStatus(), event.getMessage()))
                    .build());
        }
        Optional<Payment> paymentOpt = resolveLatestPayment(tenantId, orderPublicId);
        String paymentId = paymentOpt.map(Payment::getPaymentId).orElse(null);
        String paymentStatus = paymentOpt
                .map(Payment::getStatus)
                .map(Enum::name)
                .orElse(null);
        Long pgAmount = paymentOpt
                .map(Payment::getAmount)
                .map(AdminShopOrderServiceImpl::toMinorLong)
                .orElse(null);
        // Soft-fail: PortOne 조회 실패·빈 응답 시 null (상세 API는 유지)
        String pgStatus = null;
        if (paymentId != null && !paymentId.isBlank()) {
            pgStatus = portOneV2PaymentVerifyService
                    .fetchPaymentStatus(tenantId, paymentId)
                    .orElse(null);
        }
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
                .pgAmount(pgAmount)
                .pgStatus(pgStatus)
                .lines(lineResponses)
                .fulfillmentEvents(eventSummaries)
                .deletable(isOrderDeletable(tenantId, order))
                .build();
    }

    @Override
    @Transactional
    public ShopOrderAdminDetailResponse retryOrderFulfillment(String tenantId, String orderPublicId) {
        ShopClientOrder order = shopClientOrderRepository.findByTenantIdAndPublicId(tenantId, orderPublicId)
                .orElseThrow(() -> new IllegalArgumentException(ShopAdminOrderConstants.MSG_ORDER_NOT_FOUND));
        shopOrderFulfillmentService.retryFailedFulfillment(tenantId, order, false);
        return getOrderDetail(tenantId, orderPublicId);
    }

    @Override
    @Transactional
    public ShopOrderAdminDetailResponse repairDepositIncome(String tenantId, String orderPublicId) {
        ShopClientOrder order = shopClientOrderRepository.findByTenantIdAndPublicId(tenantId, orderPublicId)
                .orElseThrow(() -> new IllegalArgumentException(ShopAdminOrderConstants.MSG_ORDER_NOT_FOUND));
        shopOrderFulfillmentService.repairConsultationDepositIncome(tenantId, order);
        return getOrderDetail(tenantId, orderPublicId);
    }

    /**
     * 주문에 연결된 최신 결제 — APPROVED 우선, 없으면 REFUNDED, 아니면 id 최대 1건.
     *
     * @param tenantId      테넌트 ID
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

    /**
     * 라인 스냅샷 회기수(없으면 SKU 또는 최소값).
     *
     * @param line 주문 라인
     * @return 회기수
     */
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
     * 목록/상세 UI용 — 삭제 가능 여부(주문 상태·결제 라이브/in-flight 가드).
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
        return !hasLiveOrInFlightPayment(tenantId, order.getPublicId());
    }

    /**
     * soft-delete 전 가드. PAID·허용 외 상태·라이브/in-flight 결제이면 예외.
     *
     * @param tenantId 테넌트 ID
     * @param order    주문
     */
    private void assertDeletable(String tenantId, ShopClientOrder order) {
        if (order.getStatus() == ShopClientOrderStatus.PAID) {
            throw new IllegalArgumentException(ShopAdminOrderConstants.MSG_DELETE_DENIED_PAID);
        }
        if (hasLiveOrInFlightPayment(tenantId, order.getPublicId())) {
            throw new IllegalStateException(ShopAdminOrderConstants.MSG_DELETE_DENIED_LIVE_PAYMENT);
        }
        if (!ShopAdminOrderConstants.isDeletableStatus(order.getStatus())) {
            throw new IllegalArgumentException(ShopAdminOrderConstants.MSG_DELETE_DENIED_STATUS);
        }
    }

    /**
     * 라이브·진행 중 결제 — undeleted Payment 가 PENDING / PROCESSING / APPROVED.
     *
     * @param tenantId      테넌트 ID
     * @param orderPublicId 주문 공개 ID
     * @return 라이브/in-flight 결제가 있으면 true
     */
    private boolean hasLiveOrInFlightPayment(String tenantId, String orderPublicId) {
        List<Payment> payments =
                paymentRepository.findByTenantIdAndOrderIdAndIsDeletedFalse(tenantId, orderPublicId);
        for (Payment payment : payments) {
            if (ShopAdminOrderConstants.isLiveOrInFlightPaymentStatus(payment.getStatus())) {
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

    /**
     * 목록 요약 — 주문 금액 필드 + Payment SSOT({@code paymentStatus}, {@code pgAmount}).
     *
     * @param tenantId  테넌트 ID
     * @param order     주문
     * @param deletable soft-delete 가능 여부
     * @return 요약 DTO
     */
    private ShopOrderAdminSummaryItem toSummaryItem(
            String tenantId, ShopClientOrder order, boolean deletable) {
        Optional<Payment> paymentOpt = resolveLatestPayment(tenantId, order.getPublicId());
        String paymentStatus = paymentOpt
                .map(Payment::getStatus)
                .map(Enum::name)
                .orElse(null);
        Long pgAmount = paymentOpt
                .map(Payment::getAmount)
                .map(AdminShopOrderServiceImpl::toMinorLong)
                .orElse(null);
        String paymentProvider = paymentOpt
                .map(Payment::getProvider)
                .map(Enum::name)
                .orElse(null);
        return ShopOrderAdminSummaryItem.builder()
                .orderPublicId(order.getPublicId())
                .status(order.getStatus())
                .subtotalMinor(order.getSubtotalMinor())
                .pointsRedeemMinor(order.getPointsRedeemMinor())
                .cashDueMinor(order.getCashDueMinor())
                .clientId(order.getClientId())
                .createdAt(order.getCreatedAt())
                .paymentStatus(paymentStatus)
                .pgAmount(pgAmount)
                .paymentSource(PaymentSourceResolver.forShopOrder())
                .paymentProvider(paymentProvider)
                .deletable(deletable)
                .build();
    }

    private static Long toMinorLong(java.math.BigDecimal amount) {
        if (amount == null) {
            return null;
        }
        return amount.longValue();
    }

}
