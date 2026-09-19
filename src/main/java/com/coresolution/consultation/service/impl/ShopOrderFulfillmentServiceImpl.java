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
import com.coresolution.consultation.constant.ShopClientOrderStatus;
import com.coresolution.consultation.constant.ShopOrderFulfillmentMessages;
import com.coresolution.consultation.constant.ShopOrderFulfillmentRetryConstants;
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
import com.coresolution.consultation.repository.ShopClientOrderRepository;
import com.coresolution.consultation.repository.ShopOrderFulfillmentEventRepository;
import com.coresolution.consultation.service.AdminService;
import com.coresolution.consultation.service.ShopNotificationHelper;
import com.coresolution.consultation.service.ShopOrderFulfillmentService;
import com.coresolution.consultation.service.shop.ShopConsultationFulfillmentHook;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.util.StatusCodeHelper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.util.StringUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * PAID 주문 이행 이벤트 기록 — CONSULTATION 회기 가산·ERP 훅, ASSESSMENT PENDING.
 * 전액 환불 시 COMPLETED 상담 이행 회기 원복·매핑 paymentStatus=REFUNDED(멱등).
 *
 * <p>CONSULTATION 은 두 개의 {@code PROPAGATION_REQUIRES_NEW} 로 격리한다.
 * #1 회기 활성화({@code onConsultationPackagePaid}), #2 입금 INCOME ensure.
 * #1 실패 시 회기·부모 PAID 모두 롤백되지 않은 채 FAILED.
 * #1 성공·#2 실패 시 회기는 커밋된 채 INCOME 만 FAILED(재시도). 부모 PAID TX 는 rollback-only 가 되지 않는다.
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
    private final ShopClientOrderRepository shopClientOrderRepository;
    private final ShopConsultationFulfillmentHook consultationFulfillmentHook;
    private final ShopNotificationHelper shopNotificationHelper;
    private final ConsultantClientMappingRepository consultantClientMappingRepository;
    private final StatusCodeHelper statusCodeHelper;
    private final AdminService adminService;
    /** CONSULTATION 훅(confirmAndActivate) 격리용 — 부모 PAID/fulfill TX rollback-only 방지 */
    private final PlatformTransactionManager transactionManager;

    /** FAILED 메시지에 붙이는 root-cause 최대 길이 */
    private static final int FAILURE_CAUSE_MAX_LENGTH = 180;

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
    public void retryFailedFulfillment(String tenantId, ShopClientOrder order, boolean clientOneShot) {
        if (!StringUtils.hasText(tenantId)) {
            throw new IllegalArgumentException(ShopOrderFulfillmentRetryConstants.MSG_ORDER_NOT_FOUND);
        }
        if (order == null) {
            throw new IllegalArgumentException(ShopOrderFulfillmentRetryConstants.MSG_ORDER_NOT_FOUND);
        }
        if (order.getStatus() != ShopClientOrderStatus.PAID) {
            throw new IllegalStateException(ShopOrderFulfillmentRetryConstants.MSG_ORDER_NOT_PAID);
        }
        String orderPublicId = order.getPublicId();
        List<ShopOrderFulfillmentEvent> events =
                fulfillmentEventRepository.findByTenantIdAndOrderPublicIdAndIsDeletedFalseOrderBySkuCodeAsc(
                        tenantId, orderPublicId);
        boolean hasRetryable = false;
        for (ShopOrderFulfillmentEvent event : events) {
            if (ShopOrderFulfillmentRetryConstants.isRetryableFailed(event.getStatus(), event.getMessage())) {
                hasRetryable = true;
                break;
            }
        }
        if (!hasRetryable) {
            // 성공 소진 후 2회째(COMPLETED + flag true) vs 재시도 가능 실패 없음
            if (clientOneShot && Boolean.TRUE.equals(order.getClientFulfillRetryAttempted())) {
                throw new IllegalStateException(ShopOrderFulfillmentRetryConstants.MSG_CLIENT_RETRY_ALREADY_USED);
            }
            throw new IllegalStateException(ShopOrderFulfillmentRetryConstants.MSG_NO_RETRYABLE_FULFILLMENT);
        }
        // sticky true(#1131 클릭 시 설정) + retryable FAILED 잔존 → heal 후 진행 (throw 금지)
        if (clientOneShot && Boolean.TRUE.equals(order.getClientFulfillRetryAttempted())) {
            order.setClientFulfillRetryAttempted(Boolean.FALSE);
            shopClientOrderRepository.save(order);
        }
        log.info(
                "Fulfillment retry requested: tenantId={}, orderPublicId={}, status={}, clientOneShot={}",
                tenantId,
                orderPublicId,
                order.getStatus(),
                clientOneShot);
        // 내담자 1회 플래그는 클릭/시도가 아니라 "재시도 가능 FAILED 가 해소된 성공 재이행" 에만 설정한다.
        // Anti double-tap 은 FE retrying + preventDoubleClick 이 담당한다.
        fulfillPaidOrder(tenantId, order);
        if (clientOneShot) {
            List<ShopOrderFulfillmentEvent> afterEvents =
                    fulfillmentEventRepository.findByTenantIdAndOrderPublicIdAndIsDeletedFalseOrderBySkuCodeAsc(
                            tenantId, orderPublicId);
            boolean stillRetryable = false;
            for (ShopOrderFulfillmentEvent event : afterEvents) {
                if (ShopOrderFulfillmentRetryConstants.isRetryableFailed(event.getStatus(), event.getMessage())) {
                    stillRetryable = true;
                    break;
                }
            }
            if (stillRetryable) {
                order.setClientFulfillRetryAttempted(Boolean.FALSE);
            } else {
                order.setClientFulfillRetryAttempted(Boolean.TRUE);
                shopClientOrderRepository.save(order);
            }
        }
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
        Set<Long> mappingIdsErpRefundQueued = new HashSet<>();
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
                    enqueueShopMappingErpRefund(tenantId, mappingId, mappingIdsErpRefundQueued);
                }
                continue;
            }

            if (consultation && ShopOrderFulfillmentStatus.COMPLETED.equals(event.getStatus())) {
                if (mappingId != null) {
                    int sessionsToReverse = resolveSessionsToGrant(line);
                    reverseSessionsOnMapping(tenantId, mappingId, sessionsToReverse, mappingIdsMarkedRefunded);
                    enqueueShopMappingErpRefund(tenantId, mappingId, mappingIdsErpRefundQueued);
                }
            } else if (mappingId != null) {
                markMappingPaymentRefunded(tenantId, mappingId, mappingIdsMarkedRefunded);
                if (consultation) {
                    enqueueShopMappingErpRefund(tenantId, mappingId, mappingIdsErpRefundQueued);
                }
            }

            // 전액 환불 SSOT: COMPLETED/PENDING/SKIPPED/FAILED 모두 REVERSED (카테고리 무관 — COMPLETED 잔존 방지)
            event.setStatus(ShopOrderFulfillmentStatus.REVERSED);
            event.setMessage(ShopOrderFulfillmentMessages.CONSULTATION_SESSIONS_REVERSED);
            fulfillmentEventRepository.save(event);
            reversedCount++;
        }

        // 벨트: 이벤트 미스·SKU 불일치 시에도 라인 mappingId 로 paymentStatus REFUNDED + ERP 환불
        for (ShopClientOrderLine line : lines) {
            Long mappingId = line.getConsultantClientMappingId();
            if (mappingId != null) {
                markMappingPaymentRefunded(tenantId, mappingId, mappingIdsMarkedRefunded);
                if (isConsultationOrderLine(line)) {
                    enqueueShopMappingErpRefund(tenantId, mappingId, mappingIdsErpRefundQueued);
                }
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
                "Order fulfillment reverse done: tenantId={}, orderPublicId={}, reversedLines={}, "
                        + "mappingRefunded={}, erpRefundQueued={}",
                tenantId,
                orderPublicId,
                reversedCount,
                mappingIdsMarkedRefunded.size(),
                mappingIdsErpRefundQueued.size());
    }

    /**
     * 상담 라인 매핑에 대해 Path B ERP 환불 EXPENSE 생성(매핑당 1회, 멱등은 AdminService 측).
     * 실패해도 회기 원복은 유지한다.
     *
     * @param tenantId 테넌트 ID
     * @param mappingId 매핑 ID
     * @param mappingIdsErpRefundQueued 이미 ERP 환불 호출한 매핑 ID
     */
    private void enqueueShopMappingErpRefund(
            String tenantId, Long mappingId, Set<Long> mappingIdsErpRefundQueued) {
        if (mappingId == null || mappingIdsErpRefundQueued.contains(mappingId)) {
            return;
        }
        mappingIdsErpRefundQueued.add(mappingId);
        try {
            adminService.createShopOrderMappingRefundExpense(
                    tenantId, mappingId, ShopOrderFulfillmentMessages.SHOP_ORDER_FULL_REFUND_ERP_REASON);
        } catch (Exception ex) {
            log.error(
                    "Shopping order ERP refund expense failed (session reverse kept): "
                            + "tenantId={}, mappingId={}, error={}",
                    tenantId,
                    mappingId,
                    ex.getMessage(),
                    ex);
        }
    }

    /**
     * 주문 라인이 CONSULTATION 카테고리인지 (SKU 스냅샷 기준).
     *
     * @param line 주문 라인
     * @return 상담 패키지면 true
     */
    private static boolean isConsultationOrderLine(ShopClientOrderLine line) {
        return ShopCatalogCategory.CONSULTATION.equals(resolveCategory(line.getSku()));
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

    /**
     * CONSULTATION 회기와 입금 INCOME 을 각각 {@code PROPAGATION_REQUIRES_NEW} 로 실행한다.
     * <p>
     * #1 {@link ShopConsultationFulfillmentHook#onConsultationPackagePaid} — 회기만.
     * 실패 시 {@link ShopOrderFulfillmentMessages#CONSULTATION_ERP_SYNC_FAILED}.
     * #2 {@link AdminService#ensureConsultationDepositIncome} — 동기 입금 INCOME.
     * 전표 존재 판정은 입금 REQUIRES_NEW 안에서만 한다. 이 메서드의 부모 TX 에서
     * 커밋된 INCOME 을 다시 읽으면 REPEATABLE READ 로 false-fail 이 된다.
     * #1 이 커밋된 뒤 #2 만 실패하면 회기는 유지하고
     * {@link ShopOrderFulfillmentMessages#CONSULTATION_INCOME_SYNC_FAILED} 를 반환한다.
     * 두 예외 모두 이 메서드에서 흡수되어 부모 fulfill/PAID TX 를 rollback-only 로 만들지 않는다.
     * </p>
     *
     * @param tenantId 테넌트 ID
     * @param order 주문
     * @param line 주문 라인
     * @param skuCode SKU 코드
     * @param mappingId 매핑 ID
     * @return 이행 결과
     */
    private FulfillmentOutcome invokeConsultationHook(
            String tenantId,
            ShopClientOrder order,
            ShopClientOrderLine line,
            String skuCode,
            Long mappingId) {
        try {
            runConsultationHookInNewTransaction(tenantId, () -> {
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
            });
        } catch (Exception e) {
            log.error(
                    "Consultation session hook failed in REQUIRES_NEW "
                            + "(fulfillment FAILED; parent PAID/fulfill TX not rollback-only): "
                            + "tenantId={}, orderPublicId={}, skuCode={}, mappingId={}, error={}",
                    tenantId,
                    order.getPublicId(),
                    skuCode,
                    mappingId,
                    e.getMessage(),
                    e);
            return new FulfillmentOutcome(
                    ShopOrderFulfillmentStatus.FAILED,
                    appendSanitizedFailureCause(
                            ShopOrderFulfillmentMessages.CONSULTATION_ERP_SYNC_FAILED, e));
        }

        try {
            runConsultationHookInNewTransaction(tenantId, () -> ensureDepositIncomeInIsolation(tenantId, mappingId));
        } catch (Exception e) {
            log.error(
                    "Consultation deposit INCOME ensure failed in REQUIRES_NEW "
                            + "(sessions remain committed; fulfillment FAILED, retryable; "
                            + "parent PAID/fulfill TX not rollback-only): "
                            + "tenantId={}, orderPublicId={}, skuCode={}, mappingId={}, error={}",
                    tenantId,
                    order.getPublicId(),
                    skuCode,
                    mappingId,
                    e.getMessage(),
                    e);
            return new FulfillmentOutcome(
                    ShopOrderFulfillmentStatus.FAILED,
                    appendSanitizedFailureCause(
                            ShopOrderFulfillmentMessages.CONSULTATION_INCOME_SYNC_FAILED, e));
        }

        return new FulfillmentOutcome(
                ShopOrderFulfillmentStatus.COMPLETED, ShopOrderFulfillmentMessages.CONSULTATION_ERP_COMPLETED);
    }

    /**
     * 매핑 입금 INCOME SSOT 를 현재(이미 REQUIRES_NEW 인) 트랜잭션에서 보장한다.
     *
     * @param tenantId 테넌트 ID
     * @param mappingId 매핑 ID
     */
    private void ensureDepositIncomeInIsolation(String tenantId, Long mappingId) {
        ConsultantClientMapping mapping = consultantClientMappingRepository
                .findByTenantIdAndId(tenantId, mappingId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "매핑을 찾을 수 없습니다: mappingId=" + mappingId));
        adminService.ensureConsultationDepositIncome(mapping);
    }

    /**
     * AdminServiceImpl.runInNewTransaction 과 동일 — REQUIRES_NEW + TenantContextHolder save/restore.
     * 예외는 상위로 전파하여 호출측에서 FAILED outcome 을 반환할 수 있게 한다.
     *
     * @param tenantId 콜백 내 테넌트 ID (null/blank 이면 설정 생략)
     * @param action 실행할 작업
     */
    private void runConsultationHookInNewTransaction(String tenantId, Runnable action) {
        TransactionTemplate template = new TransactionTemplate(transactionManager);
        template.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        template.executeWithoutResult(status -> {
            String previousTenantId = TenantContextHolder.peekTenantId();
            if (tenantId != null && !tenantId.isEmpty()) {
                TenantContextHolder.setTenantId(tenantId);
            }
            try {
                action.run();
            } catch (RuntimeException ex) {
                status.setRollbackOnly();
                throw ex;
            } finally {
                TenantContextHolder.setTenantIdOrClear(previousTenantId);
            }
        });
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

    /**
     * FAILED 메시지 상수에 짧은 root-cause 를 붙여 ops 가 원인을 볼 수 있게 한다.
     * {@link ShopOrderFulfillmentRetryConstants#isRetryableFailed} 가 상수 prefix 의
     * {@code retryable} 을 계속 인식하도록 상수 뒤에만 덧붙인다.
     *
     * @param constantMessage 이행 FAILED 상수 메시지
     * @param error 원본 예외
     * @return 상수 + 선택적 {@code : } + sanitised cause
     * @author MindGarden
     * @since 2026-09-19
     */
    private static String appendSanitizedFailureCause(String constantMessage, Exception error) {
        String cause = sanitizeRootCauseMessage(error);
        if (!StringUtils.hasText(cause)) {
            return constantMessage;
        }
        return constantMessage + ": " + cause;
    }

    /**
     * 예외 root-cause 메시지를 짧게 정리한다 (비밀값·과도한 길이 제거).
     *
     * @param error 예외
     * @return sanitised 메시지 (비어 있을 수 있음)
     */
    private static String sanitizeRootCauseMessage(Exception error) {
        if (error == null) {
            return "";
        }
        Throwable root = error;
        while (root.getCause() != null && root.getCause() != root) {
            root = root.getCause();
        }
        String message = root.getMessage();
        if (!StringUtils.hasText(message)) {
            message = root.getClass().getSimpleName();
        }
        String sanitized = message.replaceAll(
                "(?i)(password|passwd|token|secret|authorization|api[_-]?key)\\s*[=:]\\s*\\S+",
                "$1=[redacted]");
        sanitized = sanitized.replaceAll("\\s+", " ").trim();
        if (sanitized.length() > FAILURE_CAUSE_MAX_LENGTH) {
            return sanitized.substring(0, FAILURE_CAUSE_MAX_LENGTH);
        }
        return sanitized;
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
