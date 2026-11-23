package com.coresolution.consultation.sct.service.impl;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;
import com.coresolution.consultation.constant.AuditAction;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.AuditLog;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.exception.EntityNotFoundException;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.service.AuditLogService;
import com.coresolution.consultation.sct.constant.SctConstants;
import com.coresolution.consultation.sct.dto.SctDomainMemoResponse;
import com.coresolution.consultation.sct.dto.SctDomainMemoUpsertRequest;
import com.coresolution.consultation.sct.entity.SctDomainMemo;
import com.coresolution.consultation.sct.entity.SctInvitation;
import com.coresolution.consultation.sct.repository.SctDomainMemoRepository;
import com.coresolution.consultation.sct.repository.SctInvitationRepository;
import com.coresolution.consultation.sct.service.SctAccessLogService;
import com.coresolution.consultation.sct.service.SctDomainMemoService;
import com.coresolution.consultation.sct.service.SctFeatureGuard;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * SCT 영역 메모 서비스.
 *
 * @author MindGarden
 * @since 2026-11-23
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SctDomainMemoServiceImpl implements SctDomainMemoService {

    private final SctFeatureGuard sctFeatureGuard;
    private final SctInvitationRepository invitationRepository;
    private final SctDomainMemoRepository domainMemoRepository;
    private final ConsultantClientMappingRepository mappingRepository;
    private final AuditLogService auditLogService;
    private final SctAccessLogService sctAccessLogService;

    @Override
    @Transactional
    public List<SctDomainMemoResponse> list(
            String tenantId,
            User actor,
            Long invitationId,
            String clientIp,
            String userAgent) {
        sctFeatureGuard.requireEnabled(tenantId);
        requireStaffLike(actor);
        SctInvitation invitation = requireInvitation(tenantId, invitationId);
        ensureCanAccessClinicalBody(tenantId, actor, invitation);

        List<SctDomainMemoResponse> memos = domainMemoRepository
                .findByTenantIdAndInvitationIdAndIsDeletedFalse(tenantId, invitationId)
                .stream()
                .map(SctDomainMemoResponse::fromEntity)
                .collect(Collectors.toList());

        sctAccessLogService.logMemoView(
                invitation, actor.getId(), actor.getRole().name(), clientIp, userAgent);
        auditLogService.record(AuditLog.builder()
                .tenantId(tenantId)
                .actorUserId(actor.getId())
                .actorRole(actor.getRole().name())
                .targetUserId(invitation.getClientId())
                .action(AuditAction.SCT_DOMAIN_MEMO_VIEWED)
                .entityType(SctConstants.ENTITY_TYPE_DOMAIN_MEMO)
                .entityId(invitationId)
                .metadataJson("{\"count\":" + memos.size() + "}")
                .build());
        return memos;
    }

    @Override
    @Transactional
    public SctDomainMemoResponse upsert(
            String tenantId,
            User actor,
            Long invitationId,
            String domainCode,
            SctDomainMemoUpsertRequest request,
            String clientIp,
            String userAgent) {
        sctFeatureGuard.requireEnabled(tenantId);
        requireStaffLike(actor);
        if (request == null || request.getMemoText() == null) {
            throw new IllegalArgumentException("memoText가 필요합니다.");
        }
        String code = normalizeDomainCode(domainCode);
        SctInvitation invitation = requireInvitation(tenantId, invitationId);
        ensureCanAccessClinicalBody(tenantId, actor, invitation);

        SctDomainMemo memo = domainMemoRepository
                .findByTenantIdAndInvitationIdAndDomainCodeAndIsDeletedFalse(
                        tenantId, invitationId, code)
                .orElseGet(() -> {
                    SctDomainMemo created = SctDomainMemo.builder()
                            .invitationId(invitationId)
                            .domainCode(code)
                            .authorUserId(actor.getId())
                            .build();
                    created.setTenantId(tenantId);
                    created.setIsDeleted(false);
                    return created;
                });
        memo.setMemoText(request.getMemoText());
        memo.setAuthorUserId(actor.getId());
        SctDomainMemo saved = domainMemoRepository.save(memo);

        sctAccessLogService.logMemoSave(
                invitation, actor.getId(), actor.getRole().name(), clientIp, userAgent);
        auditLogService.record(AuditLog.builder()
                .tenantId(tenantId)
                .actorUserId(actor.getId())
                .actorRole(actor.getRole().name())
                .targetUserId(invitation.getClientId())
                .action(AuditAction.SCT_DOMAIN_MEMO_SAVED)
                .entityType(SctConstants.ENTITY_TYPE_DOMAIN_MEMO)
                .entityId(saved.getId())
                .metadataJson("{\"invitationId\":" + invitationId
                        + ",\"domainCode\":\"" + code + "\"}")
                .build());
        return SctDomainMemoResponse.fromEntity(saved);
    }

    private SctInvitation requireInvitation(String tenantId, Long invitationId) {
        return invitationRepository.findByTenantIdAndIdAndIsDeletedFalse(tenantId, invitationId)
                .orElseThrow(() -> new EntityNotFoundException("SCT 초대를 찾을 수 없습니다."));
    }

    private void requireStaffLike(User actor) {
        if (actor == null || actor.getRole() == null) {
            throw new AccessDeniedException("인증이 필요합니다.");
        }
        UserRole role = actor.getRole();
        if (role != UserRole.ADMIN && role != UserRole.STAFF && role != UserRole.CONSULTANT) {
            throw new AccessDeniedException("권한이 없습니다.");
        }
    }

    private void ensureCanAccessClinicalBody(String tenantId, User actor, SctInvitation invitation) {
        if (actor.getRole() == UserRole.ADMIN) {
            return;
        }
        if (actor.getRole() == UserRole.STAFF) {
            auditLogService.record(AuditLog.builder()
                    .tenantId(tenantId)
                    .actorUserId(actor.getId())
                    .actorRole(actor.getRole().name())
                    .targetUserId(invitation.getClientId())
                    .action(AuditAction.SCT_CLINICAL_ACCESS_DENIED)
                    .entityType(SctConstants.ENTITY_TYPE_INVITATION)
                    .entityId(invitation.getId())
                    .metadataJson("{\"managementNo\":\"" + invitation.getManagementNo() + "\"}")
                    .build());
            throw new AccessDeniedException("권한이 없습니다.");
        }
        if (actor.getRole() == UserRole.CONSULTANT) {
            if (!canConsultantAccess(tenantId, actor.getId(), invitation)) {
                throw new AccessDeniedException("담당 건만 접근할 수 있습니다.");
            }
            return;
        }
        throw new AccessDeniedException("권한이 없습니다.");
    }

    private boolean canConsultantAccess(String tenantId, Long consultantId, SctInvitation invitation) {
        if (Objects.equals(invitation.getConsultantId(), consultantId)) {
            return true;
        }
        if (invitation.getClientId() == null) {
            return false;
        }
        return !mappingRepository
                .findActiveOrExhaustedListByTenantIdAndConsultantIdAndClientId(
                        tenantId, consultantId, invitation.getClientId())
                .isEmpty();
    }

    private static String normalizeDomainCode(String domainCode) {
        if (!StringUtils.hasText(domainCode)) {
            throw new IllegalArgumentException("domainCode가 필요합니다.");
        }
        String trimmed = domainCode.trim();
        if (trimmed.length() > 64) {
            throw new IllegalArgumentException("domainCode가 너무 깁니다.");
        }
        return trimmed;
    }
}
