package com.coresolution.consultation.service.impl;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import com.coresolution.consultation.constant.MappingStatusConstants;
import com.coresolution.consultation.constant.ShopClientOrderStatus;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.Payment;
import com.coresolution.consultation.entity.ShopClientOrder;
import com.coresolution.consultation.entity.ShopClientOrderLine;
import com.coresolution.consultation.repository.PaymentRepository;
import com.coresolution.consultation.repository.ShopClientOrderLineRepository;
import com.coresolution.consultation.repository.ShopClientOrderRepository;
import com.coresolution.consultation.service.ClientMappingListPayloadService;
import com.coresolution.consultation.service.UserPersonalDataCacheService;
import com.coresolution.core.context.TenantContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * {@link ClientMappingListPayloadService} 구현 — N+1 회피용 일괄 조회.
 *
 * <p>money-path SSOT: 주문라인 title/lineTotal · Payment.amount/status/provider · 주문 status/cashDue
 * 를 보강한다. 주문/Payment SSOT가 있으면 응답 {@code paymentStatus}/{@code paymentAmount} 도
 * effective·pgAmount 로 덮어써 매핑 스냅샷(CONFIRMED/package_price) 잔존을 숨기지 않는다.</p>
 *
 * @author CoreSolution
 * @since 2026-09-17
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ClientMappingListPayloadServiceImpl implements ClientMappingListPayloadService {

    private static final String UNKNOWN_CONSULTANT_NAME = "알 수 없음";
    private static final String DEFAULT_CONSULTANT_INTRO = "전문적이고 따뜻한 상담을 제공합니다.";

    private final ShopClientOrderLineRepository shopClientOrderLineRepository;
    private final ShopClientOrderRepository shopClientOrderRepository;
    private final PaymentRepository paymentRepository;
    private final UserPersonalDataCacheService userPersonalDataCacheService;

    /**
     * {@inheritDoc}
     */
    @Override
    public List<Map<String, Object>> buildPayloads(List<ConsultantClientMapping> mappings) {
        if (mappings == null || mappings.isEmpty()) {
            return Collections.emptyList();
        }

        String tenantId = TenantContextHolder.getTenantId();
        Map<Long, ShopClientOrderLine> lineByMappingId = loadLatestOrderLinesByMappingId(tenantId, mappings);
        Set<String> paymentReferences = collectPaymentReferences(mappings);
        Map<String, ShopClientOrder> orderByPublicId = loadOrdersByPublicId(tenantId, paymentReferences);
        Map<String, Payment> paymentByOrderId = loadPaymentsByOrderId(tenantId, paymentReferences);
        Map<String, ShopClientOrderLine> lineByOrderPublicId =
                loadLatestOrderLinesByOrderPublicId(tenantId, paymentReferences);

        List<Map<String, Object>> payloads = new ArrayList<>(mappings.size());
        for (ConsultantClientMapping mapping : mappings) {
            payloads.add(toPayload(
                    mapping, lineByMappingId, orderByPublicId, paymentByOrderId, lineByOrderPublicId));
        }
        return payloads;
    }

    private static Set<String> collectPaymentReferences(List<ConsultantClientMapping> mappings) {
        return mappings.stream()
                .map(ConsultantClientMapping::getPaymentReference)
                .filter(StringUtils::hasText)
                .map(String::trim)
                .collect(Collectors.toCollection(HashSet::new));
    }

    private Map<Long, ShopClientOrderLine> loadLatestOrderLinesByMappingId(
            String tenantId,
            List<ConsultantClientMapping> mappings) {
        if (!StringUtils.hasText(tenantId)) {
            log.warn("tenantId 미설정 — 주문 라인 보강을 건너뜁니다 (fail-closed)");
            return Collections.emptyMap();
        }
        Set<Long> mappingIds = mappings.stream()
                .map(ConsultantClientMapping::getId)
                .filter(Objects::nonNull)
                .collect(Collectors.toCollection(HashSet::new));
        if (mappingIds.isEmpty()) {
            return Collections.emptyMap();
        }

        List<ShopClientOrderLine> lines =
                shopClientOrderLineRepository
                        .findByTenantIdAndConsultantClientMappingIdInAndIsDeletedFalseOrderByIdDesc(
                                tenantId, mappingIds);
        Map<Long, ShopClientOrderLine> latestByMappingId = new HashMap<>();
        for (ShopClientOrderLine line : lines) {
            Long mappingId = line.getConsultantClientMappingId();
            if (mappingId == null) {
                continue;
            }
            latestByMappingId.putIfAbsent(mappingId, line);
        }
        return latestByMappingId;
    }

    private Map<String, ShopClientOrderLine> loadLatestOrderLinesByOrderPublicId(
            String tenantId,
            Set<String> publicIds) {
        if (!StringUtils.hasText(tenantId) || publicIds == null || publicIds.isEmpty()) {
            return Collections.emptyMap();
        }
        List<ShopClientOrderLine> lines =
                shopClientOrderLineRepository
                        .findByTenantIdAndClientOrderPublicIdInAndIsDeletedFalseOrderByIdDesc(
                                tenantId, publicIds);
        Map<String, ShopClientOrderLine> latestByPublicId = new HashMap<>();
        for (ShopClientOrderLine line : lines) {
            if (line.getClientOrder() == null || !StringUtils.hasText(line.getClientOrder().getPublicId())) {
                continue;
            }
            String publicId = line.getClientOrder().getPublicId().trim();
            latestByPublicId.putIfAbsent(publicId, line);
        }
        return latestByPublicId;
    }

    private Map<String, ShopClientOrder> loadOrdersByPublicId(String tenantId, Set<String> publicIds) {
        if (!StringUtils.hasText(tenantId) || publicIds == null || publicIds.isEmpty()) {
            return Collections.emptyMap();
        }
        List<ShopClientOrder> orders =
                shopClientOrderRepository.findByTenantIdAndPublicIdIn(tenantId, publicIds);
        Map<String, ShopClientOrder> byPublicId = new HashMap<>();
        for (ShopClientOrder order : orders) {
            if (!StringUtils.hasText(order.getPublicId())) {
                continue;
            }
            // paymentReference 조회 키는 trim — 라인/Payment 맵과 동일하게 publicId도 trim
            byPublicId.putIfAbsent(order.getPublicId().trim(), order);
        }
        return byPublicId;
    }

    private Map<String, Payment> loadPaymentsByOrderId(String tenantId, Set<String> orderIds) {
        if (!StringUtils.hasText(tenantId) || orderIds == null || orderIds.isEmpty()) {
            return Collections.emptyMap();
        }
        List<Payment> payments =
                paymentRepository.findByTenantIdAndOrderIdInAndIsDeletedFalse(tenantId, orderIds);
        Map<String, List<Payment>> grouped = new HashMap<>();
        for (Payment payment : payments) {
            if (!StringUtils.hasText(payment.getOrderId())) {
                continue;
            }
            grouped.computeIfAbsent(payment.getOrderId().trim(), k -> new ArrayList<>()).add(payment);
        }
        Map<String, Payment> preferredByOrderId = new HashMap<>();
        for (Map.Entry<String, List<Payment>> entry : grouped.entrySet()) {
            preferredByOrderId.put(entry.getKey(), preferPayment(entry.getValue()));
        }
        return preferredByOrderId;
    }

    /**
     * 동일 orderId 다중 결제 시 REFUNDED 우선, 없으면 id 최대(최신).
     *
     * @param payments 동일 주문 결제 목록
     * @return 대표 Payment
     */
    private static Payment preferPayment(List<Payment> payments) {
        return payments.stream()
                .filter(Objects::nonNull)
                .max(Comparator
                        .comparing((Payment p) -> p.getStatus() == Payment.PaymentStatus.REFUNDED)
                        .thenComparing(p -> p.getId() != null ? p.getId() : 0L))
                .orElse(payments.get(0));
    }

    private Map<String, Object> toPayload(
            ConsultantClientMapping mapping,
            Map<Long, ShopClientOrderLine> lineByMappingId,
            Map<String, ShopClientOrder> orderByPublicId,
            Map<String, Payment> paymentByOrderId,
            Map<String, ShopClientOrderLine> lineByOrderPublicId) {
        Map<String, Object> mappingInfo = new HashMap<>();
        mappingInfo.put("id", mapping.getId());
        mappingInfo.put("totalSessions", mapping.getTotalSessions());
        mappingInfo.put("usedSessions", mapping.getUsedSessions());
        mappingInfo.put("remainingSessions", mapping.getRemainingSessions());
        mappingInfo.put("packageName", mapping.getPackageName());
        mappingInfo.put("packagePrice", mapping.getPackagePrice());
        mappingInfo.put("paymentAmount", mapping.getPaymentAmount());
        mappingInfo.put(
                "paymentStatus",
                mapping.getPaymentStatus() != null ? mapping.getPaymentStatus().name() : null);
        mappingInfo.put("paymentMethod", mapping.getPaymentMethod());
        mappingInfo.put("paymentReference", mapping.getPaymentReference());
        mappingInfo.put("paymentDate", mapping.getPaymentDate());
        mappingInfo.put("status", mapping.getStatus());
        mappingInfo.put("createdAt", mapping.getCreatedAt());
        mappingInfo.put("assignedAt", mapping.getAssignedAt());

        String paymentReference =
                StringUtils.hasText(mapping.getPaymentReference()) ? mapping.getPaymentReference().trim() : null;

        ShopClientOrderLine line =
                mapping.getId() != null ? lineByMappingId.get(mapping.getId()) : null;
        if (line == null && paymentReference != null) {
            line = lineByOrderPublicId.get(paymentReference);
        }
        if (line != null) {
            // 표시 제목 SSOT = 주문라인 titleSnapshot (packageName은 레거시 매핑 스냅샷 유지)
            mappingInfo.put("productTitle", line.getTitleSnapshot());
            mappingInfo.put("lineTotalMinor", line.getLineTotalMinor());
        } else {
            mappingInfo.put("productTitle", null);
            mappingInfo.put("lineTotalMinor", null);
        }

        ShopClientOrder order = paymentReference != null ? orderByPublicId.get(paymentReference) : null;
        Payment payment = paymentReference != null ? paymentByOrderId.get(paymentReference) : null;

        if (order != null) {
            mappingInfo.put("orderStatus", order.getStatus() != null ? order.getStatus().name() : null);
            mappingInfo.put("cashDueMinor", order.getCashDueMinor());
        } else {
            mappingInfo.put("orderStatus", null);
            mappingInfo.put("cashDueMinor", null);
        }

        if (payment != null) {
            mappingInfo.put(
                    "paymentProvider",
                    payment.getProvider() != null ? payment.getProvider().name() : null);
            mappingInfo.put(
                    "pgPaymentStatus",
                    payment.getStatus() != null ? payment.getStatus().name() : null);
            Long pgAmount = toMinorLong(payment.getAmount());
            mappingInfo.put("pgAmount", pgAmount);
            // 1차 금액 필드 = PortOne/Payment.amount SSOT
            if (pgAmount != null) {
                mappingInfo.put("paymentAmount", pgAmount);
            }
        } else {
            mappingInfo.put("paymentProvider", null);
            mappingInfo.put("pgPaymentStatus", null);
            mappingInfo.put("pgAmount", null);
        }

        String effectivePaymentStatus =
                resolveEffectivePaymentStatus(mapping.getPaymentStatus(), order, payment);
        mappingInfo.put("effectivePaymentStatus", effectivePaymentStatus);
        // 주문/Payment SSOT가 있으면 1차 paymentStatus도 effective로 덮어쓴다 (스냅샷 CONFIRMED 잔존 방지)
        if (order != null || payment != null) {
            mappingInfo.put("paymentStatus", effectivePaymentStatus);
        }

        if (mapping.getConsultant() != null) {
            Map<String, Object> consultantInfo = new HashMap<>();
            consultantInfo.put("consultantId", mapping.getConsultant().getId());

            Map<String, String> decryptedConsultant =
                    userPersonalDataCacheService.getDecryptedUserData(mapping.getConsultant());
            String consultantName =
                    decryptedConsultant != null ? decryptedConsultant.get("name")
                            : mapping.getConsultant().getName();
            consultantInfo.put("consultantName",
                    consultantName != null ? consultantName : UNKNOWN_CONSULTANT_NAME);
            consultantInfo.put("specialty", mapping.getConsultant().getSpecialization());
            consultantInfo.put("intro", DEFAULT_CONSULTANT_INTRO);
            consultantInfo.put("profileImage", null);
            mappingInfo.put("consultant", consultantInfo);
        }

        return mappingInfo;
    }

    /**
     * 주문/PG 환불·취소면 해당 코드, 아니면 매핑 paymentStatus(진실 반영 — 미갱신 이력 행 포함).
     * REFUNDED가 CANCELLED보다 우선한다.
     *
     * @param mappingPaymentStatus 매핑 결제 상태
     * @param order 쇼핑 주문 (nullable)
     * @param payment PG 결제 (nullable)
     * @return effective 결제 상태 코드
     */
    private static String resolveEffectivePaymentStatus(
            ConsultantClientMapping.PaymentStatus mappingPaymentStatus,
            ShopClientOrder order,
            Payment payment) {
        if (order != null && order.getStatus() == ShopClientOrderStatus.REFUNDED) {
            return MappingStatusConstants.REFUNDED;
        }
        if (payment != null && payment.getStatus() == Payment.PaymentStatus.REFUNDED) {
            return MappingStatusConstants.REFUNDED;
        }
        if (order != null && order.getStatus() == ShopClientOrderStatus.CANCELLED) {
            return MappingStatusConstants.CANCELLED;
        }
        if (payment != null && payment.getStatus() == Payment.PaymentStatus.CANCELLED) {
            return MappingStatusConstants.CANCELLED;
        }
        return mappingPaymentStatus != null ? mappingPaymentStatus.name() : null;
    }

    private static Long toMinorLong(BigDecimal amount) {
        if (amount == null) {
            return null;
        }
        return amount.longValue();
    }
}
