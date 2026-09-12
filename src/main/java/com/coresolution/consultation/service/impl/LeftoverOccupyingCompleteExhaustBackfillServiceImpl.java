package com.coresolution.consultation.service.impl;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import com.coresolution.consultation.constant.AuditAction;
import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.constant.SessionSuccessionConstants;
import com.coresolution.consultation.dto.LeftoverOccupyingCompleteExhaustBackfillResult;
import com.coresolution.consultation.entity.AuditLog;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.repository.AuditLogRepository;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.service.LeftoverOccupyingCompleteExhaustBackfillService;
import com.coresolution.consultation.util.LeftoverOccupyingCompleteExhaustBackfill;
import com.coresolution.consultation.util.LeftoverOccupyingCompleteExhaustBackfill.Decision;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.context.TenantIsolationValidator;
import com.coresolution.core.domain.Tenant;
import com.coresolution.core.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * leftover occupying 완료 rem 백필 구현. CANCELLED leftover 복구 쿼리와 분리한다.
 *
 * @author MindGarden
 * @since 2026-09-12
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class LeftoverOccupyingCompleteExhaustBackfillServiceImpl
        implements LeftoverOccupyingCompleteExhaustBackfillService {

    private static final List<ScheduleStatus> COMPLETED_ONLY = List.of(ScheduleStatus.COMPLETED);

    private final ConsultantClientMappingRepository mappingRepository;
    private final ScheduleRepository scheduleRepository;
    private final AuditLogRepository auditLogRepository;
    private final TenantRepository tenantRepository;

    @Override
    @Transactional
    public LeftoverOccupyingCompleteExhaustBackfillResult backfillTenant(String tenantId) {
        TenantIsolationValidator.requireTenantId(tenantId);
        TenantIsolationValidator.requireTenantIdMatch(tenantId);

        LeftoverOccupyingCompleteExhaustBackfillResult result =
                LeftoverOccupyingCompleteExhaustBackfillResult.builder().build();

        Map<Long, LocalDateTime> successionAtByMappingId = loadLatestSuccessionAt(tenantId);
        List<ConsultantClientMapping> candidates = loadCandidates(tenantId, successionAtByMappingId.keySet());
        result.setScanned(candidates.size());

        for (ConsultantClientMapping mapping : candidates) {
            processOne(tenantId, mapping, successionAtByMappingId, result);
        }

        log.info("leftover occupying exhaust backfill: tenantId={}, scanned={}, applied={}, "
                        + "skipOccupying={}, skipCancelled={}, skipTrueRemaining={}, skipOther={}",
                tenantId,
                result.getScanned(),
                result.getApplied(),
                result.getSkippedOccupyingInProgress(),
                result.getSkippedCancelled(),
                result.getSkippedTrueRemaining(),
                result.getSkippedOther());
        return result;
    }

    @Override
    public LeftoverOccupyingCompleteExhaustBackfillResult backfillAllActiveTenants() {
        LeftoverOccupyingCompleteExhaustBackfillResult total =
                LeftoverOccupyingCompleteExhaustBackfillResult.builder().build();
        List<Tenant> tenants = tenantRepository.findAllActive();
        for (Tenant tenant : tenants) {
            String tenantId = tenant.getTenantId();
            if (tenantId == null || tenantId.isBlank()) {
                log.warn("leftover occupying exhaust backfill skip: tenant row without tenantId id={}",
                        tenant.getId());
                continue;
            }
            String previousTenantId = TenantContextHolder.peekTenantId();
            try {
                TenantContextHolder.setTenantId(tenantId);
                total.add(backfillTenant(tenantId));
            } catch (RuntimeException ex) {
                log.warn("leftover occupying exhaust backfill tenant failed: tenantId={}, reason={}",
                        tenantId, ex.getMessage());
            } finally {
                TenantContextHolder.setTenantIdOrClear(previousTenantId);
            }
        }
        return total;
    }

    private void processOne(
            String tenantId,
            ConsultantClientMapping mapping,
            Map<Long, LocalDateTime> successionAtByMappingId,
            LeftoverOccupyingCompleteExhaustBackfillResult result) {
        Long mappingId = mapping.getId();
        boolean hasAudit = mappingId != null && successionAtByMappingId.containsKey(mappingId);
        Long consultantId = mapping.getConsultant() != null ? mapping.getConsultant().getId() : null;
        Long clientId = mapping.getClient() != null ? mapping.getClient().getId() : null;

        int occupyingInProgress = 0;
        List<Schedule> leftoverCompleted = List.of();
        if (mappingId != null && consultantId != null && clientId != null) {
            occupyingInProgress = (int) scheduleRepository.countOccupyingConsultationSchedulesForMapping(
                    tenantId,
                    mappingId,
                    consultantId,
                    clientId,
                    SessionSuccessionConstants.OCCUPYING_STATUSES_FOR_SUCCESSION);
            leftoverCompleted = scheduleRepository.findDeductedConsultationSchedulesForMapping(
                    tenantId, mappingId, consultantId, clientId, COMPLETED_ONLY);
        }

        LocalDateTime successionAt = resolveSuccessionAt(mapping, successionAtByMappingId);
        int leftoverDeducted = LeftoverOccupyingCompleteExhaustBackfill.countLeftoverOccupyingDeducted(
                leftoverCompleted, successionAt);
        Decision decision = LeftoverOccupyingCompleteExhaustBackfill.decide(
                mapping, occupyingInProgress, leftoverDeducted, hasAudit);
        boolean applied = LeftoverOccupyingCompleteExhaustBackfill.applyIfEligible(
                mapping, leftoverCompleted, occupyingInProgress, leftoverDeducted, hasAudit);
        if (applied) {
            mappingRepository.save(mapping);
            log.info("leftover occupying exhaust backfill applied: tenantId={}, mappingId={}",
                    tenantId, mappingId);
        }
        result.incrementSkipOrApply(
                applied,
                decision == Decision.SKIP_OCCUPYING_IN_PROGRESS,
                decision == Decision.SKIP_CANCELLED,
                decision == Decision.SKIP_TRUE_REMAINING);
    }

    private List<ConsultantClientMapping> loadCandidates(String tenantId, Set<Long> successionMappingIds) {
        Map<Long, ConsultantClientMapping> byId = new HashMap<>();
        List<ConsultantClientMapping> fromNotes = mappingRepository
                .findActiveWithRemainingAndSuccessionNotes(
                        tenantId,
                        MappingStatus.ACTIVE,
                        SessionSuccessionConstants.SOURCE_NOTE_TARGET_MAPPING_ARROW,
                        SessionSuccessionConstants.SOURCE_NOTE_MARKER);
        for (ConsultantClientMapping mapping : fromNotes) {
            if (mapping.getId() != null) {
                byId.put(mapping.getId(), mapping);
            }
        }
        Set<Long> missingAuditIds = new HashSet<>();
        for (Long mappingId : successionMappingIds) {
            if (mappingId != null && !byId.containsKey(mappingId)) {
                missingAuditIds.add(mappingId);
            }
        }
        if (!missingAuditIds.isEmpty()) {
            List<ConsultantClientMapping> fromAudit = mappingRepository
                    .findByTenantIdAndIdInAndIsDeletedFalse(tenantId, missingAuditIds);
            for (ConsultantClientMapping mapping : fromAudit) {
                if (mapping.getStatus() != MappingStatus.ACTIVE) {
                    continue;
                }
                Integer remaining = mapping.getRemainingSessions();
                if (remaining == null || remaining <= 0) {
                    continue;
                }
                byId.put(mapping.getId(), mapping);
            }
        }
        return new ArrayList<>(byId.values());
    }

    private Map<Long, LocalDateTime> loadLatestSuccessionAt(String tenantId) {
        List<AuditLog> logs = auditLogRepository.findByTenantIdAndActionAndEntityType(
                tenantId,
                AuditAction.MAPPING_SESSION_SUCCESSION,
                SessionSuccessionConstants.ENTITY_TYPE_MAPPING);
        Map<Long, LocalDateTime> latest = new HashMap<>();
        for (AuditLog entry : logs) {
            if (entry.getEntityId() == null || entry.getCreatedAt() == null) {
                continue;
            }
            LocalDateTime existing = latest.get(entry.getEntityId());
            if (existing == null || entry.getCreatedAt().isAfter(existing)) {
                latest.put(entry.getEntityId(), entry.getCreatedAt());
            }
        }
        return latest;
    }

    private static LocalDateTime resolveSuccessionAt(
            ConsultantClientMapping mapping,
            Map<Long, LocalDateTime> successionAtByMappingId) {
        if (mapping.getId() != null) {
            LocalDateTime fromAudit = successionAtByMappingId.get(mapping.getId());
            if (fromAudit != null) {
                return fromAudit;
            }
        }
        return mapping.getUpdatedAt();
    }
}
