package com.coresolution.consultation.service.impl;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import com.coresolution.consultation.constant.MappingStatusConstants;
import com.coresolution.consultation.constant.ShopCatalogCategory;
import com.coresolution.consultation.constant.ShopCheckoutConstants;
import com.coresolution.consultation.constant.ShopOrderFulfillmentMessages;
import com.coresolution.consultation.constant.ShopOrderFulfillmentStatus;
import com.coresolution.consultation.constant.ShopSessionCountConstants;
import com.coresolution.consultation.dto.shop.ShopConsultationFulfillmentContext;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ShopCatalogSku;
import com.coresolution.consultation.entity.ShopClientOrder;
import com.coresolution.consultation.entity.ShopClientOrderLine;
import com.coresolution.consultation.entity.ShopOrderFulfillmentEvent;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ShopClientOrderLineRepository;
import com.coresolution.consultation.repository.ShopOrderFulfillmentEventRepository;
import com.coresolution.consultation.service.ShopNotificationHelper;
import com.coresolution.consultation.service.ShopOrderFulfillmentService;
import com.coresolution.consultation.service.shop.ShopConsultationFulfillmentHook;
import com.coresolution.core.util.StatusCodeHelper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * PAID 주문 이행 이벤트 기록 — CONSULTATION 회기 가산·ERP 훅, ASSESSMENT PENDING.
 * 전액 환불 시 COMPLETED 상담 이행 회기 원복·매핑 paymentStatus=REFUNDED(멱등).
 *
 * <p>CONSULTATION 훅 실패 시 이벤트 상태 {@link ShopOrderFulfillmentStatus#FAILED}(재시도 가능).
 * 성공(COMPLETED/PENDING/SKIPPED/REVERSED)만 멱등 스킵하고, FAILED 라인은 재시도한다.</p>
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
    private final StatusCodeHelper statusCodeHelper;

    @Override
    @Transactional
    public void fulfillPaidOrder(String tenantId, ShopClientOrder order) {
        String orderPublicId = order.getPublicId();
        String fulfillKey = ShopCheckoutConstants.orderFulfillKey(orderPublicId);
        List<ShopOrderFulfillmentEvent> existingEvents =
                fulfillmentEventRepository.findByTenantIdAndOrderPublicIdAndIsDeletedFalseOrderBySkuCodeAsc(
                        tenantId, orderPublicId);
        if (!existingEvents.isEmpty() && isFullyTerminalSuccess(existingEvents)) {
            log.debug(
                    "Fulfillment idempotent skip (all terminal success): tenantId={}, orderPublicId={}, key={}",
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

        Map<String, ShopOrderFulfillmentEvent> eventsBySku = indexEventsBySku(existingEvents);
        for (ShopClientOrderLine line : lines) {
            String skuCode = line.getSkuCodeSnapshot();
            ShopOrderFulfillmentEvent existing = skuCode != null ? eventsBySku.get(skuCode) : null;
            if (existing != null && isTerminalSuccessStatus(existing.getStatus())) {
                continue;
            }
            recordLineFulfillment(tenantId, order, line, existing);
        }
        log.info(
                "Order fulfillment recorded: tenantId={}, orderPublicId={}, lineCount={}, key={}",
                tenantId,
                orderPublicId,
                lines.size(),
                fulfillKey);
    }

    @Override
    @Transactional
    public void reversePaidOrderFulfillment(String tenantId, ShopClientOrder order) {
        String orderPublicId = order.getPublicId();
        List<ShopClientOrderLine> lines =
                shopClientOrderLineRepository.findByClientOrder_IdAndIsDeletedFalseOrderByLineNoAsc(
                        order.getId());
        List<ShopOrderFulfillmentEvent> events =
                fulfillmentEventRepository.findByTenantIdAndOrderPublicIdAndIsDeletedFalseOrderBySkuCodeAsc(
                        tenantId, orderPublicId);

        Set<Long> mappingIdsMarkedRefunded = new HashSet<>();
        int reversedCount = 0;

        for (ShopOrderFulfillmentEvent event : events) {
            ShopClientOrderLine line = findLineBySku(lines, event.getSkuCode());
            Long mappingId = line != null ? line.getConsultantClientMappingId() : null;
            boolean consultation = ShopCatalogCategory.CONSULTATION.equals(event.getCategory());
            boolean alreadyReversed = ShopOrderFulfillmentStatus.REVERSED.equals(event.getStatus());

            if (alreadyReversed) {
                // 멱등 재호출·과거 환불 수리: 이벤트는 유지, 매핑 paymentStatus만 보강
                if (mappingId != null) {
                    markMappingPaymentRefunded(tenantId, mappingId, mappingIdsMarkedRefunded);
                }
                continue;
            }

            if (consultation && ShopOrderFulfillmentStatus.COMPLETED.equals(event.getStatus())) {
                if (mappingId != null) {
                    int sessionsToReverse = resolveSessionsToGrant(line);
                    reverseSessionsOnMapping(tenantId, mappingId, sessionsToReverse, mappingIdsMarkedRefunded);
                }
            } else if (mappingId != null) {
                markMappingPaymentRefunded(tenantId, mappingId, mappingIdsMarkedRefunded);
            }

            // 전액 환불 SSOT: COMPLETED/PENDING/SKIPPED/FAILED 모두 REVERSED (카테고리 무관 — COMPLETED 잔존 방지)
            event.setStatus(ShopOrderFulfillmentStatus.REVERSED);
            event.setMessage(ShopOrderFulfillmentMessages.CONSULTATION_SESSIONS_REVERSED);
            fulfillmentEventRepository.save(event);
            reversedCount++;
        }

        // 벨트: 이벤트 미스·SKU 불일치 시에도 라인 mappingId 로 paymentStatus REFUNDED
        for (ShopClientOrderLine line : lines) {
            Long mappingId = line.getConsultantClientMappingId();
            if (mappingId != null) {
                markMappingPaymentRefunded(tenantId, mappingId, mappingIdsMarkedRefunded);
            }
        }

        if (events.isEmpty()) {
            log.debug(
                    "Fulfillment reverse — no events (mapping paymentStatus still applied): "
                            + "tenantId={}, orderPublicId={}, mappingMarked={}",
                    tenantId,
                    orderPublicId,
                    mappingIdsMarkedRefunded.size());
        }
        log.info(
                "Order fulfillment reverse done: tenantId={}, orderPublicId={}, reversedLines={}, mappingRefunded={}",
                tenantId,
                orderPublicId,
                reversedCount,
                mappingIdsMarkedRefunded.size());
    }

    /**
     * 회기 원복 후 매핑 paymentStatus=REFUNDED 저장. paymentAmount는 유지(이력 SSOT).
     *
     * @param tenantId 테넌트 ID
     * @param mappingId 매핑 ID
     * @param sessionsToReverse 원복 회기 수
     * @param mappingIdsMarkedRefunded 이미 환불 표기한 매핑 ID 집합
     */
    private void reverseSessionsOnMapping(
            String tenantId,
            Long mappingId,
            int sessionsToReverse,
            Set<Long> mappingIdsMarkedRefunded) {
        ConsultantClientMapping mapping = consultantClientMappingRepository
                .findByTenantIdAndId(tenantId, mappingId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "매핑을 찾을 수 없습니다: mappingId=" + mappingId));
        if (sessionsToReverse >= ShopSessionCountConstants.MIN_SESSION_COUNT) {
            mapping.reverseGrantedSessions(sessionsToReverse);
        }
        applyRefundedPaymentStatus(mapping);
        consultantClientMappingRepository.save(mapping);
        mappingIdsMarkedRefunded.add(mappingId);
        log.info(
                "Shop session reverse applied: tenantId={}, mappingId={}, sessionsReversed={}, total={}, "
                        + "remaining={}, paymentStatus={}",
                tenantId,
                mappingId,
                sessionsToReverse,
                mapping.getTotalSessions(),
                mapping.getRemainingSessions(),
                mapping.getPaymentStatus());
    }

    /**
     * 매핑 paymentStatus=REFUNDED 저장(멱등). paymentAmount는 변경하지 않는다.
     *
     * @param tenantId 테넌트 ID
     * @param mappingId 매핑 ID
     * @param mappingIdsMarkedRefunded 이미 처리한 매핑 ID
     */
    private void markMappingPaymentRefunded(
            String tenantId, Long mappingId, Set<Long> mappingIdsMarkedRefunded) {
        if (mappingId == null || mappingIdsMarkedRefunded.contains(mappingId)) {
            return;
        }
        ConsultantClientMapping mapping = consultantClientMappingRepository
                .findByTenantIdAndId(tenantId, mappingId)
                .orElse(null);
        if (mapping == null) {
            log.warn("매핑 paymentStatus REFUNDED 스킵 — 매핑 없음: tenantId={}, mappingId={}", tenantId, mappingId);
            return;
        }
        if (mapping.getPaymentStatus() == ConsultantClientMapping.PaymentStatus.REFUNDED) {
            mappingIdsMarkedRefunded.add(mappingId);
            return;
        }
        applyRefundedPaymentStatus(mapping);
        consultantClientMappingRepository.save(mapping);
        mappingIdsMarkedRefunded.add(mappingId);
        log.info(
                "Shop mapping paymentStatus REFUNDED: tenantId={}, mappingId={}, paymentAmount={}",
                tenantId,
                mappingId,
                mapping.getPaymentAmount());
    }

    /**
     * AdminServiceImpl 매핑 취소와 동일 SSOT — 공통코드 PAYMENT_STATUS.REFUNDED.
     *
     * @param mapping 매핑 엔티티
     */
    private void applyRefundedPaymentStatus(ConsultantClientMapping mapping) {
        String refundedPaymentStatus = statusCodeHelper.getStatusCodeValue(
                MappingStatusConstants.PAYMENT_STATUS_GROUP, MappingStatusConstants.REFUNDED);
        if (!StringUtils.hasText(refundedPaymentStatus)) {
            refundedPaymentStatus = MappingStatusConstants.REFUNDED;
        }
        mapping.setPaymentStatus(ConsultantClientMapping.PaymentStatus.valueOf(refundedPaymentStatus));
    }

    private static ShopClientOrderLine findLineBySku(List<ShopClientOrderLine> lines, String skuCode) {
        if (skuCode == null) {
            return null;
        }
        for (ShopClientOrderLine line : lines) {
            if (skuCode.equals(line.getSkuCodeSnapshot())) {
                return line;
            }
        }
        return null;
    }

    private void recordLineFulfillment(
            String tenantId,
            ShopClientOrder order,
            ShopClientOrderLine line,
            ShopOrderFulfillmentEvent existingEvent) {
        String category = resolveCategory(line.getSku());
        String skuCode = line.getSkuCodeSnapshot();
        FulfillmentOutcome outcome = resolveOutcome(tenantId, order, line, category, skuCode);

        ShopOrderFulfillmentEvent event = existingEvent;
        if (event == null) {
            event = ShopOrderFulfillmentEvent.builder()
                    .orderPublicId(order.getPublicId())
                    .skuCode(skuCode)
                    .category(category)
                    .status(outcome.status())
                    .message(outcome.message())
                    .build();
            event.setTenantId(tenantId);
        } else {
            event.setStatus(outcome.status());
            event.setMessage(outcome.message());
            if (!StringUtils.hasText(event.getCategory())) {
                event.setCategory(category);
            }
        }
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
                        ShopOrderFulfillmentStatus.FAILED,
                        ShopOrderFulfillmentMessages.CONSULTATION_MAPPING_MISSING_FAILED);
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
            int sessionsToGrant = resolveSessionsToGrant(line);
            consultationFulfillmentHook.onConsultationPackagePaid(ShopConsultationFulfillmentContext.builder()
                    .tenantId(tenantId)
                    .orderPublicId(order.getPublicId())
                    .clientUserId(order.getClientId())
                    .skuCode(skuCode)
                    .lineTotalMinor(line.getLineTotalMinor())
                    .mappingId(mappingId)
                    .sessionsToGrant(sessionsToGrant)
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
                    ShopOrderFulfillmentStatus.FAILED, ShopOrderFulfillmentMessages.CONSULTATION_ERP_SYNC_FAILED);
        }
    }

    private static String resolveCategory(ShopCatalogSku sku) {
        if (sku == null || !StringUtils.hasText(sku.getCatalogCategory())) {
            return ShopCatalogCategory.CONSULTATION;
        }
        return sku.getCatalogCategory().trim().toUpperCase();
    }

    /**
     * 라인 스냅샷 우선, 없으면 SKU.sessionCount × quantity.
     *
     * @param line 주문 라인
     * @return 매핑 가산 회기수
     */
    private static int resolveSessionsToGrant(ShopClientOrderLine line) {
        int perUnit;
        Integer snapshot = line.getSessionCountSnapshot();
        if (snapshot != null && snapshot >= ShopSessionCountConstants.MIN_SESSION_COUNT) {
            perUnit = snapshot;
        } else if (line.getSku() != null
                && line.getSku().getSessionCount() != null
                && line.getSku().getSessionCount() >= ShopSessionCountConstants.MIN_SESSION_COUNT) {
            perUnit = line.getSku().getSessionCount();
        } else {
            perUnit = ShopSessionCountConstants.MIN_SESSION_COUNT;
        }
        int quantity = line.getQuantity() != null ? line.getQuantity() : ShopSessionCountConstants.MIN_SESSION_COUNT;
        return ShopSessionCountConstants.resolveSessionsToGrant(perUnit, quantity);
    }

    /**
     * 기존 이벤트가 모두 성공 단말 상태인지 (멱등 스킵 조건).
     *
     * @param events 주문 이행 이벤트 목록
     * @return 전부 성공 단말이면 true
     */
    private static boolean isFullyTerminalSuccess(List<ShopOrderFulfillmentEvent> events) {
        for (ShopOrderFulfillmentEvent event : events) {
            if (!isTerminalSuccessStatus(event.getStatus())) {
                return false;
            }
        }
        return true;
    }

    /**
     * 재시도하지 않는 성공/단말 상태. FAILED 만 재시도 대상.
     *
     * @param status 이벤트 상태
     * @return 성공 단말이면 true
     */
    private static boolean isTerminalSuccessStatus(String status) {
        return ShopOrderFulfillmentStatus.COMPLETED.equals(status)
                || ShopOrderFulfillmentStatus.PENDING.equals(status)
                || ShopOrderFulfillmentStatus.SKIPPED.equals(status)
                || ShopOrderFulfillmentStatus.REVERSED.equals(status);
    }

    private static Map<String, ShopOrderFulfillmentEvent> indexEventsBySku(
            List<ShopOrderFulfillmentEvent> events) {
        Map<String, ShopOrderFulfillmentEvent> bySku = new HashMap<>();
        for (ShopOrderFulfillmentEvent event : events) {
            if (event.getSkuCode() != null) {
                bySku.put(event.getSkuCode(), event);
            }
        }
        return bySku;
    }

    private record FulfillmentOutcome(String status, String message) {
    }
}
