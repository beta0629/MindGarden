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
 * 임상 본문 403 감사 — 호출 트랜잭션 롤백과 분리({@link Propagation#REQUIRES_NEW}).
 *
 * <p>자기 호출 프록시 우회를 위해 별도 빈으로 둔다. 전역 {@link AuditLogService#record} 는 변경하지 않는다.
 * 거부+감사 단일 진입점은 {@link SctClinicalAccessDenySupport#denyAndThrow} 이다.</p>
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
     * @param actor      행위자
     * @param invitation 대상 초대(null 이고 fallback 없으면 생략)
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void record(String tenantId, User actor, SctInvitation invitation) {
        doRecord(tenantId, actor, invitation, null);
    }

    /**
     * SCT_CLINICAL_ACCESS_DENIED 적재. 초대가 없어도 {@code clientIdFallback} 이 있으면 기록한다.
     *
     * @param tenantId         테넌트
     * @param actor            행위자
     * @param invitation       대상 초대(없으면 null)
     * @param clientIdFallback 초대 null 일 때 targetUserId·metadata 용 clientId
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void record(String tenantId, User actor, SctInvitation invitation, Long clientIdFallback) {
        doRecord(tenantId, actor, invitation, clientIdFallback);
    }

    private void doRecord(
            String tenantId, User actor, SctInvitation invitation, Long clientIdFallback) {
        if (invitation == null && clientIdFallback == null) {
            return;
        }
        Long targetUserId = invitation != null ? invitation.getClientId() : clientIdFallback;
        Long entityId = invitation != null ? invitation.getId() : null;
        String metadataJson;
        if (invitation != null) {
            metadataJson = "{\"managementNo\":\"" + invitation.getManagementNo() + "\"}";
        } else {
            metadataJson = "{\"clientId\":" + clientIdFallback + "}";
        }
        auditLogService.record(AuditLog.builder()
                .tenantId(tenantId)
                .actorUserId(actor != null ? actor.getId() : null)
                .actorRole(actor != null && actor.getRole() != null ? actor.getRole().name() : null)
                .targetUserId(targetUserId)
                .action(AuditAction.SCT_CLINICAL_ACCESS_DENIED)
                .entityType(SctConstants.ENTITY_TYPE_INVITATION)
                .entityId(entityId)
                .metadataJson(metadataJson)
                .build());
    }
}
