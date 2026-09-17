package com.coresolution.consultation.service.impl;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.Payment;
import com.coresolution.consultation.entity.ShopClientOrderLine;
import com.coresolution.consultation.repository.PaymentRepository;
import com.coresolution.consultation.repository.ShopClientOrderLineRepository;
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
        Map<String, Payment.PaymentProvider> providerByOrderId =
                loadProvidersByPaymentReference(tenantId, mappings);

        List<Map<String, Object>> payloads = new ArrayList<>(mappings.size());
        for (ConsultantClientMapping mapping : mappings) {
            payloads.add(toPayload(mapping, lineByMappingId, providerByOrderId));
        }
        return payloads;
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
            // id DESC 정렬이므로 최초 등장 = 최신
            latestByMappingId.putIfAbsent(mappingId, line);
        }
        return latestByMappingId;
    }

    private Map<String, Payment.PaymentProvider> loadProvidersByPaymentReference(
            String tenantId,
            List<ConsultantClientMapping> mappings) {
        if (!StringUtils.hasText(tenantId)) {
            return Collections.emptyMap();
        }
        Set<String> orderIds = mappings.stream()
                .map(ConsultantClientMapping::getPaymentReference)
                .filter(StringUtils::hasText)
                .map(String::trim)
                .collect(Collectors.toCollection(HashSet::new));
        if (orderIds.isEmpty()) {
            return Collections.emptyMap();
        }

        List<Payment> payments =
                paymentRepository.findByTenantIdAndOrderIdInAndIsDeletedFalse(tenantId, orderIds);
        Map<String, Payment.PaymentProvider> providerByOrderId = new HashMap<>();
        for (Payment payment : payments) {
            if (payment.getOrderId() == null || payment.getProvider() == null) {
                continue;
            }
            providerByOrderId.putIfAbsent(payment.getOrderId(), payment.getProvider());
        }
        return providerByOrderId;
    }

    private Map<String, Object> toPayload(
            ConsultantClientMapping mapping,
            Map<Long, ShopClientOrderLine> lineByMappingId,
            Map<String, Payment.PaymentProvider> providerByOrderId) {
        Map<String, Object> mappingInfo = new HashMap<>();
        mappingInfo.put("id", mapping.getId());
        mappingInfo.put("totalSessions", mapping.getTotalSessions());
        mappingInfo.put("usedSessions", mapping.getUsedSessions());
        mappingInfo.put("remainingSessions", mapping.getRemainingSessions());
        mappingInfo.put("packageName", mapping.getPackageName());
        mappingInfo.put("packagePrice", mapping.getPackagePrice());
        mappingInfo.put("paymentAmount", mapping.getPaymentAmount());
        mappingInfo.put("paymentStatus", mapping.getPaymentStatus());
        mappingInfo.put("paymentMethod", mapping.getPaymentMethod());
        mappingInfo.put("paymentReference", mapping.getPaymentReference());
        mappingInfo.put("paymentDate", mapping.getPaymentDate());
        mappingInfo.put("status", mapping.getStatus());
        mappingInfo.put("createdAt", mapping.getCreatedAt());
        mappingInfo.put("assignedAt", mapping.getAssignedAt());

        ShopClientOrderLine line =
                mapping.getId() != null ? lineByMappingId.get(mapping.getId()) : null;
        if (line != null) {
            mappingInfo.put("productTitle", line.getTitleSnapshot());
            mappingInfo.put("lineTotalMinor", line.getLineTotalMinor());
        } else {
            mappingInfo.put("productTitle", null);
            mappingInfo.put("lineTotalMinor", null);
        }

        String paymentReference = mapping.getPaymentReference();
        if (StringUtils.hasText(paymentReference)) {
            Payment.PaymentProvider provider = providerByOrderId.get(paymentReference.trim());
            mappingInfo.put("paymentProvider", provider != null ? provider.name() : null);
        } else {
            mappingInfo.put("paymentProvider", null);
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
}
