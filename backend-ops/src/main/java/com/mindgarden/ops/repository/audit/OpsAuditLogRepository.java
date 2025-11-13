package com.mindgarden.ops.repository.audit;

import com.mindgarden.ops.domain.audit.OpsAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface OpsAuditLogRepository extends JpaRepository<OpsAuditLog, UUID> {
    List<OpsAuditLog> findTop100ByOrderByCreatedAtDesc();
    List<OpsAuditLog> findTop100ByEventTypeOrderByCreatedAtDesc(String eventType);
}
