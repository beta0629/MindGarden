package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.constant.ShopAdminOrderConstants;
import com.coresolution.consultation.constant.ShopAdminOrderLedgerConstants;
import com.coresolution.consultation.constant.ShopClientOrderStatus;
import com.coresolution.consultation.constant.ShopOrderExpiryConstants;
import com.coresolution.consultation.constant.ShopOrderFulfillmentRetryConstants;
import com.coresolution.consultation.constant.ShopSessionCountConstants;
import com.coresolution.consultation.dto.shop.admin.ShopOrderAdminDetailResponse;
import com.coresolution.consultation.dto.shop.admin.ShopOrderAdminListQuery;
import com.coresolution.consultation.dto.shop.admin.ShopOrderAdminListResponse;
import com.coresolution.consultation.dto.shop.admin.ShopOrderAdminListSummary;
import com.coresolution.consultation.dto.shop.admin.ShopOrderAdminSummaryItem;
import com.coresolution.consultation.dto.shop.admin.ShopOrderExpiryExtendRequest;
import com.coresolution.consultation.dto.shop.admin.ShopOrderExpiryExtensionItem;
import com.coresolution.consultation.entity.Payment;
import com.coresolution.consultation.entity.ShopClientOrder;
import com.coresolution.consultation.entity.ShopClientOrderLine;
import com.coresolution.consultation.entity.ShopOrderExpiryExtension;
import com.coresolution.consultation.entity.ShopOrderFulfillmentEvent;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.PaymentRepository;
import com.coresolution.consultation.repository.ShopClientOrderLineRepository;
import com.coresolution.consultation.repository.ShopClientOrderRepository;
import com.coresolution.consultation.repository.ShopOrderExpiryExtensionRepository;
import com.coresolution.consultation.repository.ShopOrderFulfillmentEventRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.AdminShopOrderLedgerService;
import com.coresolution.consultation.service.shop.ShopOrderExpiryCalculator;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.consultation.util.PaymentSourceResolver;
import com.coresolution.core.util.PaginationUtils;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * 어드민 온라인 주문 장부 구현.
 *
 * <p>목록은 기간 내 주문을 테넌트 스코프로 일괄 조회(라인·결제·이행·연장·이름)한 뒤 상태를 판정하고,
 * 검색·세그먼트·페이지를 서버에서 적용한다. 행마다 상세를 다시 부르지 않아도 되게 상품명·회기·내담자·기한을 싣는다.</p>
 *
 * @author MindGarden
 * @since 2026-09-29
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AdminShopOrderLedgerServiceImpl implements AdminShopOrderLedgerService {

    private static final String PRODUCT_TITLE_MORE_FMT = "%s 외 %d";
    private static final String NON_ALNUM_PATTERN = "[^0-9a-zA-Z]";

    private final ShopClientOrderRepository shopClientOrderRepository;
    private final ShopClientOrderLineRepository shopClientOrderLineRepository;
    private final ShopOrderFulfillmentEventRepository shopOrderFulfillmentEventRepository;
    private final ShopOrderExpiryExtensionRepository shopOrderExpiryExtensionRepository;
    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;
    private final PersonalDataEncryptionUtil personalDataEncryptionUtil;

    private Clock clock = Clock.systemDefaultZone();

    /**
     * 테스트용 기준 시계.
     *
     * @param clock 시계
     */
    void setClock(Clock clock) {
        this.clock = Objects.requireNonNull(clock, "clock");
    }

    @Override
    @Transactional(readOnly = true)
    public ShopOrderAdminListResponse listOrders(String tenantId, ShopOrderAdminListQuery query) {
        String tid = requireTenant(tenantId);
        int page = Math.max(ShopAdminOrderConstants.DEFAULT_LIST_PAGE, query.page());
        int size = PaginationUtils.createPageable(page, query.size()).getPageSize();
        LocalDateTime from = query.from() != null ? query.from().atStartOfDay() : null;
        LocalDateTime to = query.to() != null ? query.to().atStartOfDay() : null;

        List<ShopClientOrder> orders = shopClientOrderRepository.findLedgerByTenantInRange(tid, from, to);
        List<ShopOrderAdminSummaryItem> items = buildItems(tid, orders);
        List<ShopOrderAdminSummaryItem> searched = filterByQuery(items, query.query());

        Map<String, Long> counts = countSegments(searched);
        ShopOrderAdminListSummary summary = summarize(searched);
        String segment = normalizeSegment(query.segment());
        List<ShopOrderAdminSummaryItem> segmented = ShopAdminOrderLedgerConstants.SEGMENT_ALL.equals(segment)
                ? searched
                : searched.stream().filter(i -> segment.equals(i.getLedgerState())).collect(Collectors.toList());

        int fromIndex = Math.min(page * size, segmented.size());
        int toIndex = Math.min(fromIndex + size, segmented.size());
        return ShopOrderAdminListResponse.builder()
                .orders(new ArrayList<>(segmented.subList(fromIndex, toIndex)))
                .totalElements(segmented.size())
                .page(page)
                .size(size)
                .counts(counts)
                .summary(summary)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public ShopOrderAdminDetailResponse enrichDetail(String tenantId, ShopOrderAdminDetailResponse detail) {
        if (detail == null || !StringUtils.hasText(detail.getOrderPublicId())) {
            return detail;
        }
        String tid = requireTenant(tenantId);
        ShopClientOrder order = requireOrder(tid, detail.getOrderPublicId());
        List<ShopClientOrderLine> lines =
                shopClientOrderLineRepository.findByClientOrder_IdAndIsDeletedFalseOrderByLineNoAsc(order.getId());
        List<Payment> payments =
                paymentRepository.findByTenantIdAndOrderIdAndIsDeletedFalse(tid, order.getPublicId());
        List<ShopOrderExpiryExtension> extensions = shopOrderExpiryExtensionRepository
                .findByTenantIdAndOrderPublicIdAndIsDeletedFalseOrderByCreatedAtDescIdDesc(tid, order.getPublicId());
        LocalDateTime paidAt = resolvePaidAt(order, payments);
        ShopOrderExpiryCalculator.Result expiry = evaluateExpiry(order, paidAt, lines, extensions);

        Set<Long> userIds = new HashSet<>();
        if (order.getClientId() != null) {
            userIds.add(order.getClientId());
        }
        extensions.stream().map(ShopOrderExpiryExtension::getExtendedByUserId)
                .filter(Objects::nonNull).forEach(userIds::add);
        Map<Long, String> names = loadUserNames(tid, userIds);

        detail.setClientName(names.get(order.getClientId()));
        detail.setPaidAt(paidAt);
        applyExpiry(detail, expiry);
        detail.setExpiryExtensions(toExtensionItems(extensions, names));
        if (detail.getLines() != null) {
            Map<Integer, Integer> validityByLineNo = new HashMap<>();
            for (ShopClientOrderLine line : lines) {
                validityByLineNo.put(line.getLineNo(), line.getValidityMonthsSnapshot());
            }
            detail.getLines().forEach(l -> l.setValidityMonths(validityByLineNo.get(l.getLineNo())));
        }
        return detail;
    }

    @Override
    @Transactional
    public List<ShopOrderExpiryExtensionItem> extendExpiry(
            String tenantId, String orderPublicId, ShopOrderExpiryExtendRequest request, Long actorUserId) {
        String tid = requireTenant(tenantId);
        ShopClientOrder order = requireOrder(tid, orderPublicId);
        if (request == null || request.newExpireDate() == null) {
            throw new IllegalArgumentException(ShopOrderExpiryConstants.MSG_EXTEND_DATE_REQUIRED);
        }
        String reason = request.reason() != null ? request.reason().trim() : "";
        if (reason.isEmpty()) {
            throw new IllegalArgumentException(ShopOrderExpiryConstants.MSG_EXTEND_REASON_REQUIRED);
        }
        if (reason.length() > ShopOrderExpiryConstants.EXTEND_REASON_MAX_LENGTH) {
            throw new IllegalArgumentException(ShopOrderExpiryConstants.MSG_EXTEND_REASON_TOO_LONG);
        }
        if (order.getStatus() != ShopClientOrderStatus.PAID) {
            throw new IllegalArgumentException(ShopOrderExpiryConstants.MSG_EXTEND_NOT_PAID);
        }
        List<ShopClientOrderLine> lines =
                shopClientOrderLineRepository.findByClientOrder_IdAndIsDeletedFalseOrderByLineNoAsc(order.getId());
        List<Payment> payments = paymentRepository.findByTenantIdAndOrderIdAndIsDeletedFalse(tid, order.getPublicId());
        List<ShopOrderExpiryExtension> extensions = shopOrderExpiryExtensionRepository
                .findByTenantIdAndOrderPublicIdAndIsDeletedFalseOrderByCreatedAtDescIdDesc(tid, order.getPublicId());
        ShopOrderExpiryCalculator.Result expiry =
                evaluateExpiry(order, resolvePaidAt(order, payments), lines, extensions);
        if (expiry.expireDate() == null) {
            throw new IllegalArgumentException(ShopOrderExpiryConstants.MSG_EXTEND_NO_EXPIRY);
        }
        LocalDate newDate = request.newExpireDate();
        if (!newDate.isAfter(expiry.expireDate())) {
            throw new IllegalArgumentException(ShopOrderExpiryConstants.MSG_EXTEND_DATE_NOT_AFTER_CURRENT);
        }
        if (ShopOrderExpiryConstants.STATE_EXPIRED.equals(expiry.state()) && !newDate.isAfter(today())) {
            throw new IllegalArgumentException(ShopOrderExpiryConstants.MSG_EXTEND_DATE_NOT_AFTER_TODAY);
        }
        ShopOrderExpiryExtension row = ShopOrderExpiryExtension.builder()
                .orderPublicId(order.getPublicId())
                .previousExpireDate(expiry.expireDate())
                .newExpireDate(newDate)
                .reason(reason)
                .extendedByUserId(actorUserId)
                .build();
        row.setTenantId(tid);
        shopOrderExpiryExtensionRepository.save(row);
        log.info("쇼핑 주문 사용 기한 연장: tenantId={}, orderPublicId={}, previous={}, next={}",
                tid, order.getPublicId(), expiry.expireDate(), newDate);
        return listExpiryExtensions(tid, order.getPublicId());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ShopOrderExpiryExtensionItem> listExpiryExtensions(String tenantId, String orderPublicId) {
        String tid = requireTenant(tenantId);
        ShopClientOrder order = requireOrder(tid, orderPublicId);
        List<ShopOrderExpiryExtension> extensions = shopOrderExpiryExtensionRepository
                .findByTenantIdAndOrderPublicIdAndIsDeletedFalseOrderByCreatedAtDescIdDesc(tid, order.getPublicId());
        Set<Long> actorIds = extensions.stream().map(ShopOrderExpiryExtension::getExtendedByUserId)
                .filter(Objects::nonNull).collect(Collectors.toSet());
        return toExtensionItems(extensions, loadUserNames(tid, actorIds));
    }

    private List<ShopOrderAdminSummaryItem> buildItems(String tenantId, List<ShopClientOrder> orders) {
        if (orders == null || orders.isEmpty()) {
            return Collections.emptyList();
        }
        List<String> publicIds = orders.stream().map(ShopClientOrder::getPublicId).collect(Collectors.toList());
        Map<String, List<ShopClientOrderLine>> linesByOrder = shopClientOrderLineRepository
                .findByTenantIdAndClientOrderPublicIdInAndIsDeletedFalseOrderByIdDesc(tenantId, publicIds)
                .stream()
                .collect(Collectors.groupingBy(l -> l.getClientOrder().getPublicId()));
        Map<String, List<Payment>> paymentsByOrder = paymentRepository
                .findByTenantIdAndOrderIdInAndIsDeletedFalse(tenantId, publicIds)
                .stream()
                .collect(Collectors.groupingBy(Payment::getOrderId));
        Map<String, List<ShopOrderFulfillmentEvent>> eventsByOrder = shopOrderFulfillmentEventRepository
                .findByTenantIdAndOrderPublicIdInAndIsDeletedFalse(tenantId, publicIds)
                .stream()
                .collect(Collectors.groupingBy(ShopOrderFulfillmentEvent::getOrderPublicId));
        Map<String, List<ShopOrderExpiryExtension>> extensionsByOrder = shopOrderExpiryExtensionRepository
                .findByTenantIdAndOrderPublicIdInAndIsDeletedFalse(tenantId, publicIds)
                .stream()
                .collect(Collectors.groupingBy(ShopOrderExpiryExtension::getOrderPublicId));
        Set<Long> clientIds = orders.stream().map(ShopClientOrder::getClientId)
                .filter(Objects::nonNull).collect(Collectors.toSet());
        Map<Long, String> names = loadUserNames(tenantId, clientIds);

        List<ShopOrderAdminSummaryItem> out = new ArrayList<>(orders.size());
        for (ShopClientOrder order : orders) {
            String id = order.getPublicId();
            List<ShopClientOrderLine> lines = new ArrayList<>(linesByOrder.getOrDefault(id, List.of()));
            lines.sort(Comparator.comparing(ShopClientOrderLine::getLineNo,
                    Comparator.nullsLast(Integer::compareTo)));
            List<Payment> payments = paymentsByOrder.getOrDefault(id, List.of());
            out.add(toItem(order, lines, payments,
                    eventsByOrder.getOrDefault(id, List.of()),
                    extensionsByOrder.getOrDefault(id, List.of()),
                    names.get(order.getClientId())));
        }
        return out;
    }

    private ShopOrderAdminSummaryItem toItem(
            ShopClientOrder order,
            List<ShopClientOrderLine> lines,
            List<Payment> payments,
            List<ShopOrderFulfillmentEvent> events,
            List<ShopOrderExpiryExtension> extensions,
            String clientName) {
        Optional<Payment> payment = resolveLatestPayment(payments);
        String paymentStatus = payment.map(Payment::getStatus).map(Enum::name).orElse(null);
        Long pgAmount = payment.map(Payment::getAmount).map(BigDecimal::longValue).orElse(null);
        LocalDateTime paidAt = resolvePaidAt(order, payments);
        ShopOrderExpiryCalculator.Result expiry = evaluateExpiry(order, paidAt, lines, extensions);
        boolean retryable = events.stream().anyMatch(e ->
                ShopOrderFulfillmentRetryConstants.isRetryableFailed(e.getStatus(), e.getMessage()));
        ShopOrderAdminSummaryItem item = ShopOrderAdminSummaryItem.builder()
                .orderPublicId(order.getPublicId())
                .status(order.getStatus())
                .subtotalMinor(nullToZero(order.getSubtotalMinor()))
                .pointsRedeemMinor(nullToZero(order.getPointsRedeemMinor()))
                .cashDueMinor(nullToZero(order.getCashDueMinor()))
                .clientId(order.getClientId())
                .createdAt(order.getCreatedAt())
                .paymentStatus(paymentStatus)
                .pgAmount(pgAmount)
                .paymentSource(PaymentSourceResolver.forShopOrder())
                .paymentProvider(payment.map(Payment::getProvider).map(Enum::name).orElse(null))
                .deletable(isDeletable(order, payments))
                .productTitle(resolveProductTitle(lines))
                .sessionCount(resolveSessionCount(lines))
                .amountMinor(resolveAmount(pgAmount, order))
                .ledgerState(resolveLedgerState(order.getStatus(), paymentStatus, retryable, expiry.state()))
                .clientName(clientName)
                .paidAt(paidAt)
                .build();
        applyExpiry(item, expiry);
        return item;
    }

    /**
     * 목록 세그먼트 상태. PortOne 실시간 상태는 목록에서 부르지 않고 이행 재시도 가능 실패만 정합 필요로 본다.
     */
    static String resolveLedgerState(
            ShopClientOrderStatus status, String paymentStatus, boolean retryable, String expiryState) {
        if (status == ShopClientOrderStatus.REFUNDED
                || Payment.PaymentStatus.REFUNDED.name().equals(paymentStatus)) {
            return ShopAdminOrderLedgerConstants.STATE_REFUNDED;
        }
        if (status == ShopClientOrderStatus.PAID) {
            if (retryable) {
                return ShopAdminOrderLedgerConstants.STATE_RECONCILE;
            }
            if (ShopOrderExpiryConstants.STATE_EXPIRED.equals(expiryState)) {
                return ShopAdminOrderLedgerConstants.STATE_EXPIRED;
            }
            if (ShopOrderExpiryConstants.STATE_EXPIRING_SOON.equals(expiryState)) {
                return ShopAdminOrderLedgerConstants.STATE_EXPIRING_SOON;
            }
            return ShopAdminOrderLedgerConstants.STATE_PAID;
        }
        if (status == ShopClientOrderStatus.EXPIRED || status == ShopClientOrderStatus.CANCELLED) {
            return ShopAdminOrderLedgerConstants.STATE_UNPAID;
        }
        return ShopAdminOrderLedgerConstants.STATE_PENDING;
    }

    private ShopOrderExpiryCalculator.Result evaluateExpiry(
            ShopClientOrder order,
            LocalDateTime paidAt,
            List<ShopClientOrderLine> lines,
            List<ShopOrderExpiryExtension> extensions) {
        List<Integer> months = lines.stream()
                .map(ShopClientOrderLine::getValidityMonthsSnapshot)
                .collect(Collectors.toList());
        Optional<ShopOrderExpiryExtension> latest = extensions.stream()
                .max(Comparator.comparing(ShopOrderExpiryExtension::getCreatedAt,
                                Comparator.nullsFirst(LocalDateTime::compareTo))
                        .thenComparing(ShopOrderExpiryExtension::getId, Comparator.nullsFirst(Long::compareTo)));
        return ShopOrderExpiryCalculator.evaluate(
                order.getStatus(),
                paidAt != null ? paidAt.toLocalDate() : null,
                months,
                latest.map(ShopOrderExpiryExtension::getNewExpireDate).orElse(null),
                extensions.size(),
                today());
    }

    private static void applyExpiry(ShopOrderAdminSummaryItem item, ShopOrderExpiryCalculator.Result expiry) {
        item.setExpiryState(expiry.state());
        item.setExpireDate(expiry.expireDate());
        item.setOriginalExpireDate(expiry.originalExpireDate());
        item.setDaysLeft(expiry.daysLeft());
        item.setValidityMonths(expiry.validityMonths());
        item.setExtensionCount(expiry.extensionCount());
        item.setSessionsUsable(expiry.sessionsUsable());
    }

    private static void applyExpiry(ShopOrderAdminDetailResponse detail, ShopOrderExpiryCalculator.Result expiry) {
        detail.setExpiryState(expiry.state());
        detail.setExpireDate(expiry.expireDate());
        detail.setOriginalExpireDate(expiry.originalExpireDate());
        detail.setDaysLeft(expiry.daysLeft());
        detail.setValidityMonths(expiry.validityMonths());
        detail.setExtensionCount(expiry.extensionCount());
        detail.setSessionsUsable(expiry.sessionsUsable());
    }

    private static LocalDateTime resolvePaidAt(ShopClientOrder order, List<Payment> payments) {
        if (order.getStatus() != ShopClientOrderStatus.PAID
                && order.getStatus() != ShopClientOrderStatus.REFUNDED) {
            return null;
        }
        return payments.stream()
                .map(Payment::getApprovedAt)
                .filter(Objects::nonNull)
                .min(LocalDateTime::compareTo)
                .orElse(order.getCreatedAt());
    }

    private static Optional<Payment> resolveLatestPayment(List<Payment> payments) {
        Comparator<Payment> byId = Comparator.comparing(Payment::getId, Comparator.nullsFirst(Long::compareTo));
        Optional<Payment> approved = payments.stream()
                .filter(p -> p.getStatus() == Payment.PaymentStatus.APPROVED).max(byId);
        if (approved.isPresent()) {
            return approved;
        }
        Optional<Payment> refunded = payments.stream()
                .filter(p -> p.getStatus() == Payment.PaymentStatus.REFUNDED).max(byId);
        if (refunded.isPresent()) {
            return refunded;
        }
        return payments.stream().max(byId);
    }

    private static boolean isDeletable(ShopClientOrder order, List<Payment> payments) {
        if (order.getStatus() == ShopClientOrderStatus.PAID
                || !ShopAdminOrderConstants.isDeletableStatus(order.getStatus())) {
            return false;
        }
        return payments.stream()
                .noneMatch(p -> ShopAdminOrderConstants.isLiveOrInFlightPaymentStatus(p.getStatus()));
    }

    private static String resolveProductTitle(List<ShopClientOrderLine> lines) {
        if (lines.isEmpty()) {
            return null;
        }
        ShopClientOrderLine first = lines.get(0);
        String title = StringUtils.hasText(first.getTitleSnapshot())
                ? first.getTitleSnapshot().trim()
                : first.getSkuCodeSnapshot();
        if (lines.size() == 1) {
            return title;
        }
        return String.format(PRODUCT_TITLE_MORE_FMT, title, lines.size() - 1);
    }

    private static Integer resolveSessionCount(List<ShopClientOrderLine> lines) {
        if (lines.isEmpty()) {
            return null;
        }
        int total = 0;
        for (ShopClientOrderLine line : lines) {
            Integer snapshot = line.getSessionCountSnapshot();
            int sessions = snapshot != null && snapshot >= ShopSessionCountConstants.MIN_SESSION_COUNT
                    ? snapshot
                    : ShopSessionCountConstants.MIN_SESSION_COUNT;
            int qty = line.getQuantity() != null && line.getQuantity() > 0 ? line.getQuantity() : 1;
            total += sessions * qty;
        }
        return total;
    }

    private static Long resolveAmount(Long pgAmount, ShopClientOrder order) {
        if (pgAmount != null) {
            return pgAmount;
        }
        if (order.getCashDueMinor() != null) {
            return order.getCashDueMinor();
        }
        return order.getSubtotalMinor();
    }

    private static List<ShopOrderAdminSummaryItem> filterByQuery(
            List<ShopOrderAdminSummaryItem> items, String query) {
        if (!StringUtils.hasText(query)) {
            return items;
        }
        String q = query.trim().toLowerCase(Locale.ROOT);
        String compactQ = q.replaceAll(NON_ALNUM_PATTERN, "");
        return items.stream().filter(item -> {
            String id = item.getOrderPublicId() != null ? item.getOrderPublicId().toLowerCase(Locale.ROOT) : "";
            String compactId = id.replaceAll(NON_ALNUM_PATTERN, "");
            String name = item.getClientName() != null ? item.getClientName().toLowerCase(Locale.ROOT) : "";
            String product = item.getProductTitle() != null ? item.getProductTitle().toLowerCase(Locale.ROOT) : "";
            return id.contains(q)
                    || (!compactQ.isEmpty() && compactId.contains(compactQ))
                    || name.contains(q)
                    || product.contains(q);
        }).collect(Collectors.toList());
    }

    private static Map<String, Long> countSegments(List<ShopOrderAdminSummaryItem> items) {
        Map<String, Long> counts = new LinkedHashMap<>();
        for (String segment : ShopAdminOrderLedgerConstants.SEGMENTS) {
            counts.put(segment, 0L);
        }
        counts.put(ShopAdminOrderLedgerConstants.SEGMENT_ALL, (long) items.size());
        for (ShopOrderAdminSummaryItem item : items) {
            counts.merge(item.getLedgerState(), 1L, Long::sum);
        }
        return counts;
    }

    static ShopOrderAdminListSummary summarize(List<ShopOrderAdminSummaryItem> items) {
        ShopOrderAdminListSummary s = new ShopOrderAdminListSummary();
        for (ShopOrderAdminSummaryItem item : items) {
            String state = item.getLedgerState();
            long amount = item.getAmountMinor() != null ? item.getAmountMinor() : 0L;
            long sessions = item.getSessionCount() != null ? item.getSessionCount() : 0L;
            if (ShopAdminOrderLedgerConstants.COLLECTED_STATES.contains(state)) {
                s.setInAmount(s.getInAmount() + amount);
                s.setInCount(s.getInCount() + 1);
                s.setInPoints(s.getInPoints() + item.getPointsRedeemMinor());
                if (ShopAdminOrderLedgerConstants.ACTIVE_GRANT_STATES.contains(state)) {
                    s.setInSessions(s.getInSessions() + sessions);
                } else {
                    s.setExpiredSessions(s.getExpiredSessions() + sessions);
                }
                if (ShopAdminOrderLedgerConstants.STATE_EXPIRING_SOON.equals(state)) {
                    s.setExpiringSoonCount(s.getExpiringSoonCount() + 1);
                }
            } else if (ShopAdminOrderLedgerConstants.STATE_REFUNDED.equals(state)) {
                s.setOutAmount(s.getOutAmount() + amount);
                s.setOutCount(s.getOutCount() + 1);
                s.setOutSessions(s.getOutSessions() + sessions);
            } else if (ShopAdminOrderLedgerConstants.STATE_PENDING.equals(state)) {
                s.setPendingCount(s.getPendingCount() + 1);
            } else if (ShopAdminOrderLedgerConstants.STATE_RECONCILE.equals(state)) {
                s.setReconcileCount(s.getReconcileCount() + 1);
            }
        }
        s.setNetAmount(s.getInAmount() - s.getOutAmount());
        return s;
    }

    private static String normalizeSegment(String segment) {
        if (!StringUtils.hasText(segment)) {
            return ShopAdminOrderLedgerConstants.SEGMENT_ALL;
        }
        String upper = segment.trim().toUpperCase(Locale.ROOT);
        return ShopAdminOrderLedgerConstants.SEGMENTS.contains(upper)
                ? upper
                : ShopAdminOrderLedgerConstants.SEGMENT_ALL;
    }

    private List<ShopOrderExpiryExtensionItem> toExtensionItems(
            List<ShopOrderExpiryExtension> extensions, Map<Long, String> names) {
        List<ShopOrderExpiryExtensionItem> out = new ArrayList<>(extensions.size());
        for (ShopOrderExpiryExtension ext : extensions) {
            out.add(ShopOrderExpiryExtensionItem.builder()
                    .id(ext.getId())
                    .extendedAt(ext.getCreatedAt())
                    .previousExpireDate(ext.getPreviousExpireDate())
                    .newExpireDate(ext.getNewExpireDate())
                    .reason(ext.getReason())
                    .extendedByUserId(ext.getExtendedByUserId())
                    .extendedByName(names.get(ext.getExtendedByUserId()))
                    .build());
        }
        return out;
    }

    private Map<Long, String> loadUserNames(String tenantId, Collection<Long> userIds) {
        if (userIds == null || userIds.isEmpty()) {
            return Collections.emptyMap();
        }
        Map<Long, String> names = new HashMap<>();
        for (User user : userRepository.findAllById(userIds)) {
            if (user == null || user.getId() == null || !tenantId.equals(user.getTenantId())) {
                continue;
            }
            names.put(user.getId(), personalDataEncryptionUtil.safeDecrypt(user.getName()));
        }
        return names;
    }

    private ShopClientOrder requireOrder(String tenantId, String orderPublicId) {
        if (!StringUtils.hasText(orderPublicId)) {
            throw new IllegalArgumentException(ShopAdminOrderConstants.MSG_ORDER_NOT_FOUND);
        }
        return shopClientOrderRepository.findByTenantIdAndPublicId(tenantId, orderPublicId.trim())
                .orElseThrow(() -> new IllegalArgumentException(ShopAdminOrderConstants.MSG_ORDER_NOT_FOUND));
    }

    private LocalDate today() {
        return LocalDate.now(clock);
    }

    private static long nullToZero(Long value) {
        return value != null ? value : 0L;
    }

    private static String requireTenant(String tenantId) {
        if (!StringUtils.hasText(tenantId)) {
            throw new IllegalArgumentException("tenantId가 필요합니다.");
        }
        return tenantId.trim();
    }
}
