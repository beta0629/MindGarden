package com.coresolution.consultation.sct.service;

import com.coresolution.consultation.constant.AuditAction;
import com.coresolution.consultation.entity.AuditLog;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.AuditLogService;
import com.coresolution.consultation.sct.constant.SctConstants;
import com.coresolution.consultation.sct.entity.SctInvitation;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * STAFF 임상 본문 403 감사 — 호출 트랜잭션 롤백과 분리({@link Propagation#REQUIRES_NEW}).
 *
 * <p>자기 호출 프록시 우회를 위해 별도 빈으로 둔다. 전역 {@link AuditLogService#record} 는 변경하지 않는다.</p>
 *
 * @author MindGarden
 * @since 2026-11-24
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SctClinicalAccessDeniedAuditWriter {

    private final AuditLogService auditLogService;

    /**
     * SCT_CLINICAL_ACCESS_DENIED 를 독립 트랜잭션으로 적재한다.
     *
     * @param tenantId   테넌트
     * @param actor      행위자(STAFF 등)
     * @param invitation 대상 초대
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void record(String tenantId, User actor, SctInvitation invitation) {
        if (invitation == null) {
            return;
        }
        auditLogService.record(AuditLog.builder()
                .tenantId(tenantId)
                .actorUserId(actor != null ? actor.getId() : null)
                .actorRole(actor != null && actor.getRole() != null ? actor.getRole().name() : null)
                .targetUserId(invitation.getClientId())
                .action(AuditAction.SCT_CLINICAL_ACCESS_DENIED)
                .entityType(SctConstants.ENTITY_TYPE_INVITATION)
                .entityId(invitation.getId())
                .metadataJson("{\"managementNo\":\"" + invitation.getManagementNo() + "\"}")
                .build());
    }
}
