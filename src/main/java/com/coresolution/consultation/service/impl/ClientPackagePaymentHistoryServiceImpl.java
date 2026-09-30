package com.coresolution.consultation.service.impl;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import com.coresolution.consultation.constant.admin.AdminServiceUserFacingMessages;
import com.coresolution.consultation.dto.ClientPackagePaymentHistoryResponse;
import com.coresolution.consultation.dto.PackagePaymentHistoryItemResponse;
import com.coresolution.consultation.dto.PackagePaymentHistorySummaryResponse;
import com.coresolution.consultation.dto.PackagePaymentHistoryType;
import com.coresolution.consultation.dto.PaymentSource;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.Payment;
import com.coresolution.consultation.entity.SessionExtensionRequest;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.PaymentRepository;
import com.coresolution.consultation.repository.SessionExtensionRequestRepository;
import com.coresolution.consultation.service.ClientPackagePaymentHistoryService;
import com.coresolution.consultation.service.UserPersonalDataCacheService;
import com.coresolution.consultation.util.PaymentSourceResolver;
import com.coresolution.consultation.util.SessionTransferHistoryMapper;
import com.coresolution.core.context.TenantContextHolder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * 내담자별 패키지 결제 이력 조회 구현.
 *
 * <p>매핑(TERMINATED 포함) + 회기추가 요청을 타임라인으로 정규화한다.
 * ACTIVE packageName 덮어쓰기·이중 ACTIVE를 유발하지 않는 읽기 전용 경로이다.</p>
 *
 * @author MindGarden
 * @since 2026-07-28
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ClientPackagePaymentHistoryServiceImpl implements ClientPackagePaymentHistoryService {

    private static final Pattern ACTIVE_MAPPING_ID_PATTERN =
            Pattern.compile("activeMappingId=(\\d+)");
    private static final Pattern TARGET_ACTIVE_MAPPING_ID_PATTERN =
            Pattern.compile("targetActiveMappingId=(\\d+)");
    private final ConsultantClientMappingRepository mappingRepository;
    private final SessionExtensionRequestRepository sessionExtensionRequestRepository;
    private final PaymentRepository paymentRepository;
    private final UserPersonalDataCacheService userPersonalDataCacheService;

    /**
     * {@inheritDoc}
     */
    @Override
    public ClientPackagePaymentHistoryResponse getPackagePaymentHistory(
            Long clientId, Long viewerConsultantId) {
        if (clientId == null) {
            throw new IllegalArgumentException("clientId는 필수입니다.");
        }
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null || tenantId.isBlank()) {
            throw new IllegalStateException("tenantId가 설정되지 않았습니다.");
        }

        log.info("내담자 패키지 결제 이력 조회: tenantId={}, clientId={}, viewerConsultantId={}",
                tenantId, clientId, viewerConsultantId);

        List<ConsultantClientMapping> mappings =
                mappingRepository.findAllByTenantIdAndClientIdWithDetails(tenantId, clientId);
        List<SessionExtensionRequest> extensions =
                sessionExtensionRequestRepository.findByTenantIdAndClientIdWithDetails(tenantId, clientId);
        Map<String, Payment> paymentByOrderId = loadPaymentsByOrderId(
                tenantId, collectPaymentReferences(mappings, extensions));

        List<PackagePaymentHistoryItemResponse> items = new ArrayList<>();
        for (ConsultantClientMapping mapping : mappings) {
            if (isTransferTerminationOnly(mapping)) {
                continue;
            }
            items.add(toMappingItem(mapping, mappings, extensions, paymentByOrderId));
        }
        for (SessionExtensionRequest extension : extensions) {
            items.add(toExtensionItem(extension, paymentByOrderId));
        }

        if (viewerConsultantId != null) {
            items = items.stream()
                    .filter(item -> viewerConsultantId.equals(item.getConsultantId()))
                    .collect(Collectors.toList());
        }

        items.sort(Comparator
                .comparing(PackagePaymentHistoryItemResponse::getPaymentDate,
                        Comparator.nullsLast(Comparator.reverseOrder()))
                .thenComparing(PackagePaymentHistoryItemResponse::getCreatedAt,
                        Comparator.nullsLast(Comparator.reverseOrder())));

        PackagePaymentHistorySummaryResponse summary = buildSummary(clientId, mappings, items);
        return ClientPackagePaymentHistoryResponse.builder()
                .summary(summary)
                .items(items)
                .build();
    }

    private PackagePaymentHistoryItemResponse toMappingItem(
            ConsultantClientMapping mapping,
            List<ConsultantClientMapping> allMappings,
            List<SessionExtensionRequest> extensions,
            Map<String, Payment> paymentByOrderId) {
        String notes = mapping.getNotes();
        PackagePaymentHistoryType type = isAdditionalPackageNotes(notes)
                ? PackagePaymentHistoryType.ADDITIONAL_PACKAGE
                : PackagePaymentHistoryType.INITIAL_MAPPING;

        User consultant = mapping.getConsultant();
        Long consultantId = consultant != null ? consultant.getId() : null;
        String consultantName = resolveUserName(consultant);

        LocalDateTime paymentDate = mapping.getPaymentDate() != null
                ? mapping.getPaymentDate()
                : mapping.getCreatedAt();

        Integer sessions = type == PackagePaymentHistoryType.ADDITIONAL_PACKAGE
                ? mapping.getTotalSessions()
                : resolveInitialDisplaySessions(mapping, allMappings, extensions);
        Long targetActiveMappingId = parseTargetActiveMappingId(notes);
        boolean mergedIntoActive = type == PackagePaymentHistoryType.ADDITIONAL_PACKAGE
                && mapping.getStatus() == ConsultantClientMapping.MappingStatus.TERMINATED
                && targetActiveMappingId != null;
        PaymentSource paymentSource = resolvePaymentSource(
                mapping.getPaymentReference(),
                paymentByOrderId,
                PaymentSourceResolver.hasAdminPaymentEvidence(
                        mapping.getPaymentMethod(), mapping.getPaymentStatus()));

        return PackagePaymentHistoryItemResponse.builder()
                .type(type)
                .paymentDate(paymentDate)
                .packageName(mapping.getPackageName())
                .sessions(sessions)
                .remainingSessions(resolveDisplayRemainingSessions(mapping, type))
                .mergedIntoActive(mergedIntoActive ? Boolean.TRUE : null)
                .amount(toBigDecimal(resolveMappingAmount(mapping)))
                .status(mapping.getStatus() != null ? mapping.getStatus().name() : null)
                .paymentStatus(mapping.getPaymentStatus() != null
                        ? mapping.getPaymentStatus().name() : null)
                .consultantId(consultantId)
                .consultantName(consultantName)
                .mappingId(mapping.getId())
                .extensionRequestId(null)
                .targetActiveMappingId(targetActiveMappingId)
                .paymentMethod(mapping.getPaymentMethod())
                .paymentReference(mapping.getPaymentReference())
                .paymentSource(paymentSource)
                .createdAt(mapping.getCreatedAt())
                .build();
    }

    /**
     * ACTIVE·소진 매핑의 현재 잔여. 추가패키지(합산 TERMINATED)에는 넣지 않아 잔여0 오해를 막는다.
     *
     * @param mapping 매핑
     * @param type 이력 유형
     * @return 잔여 회기 또는 null
     */
    private Integer resolveDisplayRemainingSessions(
            ConsultantClientMapping mapping,
            PackagePaymentHistoryType type) {
        if (type == PackagePaymentHistoryType.ADDITIONAL_PACKAGE) {
            return null;
        }
        ConsultantClientMapping.MappingStatus status = mapping.getStatus();
        if (status != ConsultantClientMapping.MappingStatus.ACTIVE
                && status != ConsultantClientMapping.MappingStatus.SESSIONS_EXHAUSTED) {
            return null;
        }
        return mapping.getRemainingSessions() != null ? mapping.getRemainingSessions() : 0;
    }

    /**
     * 최초매칭 행 회기 수 — 결제 당시 회기에 가깝게 표시.
     *
     * <p>표시 규칙(스냅샷 컬럼 없을 때):
     * {@code max(0, currentTotal − 병합추가패키지 − 승인회기추가 − 승계순변동)}.
     * 승계순변동 = notes 「수신 − 송출」(역승계 왕복 포함). 파싱 불가면 0(보정 없음).</p>
     *
     * @param mapping 최초 매칭 행
     * @param allMappings 동일 내담자 매핑
     * @param extensions 회기추가 요청
     * @return 표시용 회기 수
     */
    private Integer resolveInitialDisplaySessions(
            ConsultantClientMapping mapping,
            List<ConsultantClientMapping> allMappings,
            List<SessionExtensionRequest> extensions) {
        int total = mapping.getTotalSessions() != null ? mapping.getTotalSessions() : 0;
        ConsultantClientMapping.MappingStatus status = mapping.getStatus();
        if (status != ConsultantClientMapping.MappingStatus.ACTIVE
                && status != ConsultantClientMapping.MappingStatus.SESSIONS_EXHAUSTED) {
            return total;
        }

        int subtracted = 0;
        for (ConsultantClientMapping other : allMappings) {
            if (other.getId() == null || other.getId().equals(mapping.getId())) {
                continue;
            }
            if (!isAdditionalPackageNotes(other.getNotes())) {
                continue;
            }
            // 아직 합산 전(입금대기 등) 추가 패키지는 ACTIVE total에 반영되지 않음 → 차감 금지
            if (other.getStatus() != ConsultantClientMapping.MappingStatus.TERMINATED) {
                continue;
            }
            Long targetId = parseTargetActiveMappingId(other.getNotes());
            if (mapping.getId().equals(targetId)) {
                subtracted += other.getTotalSessions() != null ? other.getTotalSessions() : 0;
            }
        }
        for (SessionExtensionRequest extension : extensions) {
            if (extension.getMapping() == null
                    || !mapping.getId().equals(extension.getMapping().getId())) {
                continue;
            }
            SessionExtensionRequest.ExtensionStatus extStatus = extension.getStatus();
            if (extStatus != SessionExtensionRequest.ExtensionStatus.ADMIN_APPROVED
                    && extStatus != SessionExtensionRequest.ExtensionStatus.COMPLETED) {
                continue;
            }
            subtracted += extension.getAdditionalSessions() != null
                    ? extension.getAdditionalSessions() : 0;
        }
        int successionDelta = SessionTransferHistoryMapper.successionTotalDeltaFromNotes(
                mapping.getId(), mapping.getNotes());
        return Math.max(0, total - subtracted - successionDelta);
    }

    /**
     * 상담사 변경으로만 TERMINATED 된 행(추가 패키지 아님)은 결제 이력에서 제외.
     *
     * @param mapping 매핑
     * @return 제외 대상이면 true
     */
    private boolean isTransferTerminationOnly(ConsultantClientMapping mapping) {
        if (mapping.getStatus() != ConsultantClientMapping.MappingStatus.TERMINATED) {
            return false;
        }
        if (isAdditionalPackageNotes(mapping.getNotes())) {
            return false;
        }
        String reason = mapping.getTerminationReason();
        return reason != null && reason.contains("상담사 변경");
    }

    private PackagePaymentHistoryItemResponse toExtensionItem(
            SessionExtensionRequest extension,
            Map<String, Payment> paymentByOrderId) {
        ConsultantClientMapping mapping = extension.getMapping();
        User consultant = mapping != null ? mapping.getConsultant() : null;
        Long consultantId = consultant != null ? consultant.getId() : null;
        String consultantName = resolveUserName(consultant);
        Long mappingId = mapping != null ? mapping.getId() : null;

        LocalDateTime paymentDate = extension.getPaymentDate() != null
                ? extension.getPaymentDate()
                : extension.getCreatedAt();
        PaymentSource paymentSource = resolvePaymentSource(
                extension.getPaymentReference(),
                paymentByOrderId,
                PaymentSourceResolver.hasAdminPaymentEvidence(extension.getPaymentMethod()));

        return PackagePaymentHistoryItemResponse.builder()
                .type(PackagePaymentHistoryType.SESSION_EXTENSION)
                .paymentDate(paymentDate)
                .packageName(extension.getPackageName())
                .sessions(extension.getAdditionalSessions())
                .remainingSessions(null)
                .mergedIntoActive(null)
                .amount(extension.getPackagePrice())
                .status(extension.getStatus() != null ? extension.getStatus().name() : null)
                .paymentStatus(null)
                .consultantId(consultantId)
                .consultantName(consultantName)
                .mappingId(mappingId)
                .extensionRequestId(extension.getId())
                .targetActiveMappingId(mappingId)
                .paymentMethod(extension.getPaymentMethod())
                .paymentReference(extension.getPaymentReference())
                .paymentSource(paymentSource)
                .createdAt(extension.getCreatedAt())
                .build();
    }

    private static Set<String> collectPaymentReferences(
            List<ConsultantClientMapping> mappings,
            List<SessionExtensionRequest> extensions) {
        Set<String> refs = new HashSet<>();
        if (mappings != null) {
            for (ConsultantClientMapping mapping : mappings) {
                if (mapping != null && StringUtils.hasText(mapping.getPaymentReference())) {
                    refs.add(mapping.getPaymentReference().trim());
                }
            }
        }
        if (extensions != null) {
            for (SessionExtensionRequest extension : extensions) {
                if (extension != null && StringUtils.hasText(extension.getPaymentReference())) {
                    refs.add(extension.getPaymentReference().trim());
                }
            }
        }
        return refs;
    }

    private Map<String, Payment> loadPaymentsByOrderId(String tenantId, Collection<String> orderIds) {
        if (!StringUtils.hasText(tenantId) || orderIds == null || orderIds.isEmpty()) {
            return Collections.emptyMap();
        }
        List<Payment> payments =
                paymentRepository.findByTenantIdAndOrderIdInAndIsDeletedFalse(tenantId, orderIds);
        Map<String, Payment> byOrderId = new HashMap<>();
        for (Payment payment : payments) {
            if (payment == null || !StringUtils.hasText(payment.getOrderId())) {
                continue;
            }
            String key = payment.getOrderId().trim();
            Payment existing = byOrderId.get(key);
            if (existing == null
                    || (payment.getId() != null
                    && (existing.getId() == null || payment.getId() > existing.getId()))) {
                byOrderId.put(key, payment);
            }
        }
        return byOrderId;
    }

    private static PaymentSource resolvePaymentSource(
            String paymentReference,
            Map<String, Payment> paymentByOrderId,
            boolean hasAdminPaymentEvidence) {
        Payment payment = null;
        if (StringUtils.hasText(paymentReference) && paymentByOrderId != null) {
            payment = paymentByOrderId.get(paymentReference.trim());
        }
        return PaymentSourceResolver.resolve(payment, hasAdminPaymentEvidence);
    }

    private PackagePaymentHistorySummaryResponse buildSummary(
            Long clientId,
            List<ConsultantClientMapping> mappings,
            List<PackagePaymentHistoryItemResponse> items) {
        List<ConsultantClientMapping> activeMappings = mappings.stream()
                .filter(m -> m.getStatus() == ConsultantClientMapping.MappingStatus.ACTIVE)
                .collect(Collectors.toList());

        int totalSessions = activeMappings.stream()
                .mapToInt(m -> m.getTotalSessions() != null ? m.getTotalSessions() : 0)
                .sum();
        int remainingSessions = activeMappings.stream()
                .mapToInt(m -> m.getRemainingSessions() != null ? m.getRemainingSessions() : 0)
                .sum();

        BigDecimal totalAmount = items.stream()
                .map(PackagePaymentHistoryItemResponse::getAmount)
                .filter(a -> a != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        String clientName = AdminServiceUserFacingMessages.DISPLAY_NAME_UNKNOWN;
        String consultantName = null;
        if (!mappings.isEmpty()) {
            User client = mappings.get(0).getClient();
            clientName = resolveUserName(client);
        }
        if (!activeMappings.isEmpty()) {
            consultantName = resolveUserName(activeMappings.get(0).getConsultant());
        } else if (!items.isEmpty()) {
            consultantName = items.get(0).getConsultantName();
        }

        return PackagePaymentHistorySummaryResponse.builder()
                .clientId(clientId)
                .clientName(clientName)
                .consultantName(consultantName)
                .totalSessions(totalSessions)
                .remainingSessions(remainingSessions)
                .totalAmount(totalAmount)
                .itemCount(items.size())
                .build();
    }

    /**
     * 추가 패키지 notes 여부 — 마커 또는 병합 완료 문구.
     *
     * @param notes 매핑 notes
     * @return 추가 패키지이면 true
     */
    boolean isAdditionalPackageNotes(String notes) {
        if (notes == null || notes.isBlank()) {
            return false;
        }
        return notes.contains(AdminServiceUserFacingMessages.NOTES_ADDITIONAL_MAPPING_MARKER)
                || notes.contains(AdminServiceUserFacingMessages.NOTES_ADDITIONAL_MAPPING_MERGED_MARKER);
    }

    /**
     * notes에서 타깃 ACTIVE 매핑 ID를 파싱한다.
     *
     * @param notes 매핑 notes
     * @return 타깃 ID, 없으면 null
     */
    Long parseTargetActiveMappingId(String notes) {
        if (notes == null || notes.isBlank()) {
            return null;
        }
        Long fromTarget = firstLongGroup(TARGET_ACTIVE_MAPPING_ID_PATTERN, notes);
        if (fromTarget != null) {
            return fromTarget;
        }
        return firstLongGroup(ACTIVE_MAPPING_ID_PATTERN, notes);
    }

    private Long firstLongGroup(Pattern pattern, String text) {
        try {
            Matcher matcher = pattern.matcher(text);
            if (matcher.find()) {
                return Long.parseLong(matcher.group(1));
            }
        } catch (Exception e) {
            log.warn("타깃 ACTIVE 매핑 ID 파싱 실패: {}", e.getMessage());
        }
        return null;
    }

    private Long resolveMappingAmount(ConsultantClientMapping mapping) {
        if (mapping.getPaymentAmount() != null) {
            return mapping.getPaymentAmount();
        }
        if (mapping.getFinalAmount() != null) {
            return mapping.getFinalAmount();
        }
        return mapping.getPackagePrice();
    }

    private BigDecimal toBigDecimal(Long value) {
        return value != null ? BigDecimal.valueOf(value) : null;
    }

    private String resolveUserName(User user) {
        if (user == null) {
            return AdminServiceUserFacingMessages.DISPLAY_NAME_UNKNOWN;
        }
        try {
            Map<String, String> decrypted = userPersonalDataCacheService.getDecryptedUserData(user);
            if (decrypted != null && decrypted.get("name") != null && !decrypted.get("name").isBlank()) {
                return decrypted.get("name");
            }
        } catch (Exception e) {
            log.warn("사용자명 복호화 실패: userId={}, error={}", user.getId(), e.getMessage());
        }
        return user.getName() != null
                ? user.getName()
                : AdminServiceUserFacingMessages.DISPLAY_NAME_UNKNOWN;
    }
}
