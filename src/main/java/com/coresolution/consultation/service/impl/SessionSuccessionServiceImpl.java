package com.coresolution.consultation.service.impl;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import com.coresolution.consultation.constant.AuditAction;
import com.coresolution.consultation.constant.SessionSuccessionConstants;
import com.coresolution.consultation.dto.ClientRegistrationRequest;
import com.coresolution.consultation.dto.SessionSuccessionMappingSummary;
import com.coresolution.consultation.dto.SessionSuccessionNewClientRequest;
import com.coresolution.consultation.dto.SessionSuccessionPreviewResponse;
import com.coresolution.consultation.dto.SessionSuccessionRequest;
import com.coresolution.consultation.dto.SessionSuccessionResponse;
import com.coresolution.consultation.entity.AuditLog;
import com.coresolution.consultation.entity.Client;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.AdminService;
import com.coresolution.consultation.service.AuditLogService;
import com.coresolution.consultation.service.SessionSuccessionService;
import com.coresolution.core.service.impl.BaseTenantAwareService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.hibernate.Hibernate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 회기 승계 서비스 구현.
 *
 * <p>산식(PLAN §3.2): transferable = max(0, remaining − occupyingScheduleCount).
 * occupyingStatuses는 COMPLETED 비포함({@link SessionSuccessionConstants#OCCUPYING_STATUSES_FOR_SUCCESSION}).</p>
 *
 * @author CoreSolution
 * @since 2026-08-22
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SessionSuccessionServiceImpl extends BaseTenantAwareService implements SessionSuccessionService {

    private final ConsultantClientMappingRepository mappingRepository;
    private final ScheduleRepository scheduleRepository;
    private final UserRepository userRepository;
    private final AdminService adminService;
    private final AuditLogService auditLogService;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional(readOnly = true)
    public SessionSuccessionPreviewResponse preview(Long sourceMappingId) {
        String tenantId = getTenantId();
        ConsultantClientMapping source = requireSourceMapping(tenantId, sourceMappingId);
        SuccessionMetrics metrics = computeMetrics(tenantId, source);
        return toPreview(source, metrics);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public SessionSuccessionResponse execute(
            Long sourceMappingId,
            SessionSuccessionRequest request,
            Long actorUserId,
            String actorRole) {
        String tenantId = getTenantId();
        ConsultantClientMapping source = requireSourceMapping(tenantId, sourceMappingId);

        if (request.getTargetConsultantId() == null) {
            throw new IllegalArgumentException(SessionSuccessionConstants.MSG_TARGET_CONSULTANT_REQUIRED);
        }
        Integer sessionCount = request.getSessionCount();
        if (sessionCount == null || sessionCount < 1) {
            throw new IllegalArgumentException(SessionSuccessionConstants.MSG_INVALID_SESSION_COUNT);
        }

        SuccessionMetrics metrics = computeMetrics(tenantId, source);
        if (metrics.transferableSessions() < 1) {
            throw new IllegalStateException(SessionSuccessionConstants.MSG_ZERO_TRANSFERABLE);
        }
        if (sessionCount > metrics.transferableSessions()) {
            throw new IllegalArgumentException(SessionSuccessionConstants.MSG_EXCEEDS_TRANSFERABLE);
        }

        Long beneficiaryClientId = resolveBeneficiaryClientId(tenantId, source, request);
        User targetConsultant = requireTargetConsultant(tenantId, request.getTargetConsultantId());
        User beneficiary = userRepository.findByTenantIdAndId(tenantId, beneficiaryClientId)
                .orElseThrow(() -> new IllegalArgumentException(SessionSuccessionConstants.MSG_BENEFICIARY_NOT_FOUND));

        // 동시성: 재조회 후 산식 재검증
        source = requireSourceMapping(tenantId, sourceMappingId);
        metrics = computeMetrics(tenantId, source);
        if (sessionCount > metrics.transferableSessions()) {
            throw new IllegalStateException(SessionSuccessionConstants.MSG_CONCURRENCY);
        }

        ConsultantClientMapping target = findOrCreateTargetMapping(
                tenantId, source, targetConsultant, beneficiary, sessionCount, request);

        source.deductSessionsForSuccession(sessionCount);
        appendAuditNote(source, buildSourceNote(target, sessionCount, request.getReason()));
        mappingRepository.save(source);

        Hibernate.initialize(source.getConsultant());
        Hibernate.initialize(source.getClient());
        Hibernate.initialize(target.getConsultant());
        Hibernate.initialize(target.getClient());

        recordAuditLog(
                tenantId,
                actorUserId,
                actorRole,
                beneficiaryClientId,
                source,
                target,
                sessionCount,
                metrics.occupyingScheduleCount(),
                request.getReason());

        log.info("회기 승계 완료: sourceMappingId={}, targetMappingId={}, N={}, occupying={}",
                source.getId(), target.getId(), sessionCount, metrics.occupyingScheduleCount());

        return SessionSuccessionResponse.builder()
                .transferredCount(sessionCount)
                .occupyingScheduleCount(metrics.occupyingScheduleCount())
                .transferableSessionsBefore(metrics.transferableSessions())
                .sourceMapping(toSummary(source))
                .targetMapping(toSummary(target))
                .build();
    }

    private ConsultantClientMapping requireSourceMapping(String tenantId, Long sourceMappingId) {
        ConsultantClientMapping source = mappingRepository.findByTenantIdAndId(tenantId, sourceMappingId)
                .orElseThrow(() -> new IllegalArgumentException(SessionSuccessionConstants.MSG_SOURCE_NOT_FOUND));
        if (source.getStatus() != ConsultantClientMapping.MappingStatus.ACTIVE) {
            throw new IllegalStateException(SessionSuccessionConstants.MSG_SOURCE_NOT_ACTIVE);
        }
        Hibernate.initialize(source.getConsultant());
        Hibernate.initialize(source.getClient());
        return source;
    }

    private SuccessionMetrics computeMetrics(String tenantId, ConsultantClientMapping source) {
        Long consultantId = source.getConsultant() != null ? source.getConsultant().getId() : null;
        Long clientId = source.getClient() != null ? source.getClient().getId() : null;
        if (consultantId == null || clientId == null) {
            return new SuccessionMetrics(0, 0, 0);
        }
        int remaining = source.getRemainingSessions() != null ? source.getRemainingSessions() : 0;
        int occupying = (int) scheduleRepository.countOccupyingConsultationSchedulesForMapping(
                tenantId,
                source.getId(),
                consultantId,
                clientId,
                SessionSuccessionConstants.OCCUPYING_STATUSES_FOR_SUCCESSION);
        int transferable = Math.max(0, remaining - occupying);
        return new SuccessionMetrics(remaining, occupying, transferable);
    }

    private Long resolveBeneficiaryClientId(
            String tenantId,
            ConsultantClientMapping source,
            SessionSuccessionRequest request) {
        Long sourceClientId = source.getClient() != null ? source.getClient().getId() : null;
        if (request.getBeneficiaryClientId() != null) {
            Long beneficiaryId = request.getBeneficiaryClientId();
            if (sourceClientId != null && sourceClientId.equals(beneficiaryId)) {
                throw new IllegalArgumentException(SessionSuccessionConstants.MSG_SAME_CLIENT);
            }
            userRepository.findByTenantIdAndId(tenantId, beneficiaryId)
                    .orElseThrow(() -> new IllegalArgumentException(
                            SessionSuccessionConstants.MSG_BENEFICIARY_NOT_FOUND));
            return beneficiaryId;
        }
        SessionSuccessionNewClientRequest newClient = request.getNewClient();
        if (newClient == null) {
            throw new IllegalArgumentException(SessionSuccessionConstants.MSG_BENEFICIARY_REQUIRED);
        }
        ClientRegistrationRequest registration = ClientRegistrationRequest.builder()
                .name(newClient.getName())
                .phone(newClient.getPhone())
                .email(newClient.getEmail())
                .build();
        Client created = adminService.registerClient(registration);
        Long createdId = created.getId();
        if (sourceClientId != null && sourceClientId.equals(createdId)) {
            throw new IllegalArgumentException(SessionSuccessionConstants.MSG_SAME_CLIENT);
        }
        return createdId;
    }

    private User requireTargetConsultant(String tenantId, Long targetConsultantId) {
        User consultant = userRepository.findByTenantIdAndId(tenantId, targetConsultantId)
                .orElseThrow(() -> new IllegalArgumentException(
                        SessionSuccessionConstants.MSG_TARGET_CONSULTANT_NOT_FOUND));
        if (consultant.getRole() == null || !consultant.getRole().isProfessionalProvider()) {
            throw new IllegalArgumentException(SessionSuccessionConstants.MSG_NOT_CONSULTANT);
        }
        return consultant;
    }

    private ConsultantClientMapping findOrCreateTargetMapping(
            String tenantId,
            ConsultantClientMapping source,
            User targetConsultant,
            User beneficiary,
            int sessionCount,
            SessionSuccessionRequest request) {
        List<ConsultantClientMapping> candidates =
                mappingRepository.findActiveOrExhaustedListByTenantIdAndConsultantIdAndClientId(
                        tenantId, targetConsultant.getId(), beneficiary.getId());
        Optional<ConsultantClientMapping> activeOpt = candidates.stream()
                .filter(m -> m.getStatus() == ConsultantClientMapping.MappingStatus.ACTIVE)
                .findFirst();
        if (activeOpt.isPresent()) {
            ConsultantClientMapping active = activeOpt.get();
            active.addSessions(sessionCount);
            appendAuditNote(active, buildTargetNote(source, sessionCount, request.getReason()));
            return mappingRepository.save(active);
        }
        Optional<ConsultantClientMapping> exhaustedOpt = candidates.stream()
                .filter(m -> m.getStatus() == ConsultantClientMapping.MappingStatus.SESSIONS_EXHAUSTED)
                .findFirst();
        if (exhaustedOpt.isPresent()) {
            ConsultantClientMapping exhausted = exhaustedOpt.get();
            exhausted.addSessions(sessionCount);
            appendAuditNote(exhausted, buildTargetNote(source, sessionCount, request.getReason()));
            return mappingRepository.save(exhausted);
        }

        String packageName = request.getPackageName() != null && !request.getPackageName().isBlank()
                ? request.getPackageName()
                : source.getPackageName();
        Long packagePrice = request.getPackagePrice() != null
                ? request.getPackagePrice()
                : source.getPackagePrice();

        ConsultantClientMapping target = new ConsultantClientMapping();
        target.setTenantId(tenantId);
        target.setConsultant(targetConsultant);
        target.setClient(beneficiary);
        target.setStartDate(LocalDateTime.now());
        target.setStatus(ConsultantClientMapping.MappingStatus.ACTIVE);
        target.setPaymentStatus(ConsultantClientMapping.PaymentStatus.APPROVED);
        target.setTotalSessions(sessionCount);
        target.setRemainingSessions(sessionCount);
        target.setUsedSessions(0);
        target.setPackageName(packageName);
        target.setPackagePrice(packagePrice);
        target.setAssignedAt(LocalDateTime.now());
        target.setNotes(buildTargetNote(source, sessionCount, request.getReason()));
        return mappingRepository.save(target);
    }

    private void appendAuditNote(ConsultantClientMapping mapping, String line) {
        String existing = mapping.getNotes();
        mapping.setNotes(existing == null || existing.isBlank() ? line : existing + "\n" + line);
    }

    private String buildSourceNote(ConsultantClientMapping target, int n, String reason) {
        String base = String.format(
                "[회기 승계] %d회 → 타깃매핑#%d (수혜자#%d, 상담사#%d)",
                n,
                target.getId(),
                target.getClient() != null ? target.getClient().getId() : null,
                target.getConsultant() != null ? target.getConsultant().getId() : null);
        if (reason != null && !reason.isBlank()) {
            return base + " 사유: " + reason.trim();
        }
        return base;
    }

    private String buildTargetNote(ConsultantClientMapping source, int n, String reason) {
        String base = String.format(
                "[회기 승계] 소스매핑#%d에서 %d회 수령",
                source.getId(),
                n);
        if (reason != null && !reason.isBlank()) {
            return base + " 사유: " + reason.trim();
        }
        return base;
    }

    private void recordAuditLog(
            String tenantId,
            Long actorUserId,
            String actorRole,
            Long beneficiaryClientId,
            ConsultantClientMapping source,
            ConsultantClientMapping target,
            int sessionCount,
            int occupyingScheduleCount,
            String reason) {
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("sourceMappingId", source.getId());
        metadata.put("targetMappingId", target.getId());
        metadata.put("sessionCount", sessionCount);
        metadata.put("occupyingScheduleCount", occupyingScheduleCount);
        metadata.put("sourceConsultantId",
                source.getConsultant() != null ? source.getConsultant().getId() : null);
        metadata.put("sourceClientId",
                source.getClient() != null ? source.getClient().getId() : null);
        metadata.put("targetConsultantId",
                target.getConsultant() != null ? target.getConsultant().getId() : null);
        metadata.put("targetClientId",
                target.getClient() != null ? target.getClient().getId() : null);
        metadata.put("reason", reason);

        String metadataJson;
        try {
            metadataJson = objectMapper.writeValueAsString(metadata);
        } catch (JsonProcessingException e) {
            metadataJson = "{\"sessionCount\":" + sessionCount + "}";
        }

        AuditLog entry = AuditLog.builder()
                .tenantId(tenantId)
                .actorUserId(actorUserId)
                .actorRole(actorRole)
                .targetUserId(beneficiaryClientId)
                .action(AuditAction.MAPPING_SESSION_SUCCESSION)
                .entityType(SessionSuccessionConstants.ENTITY_TYPE_MAPPING)
                .entityId(source.getId())
                .metadataJson(metadataJson)
                .build();
        auditLogService.record(entry);
    }

    private SessionSuccessionPreviewResponse toPreview(
            ConsultantClientMapping source,
            SuccessionMetrics metrics) {
        return SessionSuccessionPreviewResponse.builder()
                .sourceMappingId(source.getId())
                .remainingSessions(metrics.remainingSessions())
                .usedSessions(source.getUsedSessions() != null ? source.getUsedSessions() : 0)
                .totalSessions(source.getTotalSessions() != null ? source.getTotalSessions() : 0)
                .occupyingScheduleCount(metrics.occupyingScheduleCount())
                .transferableSessions(metrics.transferableSessions())
                .consultantId(source.getConsultant() != null ? source.getConsultant().getId() : null)
                .consultantName(source.getConsultant() != null ? source.getConsultant().getName() : null)
                .clientId(source.getClient() != null ? source.getClient().getId() : null)
                .clientName(source.getClient() != null ? source.getClient().getName() : null)
                .packageName(source.getPackageName())
                .packagePrice(source.getPackagePrice())
                .status(source.getStatus() != null ? source.getStatus().name() : null)
                .build();
    }

    private SessionSuccessionMappingSummary toSummary(ConsultantClientMapping mapping) {
        return SessionSuccessionMappingSummary.builder()
                .id(mapping.getId())
                .remainingSessions(mapping.getRemainingSessions())
                .usedSessions(mapping.getUsedSessions())
                .totalSessions(mapping.getTotalSessions())
                .consultantId(mapping.getConsultant() != null ? mapping.getConsultant().getId() : null)
                .consultantName(mapping.getConsultant() != null ? mapping.getConsultant().getName() : null)
                .clientId(mapping.getClient() != null ? mapping.getClient().getId() : null)
                .clientName(mapping.getClient() != null ? mapping.getClient().getName() : null)
                .status(mapping.getStatus() != null ? mapping.getStatus().name() : null)
                .packageName(mapping.getPackageName())
                .build();
    }

    private record SuccessionMetrics(
            int remainingSessions,
            int occupyingScheduleCount,
            int transferableSessions) {
    }
}
