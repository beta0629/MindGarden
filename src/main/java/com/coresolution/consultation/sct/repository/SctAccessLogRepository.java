package com.coresolution.consultation.sct.repository;

import java.util.List;
import com.coresolution.consultation.sct.entity.SctAccessLog;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * SCT 열람 로그 Repository.
 *
 * @author MindGarden
 * @since 2026-11-23
 */
public interface SctAccessLogRepository extends JpaRepository<SctAccessLog, Long> {

    List<SctAccessLog> findByTenantIdAndInvitationIdOrderByAccessedAtDesc(
            String tenantId, Long invitationId);

    long countByTenantIdAndInvitationIdAndAction(String tenantId, Long invitationId, String action);
}
