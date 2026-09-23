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
import com.coresolution.consultation.dto.shop.ShopOrderIncomeClaim;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.Payment;
import com.coresolution.consultation.entity.ShopCatalogSku;
import com.coresolution.consultation.entity.ShopClientOrder;
import com.coresolution.consultation.entity.ShopClientOrderLine;
import com.coresolution.consultation.entity.ShopOrderFulfillmentEvent;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.PaymentRepository;
import com.coresolution.consultation.repository.ShopClientOrderLineRepository;
import com.coresolution.consultation.repository.ShopClientOrderRepository;
import com.coresolution.consultation.repository.ShopOrderFulfillmentEventRepository;
import com.coresolution.consultation.service.AdminService;
import com.coresolution.consultation.service.ShopNotificationHelper;
import com.coresolution.consultation.service.ShopOrderFulfillmentService;
import com.coresolution.consultation.service.shop.ShopConsultationFulfillmentHook;
import com.coresolution.consultation.service.shop.impl.ErpShopConsultationFulfillmentHook;
import com.coresolution.consultation.util.MappingAssignmentStatus;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.util.StatusCodeHelper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.util.StringUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * PAID 주문 이행 이벤트 기록 — CONSULTATION 회기 가산·ERP 훅, ASSESSMENT PENDING.
 * 전액 환불·결제 취소 시 상담 회기 원복(COMPLETED 및 회기 가산된 FAILED)·매핑 paymentStatus=REFUNDED(멱등).
 *
 * <p>CONSULTATION 은 하나의 {@code PROPAGATION_REQUIRES_NEW} 원자 단위로 회기 활성화와
 * 입금 INCOME ensure 를 함께 수행한다. INCOME 실패 시 회기도 롤백되어 반쪽 성공(재이행 필수)을
 * 만들지 않는다. 부모 PAID TX 는 rollback-only 가 되지 않는다.
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
    private final PaymentRepository paymentRepository;
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
            // COMPLETED 멱등이어도 posted INCOME 합≠cashDue 이면 ensure (TX#2 mid-state 복구)
            healConsultationDepositIncomeQuietly(tenantId, order);
            log.debug(
                    "Fulfillment idempotent skip (all terminal success; INCOME heal attempted): "
                            + "tenantId={}, orderPublicId={}, key={}",
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
                // 라인별 COMPLETED 스킵 시에도 상담 INCOME SSOT heal (실패 시 COMPLETED→FAILED)
                if (isConsultationOrderLine(line) && line.getConsultantClientMappingId() != null) {
                    ShopOrderIncomeClaim claim = buildIncomeClaim(tenantId, order, line);
                    healMappingDepositIncomeOrDemote(
                            tenantId,
                            order.getPublicId(),
                            line.getConsultantClientMappingId(),
                            existing,
                            claim);
                }
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
            // PAID + fulfillmentEvents=[] → 이행이 한 번도 영속되지 않음. retry = first attempt.
            // healCompletedConsultationMappingForHome 은 empty 에서 false — fulfill 로만 처리.
            if (events.isEmpty()) {
                executeFulfillRetryAttempt(tenantId, order, clientOneShot, orderPublicId);
                return;
            }
            // 내담자 1회 소진 후 2회째는 heal 보다 먼저 거부 (COMPLETED heal 이 플래그를 우회하지 않게)
            if (clientOneShot && Boolean.TRUE.equals(order.getClientFulfillRetryAttempted())) {
                throw new IllegalStateException(ShopOrderFulfillmentRetryConstants.MSG_CLIENT_RETRY_ALREADY_USED);
            }
            // COMPLETED+ACTIVE+rem=0(Path B 회기 미부여) 또는
            // PAYMENT_CONFIRMED/DEPOSIT_*+rem>0(홈 비가독) → ACTIVE heal — 1회
            // rem>0+stale packagePrice → sync + ensureConsultationDepositIncome (ERP INCOME 보정)
            if (healCompletedConsultationMappingForHome(tenantId, order, events)) {
                log.info(
                        "Fulfillment COMPLETED home-readable heal done: tenantId={}, orderPublicId={}",
                        tenantId,
                        orderPublicId);
                return;
            }
            throw new IllegalStateException(ShopOrderFulfillmentRetryConstants.MSG_NO_RETRYABLE_FULFILLMENT);
        }
        executeFulfillRetryAttempt(tenantId, order, clientOneShot, orderPublicId);
    }

    /**
     * retryable FAILED 또는 empty-events 첫 시도 공통 경로.
     * sticky true(#1131 클릭 시 설정) 이면 heal 후 진행 (throw 금지).
     * 내담자 1회 플래그는 "재시도 가능 FAILED 가 해소된 성공 재이행" 에만 설정한다.
     *
     * @param tenantId 테넌트 ID
     * @param order PAID 주문
     * @param clientOneShot 내담자 1회 제한 여부
     * @param orderPublicId 주문 publicId
     */
    private void executeFulfillRetryAttempt(
            String tenantId, ShopClientOrder order, boolean clientOneShot, String orderPublicId) {
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

        // reverse 전 라인 SSOT 캡처 — reverse 후 mapping sessions=0·packageName stale 금지
        Map<Long, RefundExpenseDisplayCapture> refundDisplayByMappingId = captureRefundDisplayBeforeReverse(lines);

        Set<Long> mappingIdsMarkedRefunded = new HashSet<>();
        Set<Long> mappingIdsErpRefundQueued = new HashSet<>();
        int reversedCount = 0;
        // never-fulfilled(events empty·COMPLETED/INCOME 부여 이력 없음) — 팬텀 INCOME repair+EXPENSE 금지
        boolean orderHasConsultationErpRefundEvidence =
                hasConsultationErpRefundEvidence(events);

        for (ShopOrderFulfillmentEvent event : events) {
            ShopClientOrderLine line = findLineBySku(lines, event.getSkuCode());
            Long mappingId = line != null ? line.getConsultantClientMappingId() : null;
            boolean consultation = ShopCatalogCategory.CONSULTATION.equals(event.getCategory());
            boolean alreadyReversed = ShopOrderFulfillmentStatus.REVERSED.equals(event.getStatus());

            if (alreadyReversed) {
                // 멱등 재호출·과거 환불 수리: 이벤트는 유지, 매핑 paymentStatus만 보강
                if (mappingId != null) {
                    markMappingPaymentRefunded(tenantId, mappingId, mappingIdsMarkedRefunded);
                    if (shouldEnqueueConsultationErpRefund(event)) {
                        enqueueShopMappingErpRefund(
                                tenantId,
                                mappingId,
                                mappingIdsErpRefundQueued,
                                refundDisplayByMappingId.get(mappingId));
                    }
                }
                continue;
            }

            if (consultation && shouldReverseConsultationSessions(event)) {
                if (mappingId != null) {
                    int sessionsToReverse = resolveSessionsToGrant(line);
                    reverseSessionsOnMapping(tenantId, mappingId, sessionsToReverse, mappingIdsMarkedRefunded);
                    enqueueShopMappingErpRefund(
                            tenantId, mappingId, mappingIdsErpRefundQueued, refundDisplayByMappingId.get(mappingId));
                }
            } else if (mappingId != null) {
                markMappingPaymentRefunded(tenantId, mappingId, mappingIdsMarkedRefunded);
                // FAILED(회기 미가산)·PENDING 등 — EXPENSE/repairIncomeFirst 스킵
                if (shouldEnqueueConsultationErpRefund(event)) {
                    enqueueShopMappingErpRefund(
                            tenantId,
                            mappingId,
                            mappingIdsErpRefundQueued,
                            refundDisplayByMappingId.get(mappingId));
                }
            }

            // 전액 환불 SSOT: COMPLETED/PENDING/SKIPPED/FAILED 모두 REVERSED (카테고리 무관 — COMPLETED 잔존 방지)
            event.setStatus(ShopOrderFulfillmentStatus.REVERSED);
            event.setMessage(ShopOrderFulfillmentMessages.CONSULTATION_SESSIONS_REVERSED);
            fulfillmentEventRepository.save(event);
            reversedCount++;
        }

        // 벨트: 이벤트 미스·SKU 불일치 시에도 라인 mappingId 로 paymentStatus REFUNDED.
        // ERP EXPENSE 는 주문에 상담 이행(COMPLETED/INCOME 부여·REVERSED) 증거가 있을 때만.
        // events=[] 이어도 주문 귀속 INCOME 또는 가산 회기 잔존이면 rem 원복 + EXPENSE (팬텀 금지 유지).
        for (ShopClientOrderLine line : lines) {
            Long mappingId = line.getConsultantClientMappingId();
            if (mappingId == null) {
                continue;
            }
            if (events.isEmpty() && isConsultationOrderLine(line)) {
                applyEmptyEventsConsultationRefund(
                        tenantId,
                        orderPublicId,
                        line,
                        mappingId,
                        mappingIdsMarkedRefunded,
                        mappingIdsErpRefundQueued,
                        refundDisplayByMappingId.get(mappingId));
                continue;
            }
            markMappingPaymentRefunded(tenantId, mappingId, mappingIdsMarkedRefunded);
            if (isConsultationOrderLine(line) && orderHasConsultationErpRefundEvidence) {
                enqueueShopMappingErpRefund(
                        tenantId, mappingId, mappingIdsErpRefundQueued, refundDisplayByMappingId.get(mappingId));
            }
        }

        if (events.isEmpty()) {
            log.debug(
                    "Fulfillment reverse — no events (mapping paymentStatus applied; "
                            + "ERP/rem only when fulfill evidence): "
                            + "tenantId={}, orderPublicId={}, mappingMarked={}, erpRefundQueued={}",
                    tenantId,
                    orderPublicId,
                    mappingIdsMarkedRefunded.size(),
                    mappingIdsErpRefundQueued.size());
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

    @Override
    @Transactional
    public void repairConsultationDepositIncome(String tenantId, ShopClientOrder order) {
        if (!StringUtils.hasText(tenantId) || order == null || order.getId() == null) {
            throw new IllegalArgumentException(ShopOrderFulfillmentRetryConstants.MSG_ORDER_NOT_FOUND);
        }
        List<ShopClientOrderLine> lines =
                shopClientOrderLineRepository.findByClientOrder_IdAndIsDeletedFalseOrderByLineNoAsc(
                        order.getId());
        int healed = 0;
        for (ShopClientOrderLine line : lines) {
            if (!isConsultationOrderLine(line) || line.getConsultantClientMappingId() == null) {
                continue;
            }
            ShopOrderIncomeClaim claim = buildIncomeClaim(tenantId, order, line);
            healSingleMappingDepositIncome(tenantId, line.getConsultantClientMappingId(), claim);
            healed++;
        }
        if (healed == 0) {
            throw new IllegalArgumentException(
                    com.coresolution.consultation.constant.ShopAdminOrderConstants
                            .MSG_REPAIR_DEPOSIT_INCOME_NO_CONSULTATION_MAPPING);
        }
        log.info(
                "Repair deposit INCOME done: tenantId={}, orderPublicId={}, mappingCount={}",
                tenantId,
                order.getPublicId(),
                healed);
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void persistRetryableFailedSentinelIfNeeded(
            String tenantId, ShopClientOrder order, Exception cause) {
        if (!StringUtils.hasText(tenantId) || order == null || !StringUtils.hasText(order.getPublicId())) {
            return;
        }
        String orderPublicId = order.getPublicId().trim();
        List<ShopOrderFulfillmentEvent> events =
                fulfillmentEventRepository.findByTenantIdAndOrderPublicIdAndIsDeletedFalseOrderBySkuCodeAsc(
                        tenantId, orderPublicId);
        for (ShopOrderFulfillmentEvent event : events) {
            if (ShopOrderFulfillmentRetryConstants.isRetryableFailed(event.getStatus(), event.getMessage())) {
                log.debug(
                        "afterCommit sentinel 스킵 — retryable FAILED 이미 존재: tenantId={}, orderPublicId={}",
                        tenantId,
                        orderPublicId);
                return;
            }
        }

        String message = appendSanitizedFailureCause(
                ShopOrderFulfillmentMessages.AFTER_COMMIT_FULFILL_FAILED, cause);
        List<ShopClientOrderLine> lines = order.getId() != null
                ? shopClientOrderLineRepository.findByClientOrder_IdAndIsDeletedFalseOrderByLineNoAsc(
                        order.getId())
                : List.of();

        int saved = 0;
        if (events.isEmpty() && !lines.isEmpty()) {
            for (ShopClientOrderLine line : lines) {
                String skuCode = line.getSkuCodeSnapshot();
                if (!StringUtils.hasText(skuCode)) {
                    continue;
                }
                String category = resolveCategory(line.getSku());
                ShopOrderFulfillmentEvent event = ShopOrderFulfillmentEvent.builder()
                        .orderPublicId(orderPublicId)
                        .skuCode(skuCode)
                        .category(category)
                        .status(ShopOrderFulfillmentStatus.FAILED)
                        .message(message)
                        .build();
                event.setTenantId(tenantId);
                fulfillmentEventRepository.save(event);
                saved++;
            }
        }
        if (saved == 0) {
            // 라인 없음·또는 기존 이벤트만 있고 retryable 없음 → 주문 단위 sentinel
            boolean sentinelExists = false;
            for (ShopOrderFulfillmentEvent event : events) {
                if (ShopOrderFulfillmentMessages.AFTER_COMMIT_FAILURE_SENTINEL_SKU.equals(
                        event.getSkuCode())) {
                    sentinelExists = true;
                    event.setStatus(ShopOrderFulfillmentStatus.FAILED);
                    event.setMessage(message);
                    fulfillmentEventRepository.save(event);
                    saved++;
                    break;
                }
            }
            if (!sentinelExists) {
                ShopOrderFulfillmentEvent event = ShopOrderFulfillmentEvent.builder()
                        .orderPublicId(orderPublicId)
                        .skuCode(ShopOrderFulfillmentMessages.AFTER_COMMIT_FAILURE_SENTINEL_SKU)
                        .category(ShopCatalogCategory.CONSULTATION)
                        .status(ShopOrderFulfillmentStatus.FAILED)
                        .message(message)
                        .build();
                event.setTenantId(tenantId);
                fulfillmentEventRepository.save(event);
                saved++;
            }
        }
        log.warn(
                "afterCommit FAILED(retryable) sentinel 영속: tenantId={}, orderPublicId={}, saved={}",
                tenantId,
                orderPublicId,
                saved);
    }

    /**
     * 상담 이행 이벤트에서 회기가 실제로 가산되었는지 — 원복 대상 판정.
     *
     * <p>{@code COMPLETED} 또는 TX#1 회기 가산 후 TX#2 INCOME 만 실패한
     * {@code FAILED}({@link ShopOrderFulfillmentMessages#CONSULTATION_INCOME_SYNC_FAILED} prefix).</p>
     *
     * @param event 이행 이벤트
     * @return 회기 원복이 필요하면 true
     */
    private static boolean shouldReverseConsultationSessions(ShopOrderFulfillmentEvent event) {
        if (event == null || !ShopCatalogCategory.CONSULTATION.equals(event.getCategory())) {
            return false;
        }
        if (ShopOrderFulfillmentStatus.COMPLETED.equals(event.getStatus())) {
            return true;
        }
        if (!ShopOrderFulfillmentStatus.FAILED.equals(event.getStatus())) {
            return false;
        }
        String message = event.getMessage();
        return message != null
                && message.startsWith(ShopOrderFulfillmentMessages.CONSULTATION_INCOME_SYNC_FAILED);
    }

    /**
     * Path B ERP EXPENSE enqueue 여부 — COMPLETED/INCOME 부여·이미 REVERSED(과거 이행)만.
     * never-fulfilled(empty·회기 미가산 FAILED)는 {@code repairIncomeFirst} 팬텀 INCOME 금지.
     *
     * @param event 이행 이벤트
     * @return EXPENSE 생성 호출이 필요하면 true
     */
    private static boolean shouldEnqueueConsultationErpRefund(ShopOrderFulfillmentEvent event) {
        if (event == null || !ShopCatalogCategory.CONSULTATION.equals(event.getCategory())) {
            return false;
        }
        if (ShopOrderFulfillmentStatus.REVERSED.equals(event.getStatus())) {
            return true;
        }
        return shouldReverseConsultationSessions(event);
    }

    /**
     * 주문 단위 — 상담 ERP 환불(EXPENSE) 이벤트 증거가 하나라도 있는지.
     * <p>events 가 비면 false — empty 벨트는 {@link #applyEmptyEventsConsultationRefund} 가
     * 주문 귀속 INCOME·가산 회기 잔존을 별도 판정한다.</p>
     *
     * @param events 이행 이벤트 목록
     * @return 벨트에서 이벤트 기반 EXPENSE enqueue 허용 여부
     */
    private static boolean hasConsultationErpRefundEvidence(List<ShopOrderFulfillmentEvent> events) {
        if (events == null || events.isEmpty()) {
            return false;
        }
        for (ShopOrderFulfillmentEvent event : events) {
            if (shouldEnqueueConsultationErpRefund(event)) {
                return true;
            }
        }
        return false;
    }

    /**
     * fulfillmentEvents=[] 상담 라인 — 이행 증거(주문 귀속 INCOME 또는 가산 회기 잔존)가 있으면
     * {@link #reverseSessionsOnMapping} + Path B EXPENSE. 미이행(증거 없음)은 REFUNDED 만
     * (팬텀 INCOME repair+EXPENSE 금지). 회기 원복은 가산이 아직 잔존할 때만(멱등).
     *
     * @param tenantId 테넌트 ID
     * @param orderPublicId 주문 공개 ID
     * @param line 상담 주문 라인
     * @param mappingId 매핑 ID
     * @param mappingIdsMarkedRefunded 이미 환불 표기한 매핑
     * @param mappingIdsErpRefundQueued 이미 ERP 환불 호출한 매핑
     * @param displayCapture reverse 전 라인 스냅샷
     */
    private void applyEmptyEventsConsultationRefund(
            String tenantId,
            String orderPublicId,
            ShopClientOrderLine line,
            Long mappingId,
            Set<Long> mappingIdsMarkedRefunded,
            Set<Long> mappingIdsErpRefundQueued,
            RefundExpenseDisplayCapture displayCapture) {
        int grantSessions = displayCapture != null && displayCapture.grantSessions > 0
                ? displayCapture.grantSessions
                : resolveSessionsToGrant(line);
        boolean incomeEvidence = adminService.hasPostedOrderScopedConsultationDepositIncome(
                tenantId, mappingId, orderPublicId);
        ConsultantClientMapping mapping = consultantClientMappingRepository
                .findByTenantIdAndId(tenantId, mappingId)
                .orElse(null);
        boolean sessionsGrantPresent = isSessionsGrantLikelyPresent(mapping, grantSessions);
        int remaining = mapping != null && mapping.getRemainingSessions() != null
                ? mapping.getRemainingSessions()
                : 0;
        boolean alreadyRefunded = mapping != null
                && mapping.getPaymentStatus() == ConsultantClientMapping.PaymentStatus.REFUNDED;
        // INCOME+rem>0 첫 취소는 rem&lt;grant(부분 사용)여도 원복. 이미 REFUNDED 면 멱등 스킵.
        // ensure-on-refund(버그 경로 REFUNDED+가산 잔존)는 sessionsGrantPresent 로 원복.
        boolean shouldReverseSessions = sessionsGrantPresent
                || (incomeEvidence && !alreadyRefunded && remaining > 0);
        boolean fulfillEvidence = incomeEvidence || sessionsGrantPresent;

        if (shouldReverseSessions) {
            reverseSessionsOnMapping(tenantId, mappingId, grantSessions, mappingIdsMarkedRefunded);
        } else {
            markMappingPaymentRefunded(tenantId, mappingId, mappingIdsMarkedRefunded);
        }
        if (fulfillEvidence) {
            enqueueShopMappingErpRefund(
                    tenantId, mappingId, mappingIdsErpRefundQueued, displayCapture);
        }
    }

    /**
     * 매핑에 주문 grant 회기가 아직 남아 있는지 — empty-events 원복 멱등 판정.
     * rem≥grant 또는 (total−used)≥grant 이면 가산 잔존으로 본다(부분 사용 후 rem&lt;grant 도 total 기준).
     *
     * @param mapping 상담 매핑 (null 이면 false)
     * @param grantSessions 주문 라인 가산 회기
     * @return 가산 회기 원복이 필요하면 true
     */
    private static boolean isSessionsGrantLikelyPresent(
            ConsultantClientMapping mapping, int grantSessions) {
        if (mapping == null || grantSessions < ShopSessionCountConstants.MIN_SESSION_COUNT) {
            return false;
        }
        int remaining = mapping.getRemainingSessions() != null ? mapping.getRemainingSessions() : 0;
        int total = mapping.getTotalSessions() != null ? mapping.getTotalSessions() : 0;
        int used = mapping.getUsedSessions() != null ? mapping.getUsedSessions() : 0;
        if (remaining >= grantSessions) {
            return true;
        }
        return (total - used) >= grantSessions;
    }

    /**
     * 상담 라인 매핑에 대해 Path B ERP 환불 EXPENSE 생성(매핑당 1회, 멱등은 AdminService 측).
     * reverse 전 캡처한 titleSnapshot·grantSessions 를 전달한다.
     * 실패 시 예외를 전파한다 — 회기 원복·주문 REFUNDED 와 동일 fail-closed 단위.
     *
     * @param tenantId 테넌트 ID
     * @param mappingId 매핑 ID
     * @param mappingIdsErpRefundQueued 이미 ERP 환불 호출한 매핑 ID
     * @param displayCapture reverse 전 라인 스냅샷 (null이면 AdminService 라인 조회)
     */
    private void enqueueShopMappingErpRefund(
            String tenantId,
            Long mappingId,
            Set<Long> mappingIdsErpRefundQueued,
            RefundExpenseDisplayCapture displayCapture) {
        if (mappingId == null || mappingIdsErpRefundQueued.contains(mappingId)) {
            return;
        }
        mappingIdsErpRefundQueued.add(mappingId);
        if (displayCapture != null
                && StringUtils.hasText(displayCapture.titleSnapshot)
                && displayCapture.grantSessions > 0) {
            adminService.createShopOrderMappingRefundExpense(
                    tenantId,
                    mappingId,
                    ShopOrderFulfillmentMessages.SHOP_ORDER_FULL_REFUND_ERP_REASON,
                    displayCapture.titleSnapshot,
                    displayCapture.grantSessions,
                    displayCapture.orderPublicId,
                    displayCapture.cashDueMinor);
        } else {
            adminService.createShopOrderMappingRefundExpense(
                    tenantId, mappingId, ShopOrderFulfillmentMessages.SHOP_ORDER_FULL_REFUND_ERP_REASON);
        }
    }

    /**
     * reverse 전 상담 라인 titleSnapshot·grantSessions 캡처.
     *
     * @param lines 주문 라인
     * @return mappingId → 캡처
     */
    private static Map<Long, RefundExpenseDisplayCapture> captureRefundDisplayBeforeReverse(
            List<ShopClientOrderLine> lines) {
        Map<Long, RefundExpenseDisplayCapture> captures = new HashMap<>();
        if (lines == null) {
            return captures;
        }
        for (ShopClientOrderLine line : lines) {
            if (line == null || line.getConsultantClientMappingId() == null) {
                continue;
            }
            if (!isConsultationOrderLine(line)) {
                continue;
            }
            String title = line.getTitleSnapshot();
            int grantSessions = resolveSessionsToGrant(line);
            if (!StringUtils.hasText(title) || grantSessions <= 0) {
                continue;
            }
            String orderPublicId = null;
            Long cashDueMinor = null;
            if (line.getClientOrder() != null) {
                if (StringUtils.hasText(line.getClientOrder().getPublicId())) {
                    orderPublicId = line.getClientOrder().getPublicId().trim();
                }
                cashDueMinor = line.getClientOrder().getCashDueMinor();
            }
            if (cashDueMinor == null || cashDueMinor <= 0L) {
                cashDueMinor = line.getLineTotalMinor();
            }
            captures.putIfAbsent(
                    line.getConsultantClientMappingId(),
                    new RefundExpenseDisplayCapture(
                            title.trim(), grantSessions, orderPublicId, cashDueMinor));
        }
        return captures;
    }

    /**
     * COMPLETED 멱등 경로 — posted INCOME 갭 ensure.
     * ensure 실패를 영구 삼키지 않는다: 상담 COMPLETED 이벤트를
     * {@link ShopOrderFulfillmentMessages#CONSULTATION_INCOME_SYNC_FAILED} FAILED 로 강등해 재시도 가능하게 한다.
     * fulfill/PAID 부모 TX 는 rollback-only 로 만들지 않는다.
     *
     * @param tenantId 테넌트 ID
     * @param order 주문
     */
    private void healConsultationDepositIncomeQuietly(String tenantId, ShopClientOrder order) {
        if (order == null || order.getId() == null) {
            return;
        }
        List<ShopClientOrderLine> lines =
                shopClientOrderLineRepository.findByClientOrder_IdAndIsDeletedFalseOrderByLineNoAsc(
                        order.getId());
        for (ShopClientOrderLine line : lines) {
            if (!isConsultationOrderLine(line) || line.getConsultantClientMappingId() == null) {
                continue;
            }
            ShopOrderIncomeClaim claim = buildIncomeClaim(tenantId, order, line);
            healMappingDepositIncomeOrDemote(
                    tenantId, order.getPublicId(), line.getConsultantClientMappingId(), null, claim);
        }
    }

    /**
     * 단일 매핑 입금 INCOME ensure (REQUIRES_NEW). repair API 는 예외를 전파한다.
     *
     * @param tenantId 테넌트 ID
     * @param mappingId 매핑 ID
     * @param claim Path B claim
     */
    private void healSingleMappingDepositIncome(
            String tenantId, Long mappingId, ShopOrderIncomeClaim claim) {
        runConsultationHookInNewTransaction(
                tenantId, () -> ensureDepositIncomeInIsolation(tenantId, mappingId, claim));
    }

    /**
     * ensure 실패 시 상담 COMPLETED 를 INCOME_SYNC_FAILED 로 강등(재시도 가능).
     *
     * @param tenantId 테넌트 ID
     * @param orderPublicId 주문 공개 ID
     * @param mappingId 매핑 ID
     * @param singleEvent 라인 단위 이벤트(null 이면 주문 전체 상담 COMPLETED 강등)
     * @param claim Path B claim
     */
    private void healMappingDepositIncomeOrDemote(
            String tenantId,
            String orderPublicId,
            Long mappingId,
            ShopOrderFulfillmentEvent singleEvent,
            ShopOrderIncomeClaim claim) {
        try {
            healSingleMappingDepositIncome(tenantId, mappingId, claim);
        } catch (Exception e) {
            log.error(
                    "COMPLETED gap INCOME heal failed — demote to INCOME_SYNC_FAILED (retryable): "
                            + "tenantId={}, orderPublicId={}, mappingId={}, error={}",
                    tenantId,
                    orderPublicId,
                    mappingId,
                    e.getMessage(),
                    e);
            if (singleEvent != null) {
                demoteConsultationEventToIncomeSyncFailed(singleEvent, e);
            } else {
                demoteConsultationCompletedEventsToIncomeSyncFailed(tenantId, orderPublicId, e);
            }
        }
    }

    /**
     * 주문의 상담 COMPLETED 이행 이벤트를 INCOME_SYNC_FAILED 로 강등·저장.
     *
     * @param tenantId 테넌트 ID
     * @param orderPublicId 주문 공개 ID
     * @param cause ensure 실패 원인
     */
    private void demoteConsultationCompletedEventsToIncomeSyncFailed(
            String tenantId, String orderPublicId, Exception cause) {
        List<ShopOrderFulfillmentEvent> events =
                fulfillmentEventRepository.findByTenantIdAndOrderPublicIdAndIsDeletedFalseOrderBySkuCodeAsc(
                        tenantId, orderPublicId);
        for (ShopOrderFulfillmentEvent event : events) {
            if (event == null || !ShopCatalogCategory.CONSULTATION.equals(event.getCategory())) {
                continue;
            }
            if (!ShopOrderFulfillmentStatus.COMPLETED.equals(event.getStatus())) {
                continue;
            }
            demoteConsultationEventToIncomeSyncFailed(event, cause);
        }
    }

    /**
     * 단일 상담 이벤트를 FAILED + CONSULTATION_INCOME_SYNC_FAILED 로 저장.
     *
     * @param event 이행 이벤트
     * @param cause ensure 실패 원인
     */
    private void demoteConsultationEventToIncomeSyncFailed(
            ShopOrderFulfillmentEvent event, Exception cause) {
        event.setStatus(ShopOrderFulfillmentStatus.FAILED);
        event.setMessage(appendSanitizedFailureCause(
                ShopOrderFulfillmentMessages.CONSULTATION_INCOME_SYNC_FAILED, cause));
        fulfillmentEventRepository.save(event);
    }

    /** reverse 전 캡처 — EXPENSE 적요 title·회기·주문 귀속 SSOT */
    private static final class RefundExpenseDisplayCapture {
        private final String titleSnapshot;
        private final int grantSessions;
        private final String orderPublicId;
        private final Long cashDueMinor;

        private RefundExpenseDisplayCapture(
                String titleSnapshot, int grantSessions, String orderPublicId, Long cashDueMinor) {
            this.titleSnapshot = titleSnapshot;
            this.grantSessions = grantSessions;
            this.orderPublicId = orderPublicId;
            this.cashDueMinor = cashDueMinor;
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
     * 상담 연결(매핑)은 유지하고, rem→0으로 {@code SESSIONS_EXHAUSTED} 전이 시 endDate만 클리어한다.
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
        restoreCounselingConnectionAfterShopRefund(mapping);
        consultantClientMappingRepository.save(mapping);
        mappingIdsMarkedRefunded.add(mappingId);
        log.info(
                "Shop session reverse applied: tenantId={}, mappingId={}, sessionsReversed={}, total={}, "
                        + "remaining={}, paymentStatus={}, status={}, endDate={}",
                tenantId,
                mappingId,
                sessionsToReverse,
                mapping.getTotalSessions(),
                mapping.getRemainingSessions(),
                mapping.getPaymentStatus(),
                mapping.getStatus(),
                mapping.getEndDate());
    }

    /**
     * 매핑 paymentStatus=REFUNDED 저장(멱등). paymentAmount는 변경하지 않는다.
     * 이미 REFUNDED여도 상담 연결 heal(SESSIONS_EXHAUSTED→PENDING_PAYMENT, endDate 클리어)은 수행한다.
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
        boolean alreadyRefunded =
                mapping.getPaymentStatus() == ConsultantClientMapping.PaymentStatus.REFUNDED;
        if (!alreadyRefunded) {
            applyRefundedPaymentStatus(mapping);
        }
        restoreCounselingConnectionAfterShopRefund(mapping);
        consultantClientMappingRepository.save(mapping);
        mappingIdsMarkedRefunded.add(mappingId);
        log.info(
                "Shop mapping paymentStatus REFUNDED: tenantId={}, mappingId={}, paymentAmount={}, "
                        + "status={}, endDate={}",
                tenantId,
                mappingId,
                mapping.getPaymentAmount(),
                mapping.getStatus(),
                mapping.getEndDate());
    }

    /**
     * Path B 환불 후 상담 연결(매핑)을 체크아웃 재구매 가능 상태로 유지한다.
     *
     * <p>{@link ConsultantClientMapping#reverseGrantedSessions} 가 rem→0·ACTIVE 이면
     * {@code SESSIONS_EXHAUSTED} + endDate 를 설정한다. 환불 heal 시 SSOT 선호 상태인
     * {@code PENDING_PAYMENT} 로 올리고 endDate 를 null 로 클리어한다.
     * 이미 {@code PENDING_PAYMENT}/{@code ACTIVE}/{@code PAYMENT_CONFIRMED} 이면
     * 상태를 내리지 않고 endDate 만 클리어한다. CANCELLED/TERMINATED/INACTIVE·soft-delete 금지.
     * paymentStatus(REFUNDED)는 변경하지 않는다.</p>
     *
     * @param mapping 환불 처리 중인 매핑
     * @author MindGarden
     * @since 2026-09-19
     */
    private void restoreCounselingConnectionAfterShopRefund(ConsultantClientMapping mapping) {
        if (mapping == null) {
            return;
        }
        ConsultantClientMapping.MappingStatus previousStatus = mapping.getStatus();
        if (previousStatus == ConsultantClientMapping.MappingStatus.SESSIONS_EXHAUSTED) {
            mapping.setStatus(ConsultantClientMapping.MappingStatus.PENDING_PAYMENT);
            mapping.setEndDate(null);
            log.info(
                    "Shop refund counseling connection heal: mappingId={}, status {} → {}, endDate=null",
                    mapping.getId(),
                    previousStatus,
                    mapping.getStatus());
            return;
        }
        if (MappingAssignmentStatus.isAssigned(previousStatus) && mapping.getEndDate() != null) {
            mapping.setEndDate(null);
            log.info(
                    "Shop refund counseling connection heal: mappingId={}, status={} (unchanged), endDate=null",
                    mapping.getId(),
                    previousStatus);
        }
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
     * CONSULTATION 회기와 입금 INCOME 을 하나의 {@code PROPAGATION_REQUIRES_NEW} 원자 단위로 실행한다.
     * <p>
     * 회기({@link ShopConsultationFulfillmentHook#onConsultationPackagePaid}) 후 같은 TX 에서
     * {@link AdminService#ensureConsultationDepositIncomeInCurrentTransaction} 으로 입금 INCOME 을
     * 보장한다. INCOME 실패 시 회기 가산도 롤백되어 반쪽 성공 상태가 남지 않는다.
     * 예외는 이 메서드에서 흡수되어 부모 fulfill/PAID TX 를 rollback-only 로 만들지 않는다.
     * COMPLETED 는 posted INCOME ensure 가 끝난 뒤에만 반환한다.
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
                        .titleSnapshot(line.getTitleSnapshot())
                        .lineTotalMinor(line.getLineTotalMinor() != null ? line.getLineTotalMinor() : 0L)
                        .cashDueMinor(order.getCashDueMinor() != null ? order.getCashDueMinor() : 0L)
                        .mappingId(mappingId)
                        .sessionsToGrant(sessionsToGrant)
                        .build());
                ShopOrderIncomeClaim claim = buildIncomeClaim(tenantId, order, line);
                ensureDepositIncomeInIsolation(tenantId, mappingId, claim);
            });
        } catch (Exception e) {
            log.error(
                    "Consultation fulfill atomic unit failed in REQUIRES_NEW "
                            + "(sessions+INCOME rolled back together; fulfillment FAILED, retryable; "
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
                            ShopOrderFulfillmentMessages.CONSULTATION_ERP_SYNC_FAILED, e));
        }

        return new FulfillmentOutcome(
                ShopOrderFulfillmentStatus.COMPLETED, ShopOrderFulfillmentMessages.CONSULTATION_ERP_COMPLETED);
    }

    /**
     * 매핑 입금 INCOME SSOT 를 현재(이미 REQUIRES_NEW 인) 트랜잭션에서 보장한다.
     * nested {@code REQUIRES_NEW} 를 열지 않아 회기 가산과 동일 커밋/롤백 단위가 된다.
     *
     * @param tenantId 테넌트 ID
     * @param mappingId 매핑 ID
     * @param claim Path B 주문 claim (필수 — Path B fulfill)
     */
    private void ensureDepositIncomeInIsolation(
            String tenantId, Long mappingId, ShopOrderIncomeClaim claim) {
        ConsultantClientMapping mapping = consultantClientMappingRepository
                .findByTenantIdAndId(tenantId, mappingId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "매핑을 찾을 수 없습니다: mappingId=" + mappingId));
        adminService.ensureConsultationDepositIncomeInCurrentTransaction(mapping, claim);
    }

    /**
     * Path B fulfill/heal 용 INCOME claim — 현재 주문 line·cashDue·PAY_* SSOT.
     *
     * @param tenantId 테넌트 ID
     * @param order 주문
     * @param line 주문 라인
     * @return claim
     */
    private ShopOrderIncomeClaim buildIncomeClaim(
            String tenantId, ShopClientOrder order, ShopClientOrderLine line) {
        String orderPublicId = order != null ? order.getPublicId() : null;
        Long cashDue = order != null ? order.getCashDueMinor() : null;
        if (cashDue == null && line != null) {
            cashDue = line.getLineTotalMinor();
        }
        String title = line != null && StringUtils.hasText(line.getTitleSnapshot())
                ? line.getTitleSnapshot().trim()
                : null;
        Integer sessionCount = null;
        if (line != null) {
            int grant = resolveSessionsToGrant(line);
            if (grant >= ShopSessionCountConstants.MIN_SESSION_COUNT) {
                sessionCount = grant;
            }
        }
        String paymentId = resolveApprovedPaymentId(tenantId, orderPublicId);
        return ShopOrderIncomeClaim.builder()
                .orderPublicId(orderPublicId)
                .paymentId(paymentId)
                .titleSnapshot(title)
                .cashDueMinor(cashDue)
                .sessionCount(sessionCount)
                .build();
    }

    /**
     * 주문 APPROVED paymentId (없으면 최신 paymentId).
     *
     * @param tenantId 테넌트 ID
     * @param orderPublicId 주문 공개 ID
     * @return paymentId 또는 null
     */
    private String resolveApprovedPaymentId(String tenantId, String orderPublicId) {
        if (!StringUtils.hasText(tenantId) || !StringUtils.hasText(orderPublicId) || paymentRepository == null) {
            return null;
        }
        Optional<Payment> approved = paymentRepository
                .findFirstByTenantIdAndOrderIdAndStatusAndIsDeletedFalseOrderByIdDesc(
                        tenantId, orderPublicId.trim(), Payment.PaymentStatus.APPROVED);
        if (approved.isPresent() && StringUtils.hasText(approved.get().getPaymentId())) {
            return approved.get().getPaymentId().trim();
        }
        List<Payment> any = paymentRepository.findByTenantIdAndOrderIdAndIsDeletedFalse(
                tenantId, orderPublicId.trim());
        if (any != null && !any.isEmpty() && StringUtils.hasText(any.get(0).getPaymentId())) {
            return any.get(0).getPaymentId().trim();
        }
        return null;
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
     * COMPLETED 이행 후 홈 가독·ERP INCOME 금액·주문 귀속 heal.
     * <ul>
     *   <li>{@code rem&gt;0} + ({@code lineTotal&gt;0} 또는 PAID {@code cashDue&gt;0}):
     *       price stale 이면 {@link ErpShopConsultationFulfillmentHook#syncPackagePriceFromLineTotal} 후
     *       항상 {@link AdminService#ensureConsultationDepositIncome}
     *       (금액·stale remarks/「무료1회」적요 보정; 귀속 일치 시 멱등 no-op)</li>
     *   <li>{@code ACTIVE}+{@code rem==0}+{@code total&lt;=used}: 패키지 회기 1회 가산</li>
     *   <li>{@code PAYMENT_CONFIRMED}/{@code DEPOSIT_*}+{@code rem&gt;0}: ACTIVE 승격 (회기 가산 없음)</li>
     * </ul>
     * <p>fail-closed: {@link ConsultantClientMapping.MappingStatus#SESSIONS_EXHAUSTED}(정상 소진·rem=0)는
     * 스킵. ERP confirmPayment 는 재호출하지 않는다.</p>
     * <p>ensure INCOME 실패 시 fulfill 경로({@link #healMappingDepositIncomeOrDemote})와 동일하게
     * COMPLETED 를 {@code FAILED}+{@link ShopOrderFulfillmentMessages#CONSULTATION_INCOME_SYNC_FAILED}
     * 로 강등한 뒤 예외를 전파한다 (COMPLETED 잔존 → false pay SUCCESS 방지·재이행 UI).</p>
     *
     * @param tenantId 테넌트 ID
     * @param order PAID 주문
     * @param events 이행 이벤트
     * @return 1건 이상 보정하면 true
     * @throws RuntimeException ensure INCOME 실패 시 강등 후 원인 예외 전파
     * @author MindGarden
     * @since 2026-09-20
     */
    private boolean healCompletedConsultationMappingForHome(
            String tenantId, ShopClientOrder order, List<ShopOrderFulfillmentEvent> events) {
        if (events == null || events.isEmpty() || order == null || order.getId() == null) {
            return false;
        }
        List<ShopClientOrderLine> lines =
                shopClientOrderLineRepository.findByClientOrder_IdAndIsDeletedFalseOrderByLineNoAsc(
                        order.getId());
        if (lines == null || lines.isEmpty()) {
            return false;
        }
        boolean healed = false;
        long cashDue = order.getCashDueMinor() != null ? order.getCashDueMinor() : 0L;
        for (ShopOrderFulfillmentEvent event : events) {
            if (!ShopOrderFulfillmentStatus.COMPLETED.equals(event.getStatus())) {
                continue;
            }
            if (!ShopCatalogCategory.CONSULTATION.equals(event.getCategory())) {
                continue;
            }
            ShopClientOrderLine line = findLineBySku(lines, event.getSkuCode());
            Long mappingId = line != null ? line.getConsultantClientMappingId() : null;
            if (mappingId == null) {
                continue;
            }
            ConsultantClientMapping mapping = consultantClientMappingRepository
                    .findByTenantIdAndId(tenantId, mappingId)
                    .orElse(null);
            if (mapping == null) {
                continue;
            }
            ConsultantClientMapping.MappingStatus status = mapping.getStatus();
            int remaining = mapping.getRemainingSessions() != null ? mapping.getRemainingSessions() : 0;
            int used = mapping.getUsedSessions() != null ? mapping.getUsedSessions() : 0;
            int total = mapping.getTotalSessions() != null ? mapping.getTotalSessions() : 0;
            long lineTotal = line.getLineTotalMinor() != null ? line.getLineTotalMinor() : 0L;

            // rem>0 + (lineTotal>0 | cashDue>0) → 항상 ensure (price 일치해도 stale remarks heal)
            if (remaining > 0 && (lineTotal > 0L || cashDue > 0L)) {
                boolean priceStale = lineTotal > 0L
                        && (mapping.getPackagePrice() == null
                        || mapping.getPackagePrice() != lineTotal
                        || mapping.getPaymentAmount() == null
                        || mapping.getPaymentAmount() != lineTotal);
                if (priceStale) {
                    ErpShopConsultationFulfillmentHook.syncPackagePriceFromLineTotal(mapping, lineTotal);
                    consultantClientMappingRepository.save(mapping);
                }
                ShopOrderIncomeClaim claim = buildIncomeClaim(tenantId, order, line);
                try {
                    adminService.ensureConsultationDepositIncome(mapping, claim);
                } catch (Exception e) {
                    log.error(
                            "COMPLETED home heal INCOME ensure failed — demote to INCOME_SYNC_FAILED"
                                    + " (retryable): tenantId={}, orderPublicId={}, mappingId={}, error={}",
                            tenantId,
                            order.getPublicId(),
                            mappingId,
                            e.getMessage(),
                            e);
                    demoteConsultationEventToIncomeSyncFailed(event, e);
                    if (e instanceof RuntimeException runtimeException) {
                        throw runtimeException;
                    }
                    throw new IllegalStateException(e.getMessage(), e);
                }
                healed = true;
                log.info(
                        "Shop COMPLETED rem>0 price/INCOME heal:"
                                + " tenantId={}, orderPublicId={}, mappingId={}, lineTotal={},"
                                + " cashDue={}, packagePrice={}, paymentAmount={}, priceStale={}",
                        tenantId,
                        order.getPublicId(),
                        mappingId,
                        lineTotal,
                        cashDue,
                        mapping.getPackagePrice(),
                        mapping.getPaymentAmount(),
                        priceStale);
            }

            if (status == ConsultantClientMapping.MappingStatus.PAYMENT_CONFIRMED
                    || status == ConsultantClientMapping.MappingStatus.DEPOSIT_PENDING
                    || status == ConsultantClientMapping.MappingStatus.DEPOSIT_CONFIRMED) {
                if (remaining <= 0) {
                    // rem=0 정상 소진·미충전 — fail-closed (이중 가산 금지)
                    continue;
                }
                mapping.setStatus(ConsultantClientMapping.MappingStatus.ACTIVE);
                mapping.setEndDate(null);
                consultantClientMappingRepository.save(mapping);
                healed = true;
                log.info(
                        "Shop COMPLETED PAYMENT_CONFIRMED/DEPOSIT_* rem>0 heal → ACTIVE:"
                                + " tenantId={}, orderPublicId={}, mappingId={}, remaining={}",
                        tenantId,
                        order.getPublicId(),
                        mappingId,
                        remaining);
            } else if (status == ConsultantClientMapping.MappingStatus.ACTIVE
                    && remaining <= 0
                    && total <= used) {
                int sessionsToGrant = resolveSessionsToGrant(line);
                if (sessionsToGrant < ShopSessionCountConstants.MIN_SESSION_COUNT) {
                    continue;
                }
                mapping.addSessions(sessionsToGrant);
                consultantClientMappingRepository.save(mapping);
                healed = true;
                log.info(
                        "Shop COMPLETED rem=0 heal: tenantId={}, orderPublicId={}, mappingId={}, sessionsAdded={}, "
                                + "total={}, remaining={}",
                        tenantId,
                        order.getPublicId(),
                        mappingId,
                        sessionsToGrant,
                        mapping.getTotalSessions(),
                        mapping.getRemainingSessions());
            }
        }
        return healed;
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
