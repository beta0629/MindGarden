package com.coresolution.consultation.service.impl;

import java.util.List;
import com.coresolution.consultation.constant.ShopCatalogCategory;
import com.coresolution.consultation.constant.ShopCheckoutConstants;
import com.coresolution.consultation.constant.ShopOrderFulfillmentMessages;
import com.coresolution.consultation.constant.ShopOrderFulfillmentStatus;
import com.coresolution.consultation.dto.shop.ShopConsultationFulfillmentContext;
import com.coresolution.consultation.entity.ShopCatalogSku;
import com.coresolution.consultation.entity.ShopClientOrder;
import com.coresolution.consultation.entity.ShopClientOrderLine;
import com.coresolution.consultation.entity.ShopOrderFulfillmentEvent;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ShopClientOrderLineRepository;
import com.coresolution.consultation.repository.ShopOrderFulfillmentEventRepository;
import com.coresolution.consultation.service.ShopNotificationHelper;
import com.coresolution.consultation.service.ShopOrderFulfillmentService;
import java.util.Optional;
import com.coresolution.consultation.service.shop.ShopConsultationFulfillmentHook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * PAID 주문 이행 이벤트 기록 — CONSULTATION ERP 훅, ASSESSMENT PENDING.
 *
 * @author MindGarden
 * @since 2026-05-19
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ShopOrderFulfillmentServiceImpl implements ShopOrderFulfillmentService {

    private final ShopOrderFulfillmentEventRepository fulfillmentEventRepository;
    private final ShopClientOrderLineRepository shopClientOrderLineRepository;
    private final ShopConsultationFulfillmentHook consultationFulfillmentHook;
    private final ShopNotificationHelper shopNotificationHelper;
    private final ConsultantClientMappingRepository consultantClientMappingRepository;

    @Override
    @Transactional
    public void fulfillPaidOrder(String tenantId, ShopClientOrder order) {
        String orderPublicId = order.getPublicId();
        String fulfillKey = ShopCheckoutConstants.orderFulfillKey(orderPublicId);
        if (fulfillmentEventRepository.existsByTenantIdAndOrderPublicIdAndIsDeletedFalse(
                tenantId, orderPublicId)) {
            log.debug(
                    "Fulfillment idempotent skip: tenantId={}, orderPublicId={}, key={}",
                    tenantId,
                    orderPublicId,
                    fulfillKey);
            return;
        }

        List<ShopClientOrderLine> lines =
                shopClientOrderLineRepository.findByClientOrder_IdAndIsDeletedFalseOrderByLineNoAsc(
                        order.getId());
        if (lines.isEmpty()) {
            log.warn("Fulfillment skipped — no order lines: tenantId={}, orderPublicId={}", tenantId, orderPublicId);
            return;
        }

        for (ShopClientOrderLine line : lines) {
            recordLineFulfillment(tenantId, order, line);
        }
        log.info(
                "Order fulfillment recorded: tenantId={}, orderPublicId={}, lineCount={}, key={}",
                tenantId,
                orderPublicId,
                lines.size(),
                fulfillKey);
    }

    private void recordLineFulfillment(String tenantId, ShopClientOrder order, ShopClientOrderLine line) {
        String category = resolveCategory(line.getSku());
        String skuCode = line.getSkuCodeSnapshot();
        FulfillmentOutcome outcome = resolveOutcome(tenantId, order, line, category, skuCode);

        ShopOrderFulfillmentEvent event = ShopOrderFulfillmentEvent.builder()
                .orderPublicId(order.getPublicId())
                .skuCode(skuCode)
                .category(category)
                .status(outcome.status())
                .message(outcome.message())
                .build();
        event.setTenantId(tenantId);
        fulfillmentEventRepository.save(event);
        if (ShopCatalogCategory.CONSULTATION.equals(category)
                && ShopOrderFulfillmentStatus.COMPLETED.equals(outcome.status())) {
            Long consultantUserId = resolveConsultantUserId(tenantId, line.getConsultantClientMappingId());
            try {
                shopNotificationHelper.notifyFulfillmentCompleted(
                        tenantId, order, consultantUserId, skuCode);
            } catch (Exception ex) {
                log.warn(
                        "쇼핑 fulfillment 알림 실패: tenantId={}, orderPublicId={}, skuCode={}",
                        tenantId,
                        order.getPublicId(),
                        skuCode,
                        ex);
            }
        }
    }

    private Long resolveConsultantUserId(String tenantId, Long mappingId) {
        if (mappingId == null || tenantId == null || tenantId.isBlank()) {
            return null;
        }
        Optional<ConsultantClientMapping> mappingOpt =
                consultantClientMappingRepository.findByTenantIdAndId(tenantId, mappingId);
        return mappingOpt.map(m -> m.getConsultant() != null ? m.getConsultant().getId() : null).orElse(null);
    }

    private FulfillmentOutcome resolveOutcome(
            String tenantId,
            ShopClientOrder order,
            ShopClientOrderLine line,
            String category,
            String skuCode) {
        if (ShopCatalogCategory.CONSULTATION.equals(category)) {
            Long mappingId = line.getConsultantClientMappingId();
            if (mappingId == null) {
                return new FulfillmentOutcome(
                        ShopOrderFulfillmentStatus.SKIPPED,
                        ShopOrderFulfillmentMessages.CONSULTATION_MAPPING_MISSING_SKIPPED);
            }
            return invokeConsultationHook(tenantId, order, line, skuCode, mappingId);
        }
        if (ShopCatalogCategory.ASSESSMENT.equals(category)) {
            return new FulfillmentOutcome(
                    ShopOrderFulfillmentStatus.PENDING, ShopOrderFulfillmentMessages.ASSESSMENT_PENDING_PHASE3);
        }
        return new FulfillmentOutcome(
                ShopOrderFulfillmentStatus.SKIPPED, ShopOrderFulfillmentMessages.UNKNOWN_CATEGORY_SKIPPED);
    }

    private FulfillmentOutcome invokeConsultationHook(
            String tenantId,
            ShopClientOrder order,
            ShopClientOrderLine line,
            String skuCode,
            Long mappingId) {
        try {
            consultationFulfillmentHook.onConsultationPackagePaid(ShopConsultationFulfillmentContext.builder()
                    .tenantId(tenantId)
                    .orderPublicId(order.getPublicId())
                    .clientUserId(order.getClientId())
                    .skuCode(skuCode)
                    .lineTotalMinor(line.getLineTotalMinor())
                    .mappingId(mappingId)
                    .build());
            return new FulfillmentOutcome(
                    ShopOrderFulfillmentStatus.COMPLETED, ShopOrderFulfillmentMessages.CONSULTATION_ERP_COMPLETED);
        } catch (Exception e) {
            log.error(
                    "Consultation fulfillment hook failed (order remains PAID): tenantId={}, orderPublicId={},"
                            + " skuCode={}, mappingId={}, error={}",
                    tenantId,
                    order.getPublicId(),
                    skuCode,
                    mappingId,
                    e.getMessage(),
                    e);
            return new FulfillmentOutcome(
                    ShopOrderFulfillmentStatus.COMPLETED, ShopOrderFulfillmentMessages.CONSULTATION_ERP_SYNC_FAILED);
        }
    }

    private static String resolveCategory(ShopCatalogSku sku) {
        if (sku == null || !StringUtils.hasText(sku.getCatalogCategory())) {
            return ShopCatalogCategory.CONSULTATION;
        }
        return sku.getCatalogCategory().trim().toUpperCase();
    }

    private record FulfillmentOutcome(String status, String message) {
    }
}
