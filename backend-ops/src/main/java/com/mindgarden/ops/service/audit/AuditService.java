package com.mindgarden.ops.service.audit;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mindgarden.ops.domain.audit.OpsAuditLog;
import com.mindgarden.ops.repository.audit.OpsAuditLogRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
public class AuditService {

    private final OpsAuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;

    public AuditService(OpsAuditLogRepository auditLogRepository, ObjectMapper objectMapper) {
        this.auditLogRepository = auditLogRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public List<OpsAuditLog> findRecent(String eventType) {
        if (eventType == null || eventType.isBlank()) {
            return auditLogRepository.findTop100ByOrderByCreatedAtDesc();
        }
        return auditLogRepository.findTop100ByEventTypeOrderByCreatedAtDesc(eventType);
    }

    @Transactional
    public void record(String eventType, String entityType, String entityId, String actorId, String actorRole, String action, Map<String, Object> metadata) {
        OpsAuditLog log = new OpsAuditLog();
        log.setEventType(eventType);
        log.setEntityType(entityType);
        log.setEntityId(entityId);
        log.setActorId(actorId);
        log.setActorRole(actorRole);
        log.setAction(action);
        if (metadata != null && !metadata.isEmpty()) {
            try {
                log.setMetadataJson(objectMapper.writeValueAsString(metadata));
            } catch (JsonProcessingException e) {
                log.setMetadataJson("{}");
            }
        }
        auditLogRepository.save(log);
    }
}
