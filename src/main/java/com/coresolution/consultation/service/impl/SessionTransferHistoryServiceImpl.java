package com.coresolution.consultation.service.impl;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import com.coresolution.consultation.constant.AuditAction;
import com.coresolution.consultation.constant.SessionSuccessionConstants;
import com.coresolution.consultation.constant.SessionTransferHistoryConstants;
import com.coresolution.consultation.dto.SessionTransferHistoryItemResponse;
import com.coresolution.consultation.dto.SessionTransferHistoryResponse;
import com.coresolution.consultation.entity.AuditLog;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ConsultantClientMappingHistory;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.exception.EntityNotFoundException;
import com.coresolution.consultation.repository.AuditLogRepository;
import com.coresolution.consultation.repository.ConsultantClientMappingHistoryRepository;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.SessionTransferHistoryService;
import com.coresolution.consultation.service.UserPersonalDataCacheService;
import com.coresolution.consultation.util.SessionTransferHistoryDraft;
import com.coresolution.consultation.util.SessionTransferHistoryMapper;
import com.coresolution.core.context.TenantContextHolder;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 회기 승계·이관 이력 조회 구현. 감사 로그를 1순위로 읽고, 매핑 이력·notes 는 공백 보완만 한다.
 *
 * @author CoreSolution
 * @since 2026-09-14
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SessionTransferHistoryServiceImpl implements SessionTransferHistoryService {

    private final AuditLogRepository auditLogRepository;
    private final ConsultantClientMappingHistoryRepository mappingHistoryRepository;
    private final ConsultantClientMappingRepository mappingRepository;
    private final UserRepository userRepository;
    private final UserPersonalDataCacheService userPersonalDataCacheService;
    private final ObjectMapper objectMapper;

    /**
     * {@inheritDoc}
     */
    @Override
    public SessionTransferHistoryResponse findByClientId(Long clientId) {
        if (clientId == null) {
            throw new IllegalArgumentException(SessionTransferHistoryConstants.MSG_CLIENT_ID_REQUIRED);
        }
        String tenantId = requireTenantId();
        log.info("회기 승계·이관 이력 조회: tenantId={}, clientId={}", tenantId, clientId);
        List<ConsultantClientMapping> clientMappings =
                mappingRepository.findAllByTenantIdAndClientIdWithDetails(tenantId, clientId);
        Set<Long> viewerMappingIds = new HashSet<>();
        for (ConsultantClientMapping mapping : clientMappings) {
            if (mapping.getId() != null) {
                viewerMappingIds.add(mapping.getId());
            }
        }
        return buildResponse(tenantId, clientMappings, clientId, null, viewerMappingIds);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public SessionTransferHistoryResponse findByMappingId(Long mappingId) {
        if (mappingId == null) {
            throw new IllegalArgumentException(SessionTransferHistoryConstants.MSG_MAPPING_ID_REQUIRED);
        }
        String tenantId = requireTenantId();
        log.info("회기 승계·이관 이력 조회: tenantId={}, mappingId={}", tenantId, mappingId);
        ConsultantClientMapping mapping = mappingRepository.findByTenantIdAndId(tenantId, mappingId)
                .orElseThrow(() -> new EntityNotFoundException(
                        SessionTransferHistoryConstants.MSG_MAPPING_NOT_FOUND));
        Long viewerClientId = mapping.getClient() != null ? mapping.getClient().getId() : null;
        Set<Long> viewerMappingIds = new HashSet<>();
        viewerMappingIds.add(mappingId);
        return buildResponse(tenantId, List.of(mapping), viewerClientId, mappingId, viewerMappingIds);
    }

    private SessionTransferHistoryResponse buildResponse(
            String tenantId,
            List<ConsultantClientMapping> seedMappings,
            Long viewerClientId,
            Long viewerMappingId,
            Set<Long> viewerMappingIds) {
        List<SessionTransferHistoryDraft> collected = new ArrayList<>();
        collected.addAll(collectFromAuditLogs(tenantId, viewerClientId, viewerMappingId, viewerMappingIds));

        Map<Long, ConsultantClientMapping> mappingsById = indexMappings(tenantId, seedMappings, collected);
        collected.addAll(collectFromMappingHistory(tenantId, mappingsById.keySet()));
        collected.addAll(collectFromNotes(mappingsById.values()));

        List<SessionTransferHistoryDraft> unique = SessionTransferHistoryMapper.dedupe(collected);
        List<SessionTransferHistoryDraft> related = new ArrayList<>();
        for (SessionTransferHistoryDraft draft : unique) {
            if (SessionTransferHistoryMapper.involvesViewer(
                    draft, viewerClientId, viewerMappingId, viewerMappingIds)) {
                related.add(draft);
            }
        }

        mappingsById.putAll(indexMappings(tenantId, List.of(), related));
        Map<Long, String> namesByUserId = loadUserNames(tenantId, mappingsById, related);

        List<SessionTransferHistoryItemResponse> items = new ArrayList<>();
        for (SessionTransferHistoryDraft draft : related) {
            Optional<String> direction = SessionTransferHistoryMapper.resolveDirection(
                    draft, viewerClientId, viewerMappingId);
            if (direction.isEmpty()) {
                continue;
            }
            enrichDraftFromMappings(draft, mappingsById);
            items.add(SessionTransferHistoryMapper.toItemResponse(
                    draft,
                    direction.get(),
                    resolveName(draft.getSourceClientId(), namesByUserId),
                    resolveName(draft.getTargetClientId(), namesByUserId),
                    resolveName(draft.getSourceConsultantId(), namesByUserId),
                    resolveName(draft.getTargetConsultantId(), namesByUserId)));
        }
        items.sort(Comparator
                .comparing(SessionTransferHistoryItemResponse::getOccurredAt,
                        Comparator.nullsLast(Comparator.reverseOrder()))
                .thenComparing(SessionTransferHistoryItemResponse::getId,
                        Comparator.nullsLast(Comparator.reverseOrder())));
        return SessionTransferHistoryResponse.builder().items(items).build();
    }

    private List<SessionTransferHistoryDraft> collectFromAuditLogs(
            String tenantId,
            Long viewerClientId,
            Long viewerMappingId,
            Set<Long> viewerMappingIds) {
        List<AuditLog> logs = auditLogRepository.findByTenantIdAndActionAndEntityType(
                tenantId,
                AuditAction.MAPPING_SESSION_SUCCESSION,
                SessionSuccessionConstants.ENTITY_TYPE_MAPPING);
        List<SessionTransferHistoryDraft> drafts = new ArrayList<>();
        for (AuditLog logEntry : logs) {
            Optional<SessionTransferHistoryDraft> parsed =
                    SessionTransferHistoryMapper.fromAuditLog(logEntry, objectMapper);
            if (parsed.isEmpty()) {
                continue;
            }
            SessionTransferHistoryDraft draft = parsed.get();
            if (SessionTransferHistoryMapper.involvesViewer(
                    draft, viewerClientId, viewerMappingId, viewerMappingIds)) {
                drafts.add(draft);
            }
        }
        return drafts;
    }

    private List<SessionTransferHistoryDraft> collectFromMappingHistory(String tenantId, Set<Long> mappingIds) {
        if (mappingIds == null || mappingIds.isEmpty()) {
            return List.of();
        }
        List<ConsultantClientMappingHistory> rows =
                mappingHistoryRepository.findByTenantIdAndMappingIdInOrderByCreatedAtDesc(tenantId, mappingIds);
        List<SessionTransferHistoryDraft> drafts = new ArrayList<>();
        for (ConsultantClientMappingHistory history : rows) {
            SessionTransferHistoryMapper.fromMappingHistory(history, objectMapper).ifPresent(drafts::add);
        }
        return drafts;
    }

    private List<SessionTransferHistoryDraft> collectFromNotes(Iterable<ConsultantClientMapping> mappings) {
        List<SessionTransferHistoryDraft> drafts = new ArrayList<>();
        for (ConsultantClientMapping mapping : mappings) {
            if (mapping == null) {
                continue;
            }
            Long clientId = mapping.getClient() != null ? mapping.getClient().getId() : null;
            Long consultantId = mapping.getConsultant() != null ? mapping.getConsultant().getId() : null;
            LocalDateTime fallbackAt = mapping.getUpdatedAt() != null
                    ? mapping.getUpdatedAt() : mapping.getCreatedAt();
            drafts.addAll(SessionTransferHistoryMapper.fromMappingNotes(
                    mapping.getId(), clientId, consultantId, mapping.getNotes(), fallbackAt));
        }
        return drafts;
    }

    private Map<Long, ConsultantClientMapping> indexMappings(
            String tenantId,
            List<ConsultantClientMapping> seedMappings,
            List<SessionTransferHistoryDraft> drafts) {
        Map<Long, ConsultantClientMapping> byId = new HashMap<>();
        for (ConsultantClientMapping mapping : seedMappings) {
            if (mapping != null && mapping.getId() != null) {
                byId.put(mapping.getId(), mapping);
            }
        }
        Set<Long> missing = new HashSet<>();
        for (SessionTransferHistoryDraft draft : drafts) {
            addIfMissing(byId, missing, draft.getSourceMappingId());
            addIfMissing(byId, missing, draft.getTargetMappingId());
        }
        if (!missing.isEmpty()) {
            List<ConsultantClientMapping> loaded =
                    mappingRepository.findByTenantIdAndIdInAndIsDeletedFalse(tenantId, missing);
            for (ConsultantClientMapping mapping : loaded) {
                byId.put(mapping.getId(), mapping);
            }
        }
        return byId;
    }

    private void addIfMissing(Map<Long, ConsultantClientMapping> byId, Set<Long> missing, Long mappingId) {
        if (mappingId != null && !byId.containsKey(mappingId)) {
            missing.add(mappingId);
        }
    }

    private void enrichDraftFromMappings(
            SessionTransferHistoryDraft draft,
            Map<Long, ConsultantClientMapping> mappingsById) {
        fillPartyFromMapping(draft, mappingsById.get(draft.getSourceMappingId()), true);
        fillPartyFromMapping(draft, mappingsById.get(draft.getTargetMappingId()), false);
    }

    private void fillPartyFromMapping(
            SessionTransferHistoryDraft draft,
            ConsultantClientMapping mapping,
            boolean source) {
        if (draft == null || mapping == null) {
            return;
        }
        Long clientId = mapping.getClient() != null ? mapping.getClient().getId() : null;
        Long consultantId = mapping.getConsultant() != null ? mapping.getConsultant().getId() : null;
        if (source) {
            if (draft.getSourceClientId() == null) {
                draft.setSourceClientId(clientId);
            }
            if (draft.getSourceConsultantId() == null) {
                draft.setSourceConsultantId(consultantId);
            }
        } else {
            if (draft.getTargetClientId() == null) {
                draft.setTargetClientId(clientId);
            }
            if (draft.getTargetConsultantId() == null) {
                draft.setTargetConsultantId(consultantId);
            }
        }
    }

    private Map<Long, String> loadUserNames(
            String tenantId,
            Map<Long, ConsultantClientMapping> mappingsById,
            List<SessionTransferHistoryDraft> drafts) {
        Set<Long> userIds = new HashSet<>();
        for (ConsultantClientMapping mapping : mappingsById.values()) {
            if (mapping.getClient() != null && mapping.getClient().getId() != null) {
                userIds.add(mapping.getClient().getId());
            }
            if (mapping.getConsultant() != null && mapping.getConsultant().getId() != null) {
                userIds.add(mapping.getConsultant().getId());
            }
        }
        for (SessionTransferHistoryDraft draft : drafts) {
            addUserId(userIds, draft.getSourceClientId());
            addUserId(userIds, draft.getTargetClientId());
            addUserId(userIds, draft.getSourceConsultantId());
            addUserId(userIds, draft.getTargetConsultantId());
        }
        Map<Long, String> names = new HashMap<>();
        if (userIds.isEmpty()) {
            return names;
        }
        List<User> users = userRepository.findByTenantIdAndIdInAndIsDeletedFalse(tenantId, userIds);
        for (User user : users) {
            names.put(user.getId(), resolveUserName(user));
        }
        return names;
    }

    private void addUserId(Set<Long> userIds, Long id) {
        if (id != null) {
            userIds.add(id);
        }
    }

    private String resolveName(Long userId, Map<Long, String> namesByUserId) {
        if (userId == null) {
            return SessionTransferHistoryConstants.UNKNOWN_NAME;
        }
        String name = namesByUserId.get(userId);
        if (name == null || name.isBlank()) {
            return SessionTransferHistoryConstants.UNKNOWN_NAME;
        }
        return name;
    }

    private String resolveUserName(User user) {
        if (user == null) {
            return SessionTransferHistoryConstants.UNKNOWN_NAME;
        }
        try {
            Map<String, String> decrypted = userPersonalDataCacheService.getDecryptedUserData(user);
            if (decrypted != null) {
                String name = decrypted.get("name");
                if (name != null && !name.isBlank()) {
                    return name;
                }
            }
        } catch (Exception e) {
            log.warn("사용자명 복호화 실패: userId={}, error={}", user.getId(), e.getMessage());
        }
        return user.getName() != null && !user.getName().isBlank()
                ? user.getName()
                : SessionTransferHistoryConstants.UNKNOWN_NAME;
    }

    private String requireTenantId() {
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null || tenantId.isBlank()) {
            throw new IllegalStateException(SessionTransferHistoryConstants.MSG_TENANT_REQUIRED);
        }
        return tenantId;
    }
}
