package com.coresolution.consultation.sct.service.impl;

import java.time.LocalDateTime;
import java.util.List;
import com.coresolution.consultation.constant.AuditAction;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.AuditLog;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.entity.SystemConfig;
import com.coresolution.consultation.repository.SystemConfigRepository;
import com.coresolution.consultation.service.AuditLogService;
import com.coresolution.consultation.sct.constant.SctConsentKeys;
import com.coresolution.consultation.sct.constant.SctConstants;
import com.coresolution.consultation.sct.constant.SctFormType;
import com.coresolution.consultation.sct.dto.SctConsentRequest;
import com.coresolution.consultation.sct.dto.SctConsentStatusView;
import com.coresolution.consultation.sct.entity.SctConsent;
import com.coresolution.consultation.sct.entity.SctConsentTemplate;
import com.coresolution.consultation.sct.entity.SctInvitation;
import com.coresolution.consultation.sct.repository.SctConsentRepository;
import com.coresolution.consultation.sct.repository.SctConsentTemplateRepository;
import com.coresolution.consultation.sct.service.SctConsentService;
import com.coresolution.consultation.sct.util.SctTokenHasher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * SCT 동의 SSOT 구현.
 *
 * @author MindGarden
 * @since 2026-11-23
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SctConsentServiceImpl implements SctConsentService {

    private final SctConsentRepository consentRepository;
    private final SctConsentTemplateRepository consentTemplateRepository;
    private final AuditLogService auditLogService;
    private final SystemConfigRepository systemConfigRepository;

    @Override
    public String resolveSignerBand(String formType, boolean requiresGuardian) {
        if (requiresGuardian || SctFormType.CHILD.name().equals(formType)) {
            return SctConsentKeys.SIGNER_BAND_UNDER_14;
        }
        if (SctFormType.ADULT.name().equals(formType)) {
            return SctConsentKeys.SIGNER_BAND_ADULT;
        }
        return SctConsentKeys.SIGNER_BAND_TEEN_14_PLUS;
    }

    @Override
    @Transactional(readOnly = true)
    public SctConsentStatusView resolveStatus(SctInvitation invitation, String formType) {
        boolean requiresGuardian = Boolean.TRUE.equals(invitation.getRequiresGuardian())
                || SctFormType.CHILD.name().equals(formType);
        String band = resolveSignerBand(formType, requiresGuardian);
        boolean selfSig = !SctConsentKeys.SIGNER_BAND_UNDER_14.equals(band)
                || SctFormType.ADOLESCENT.name().equals(formType);
        // 아동(CHILD): 본인 서명 해당 없음. 14세 미만 청소년: 칸은 두되 법정대리인 필수.
        if (SctFormType.CHILD.name().equals(formType)) {
            selfSig = false;
        }
        boolean childNameOptional = SctFormType.CHILD.name().equals(formType);

        SctConsentTemplate sensitiveTpl = activeSensitive(formType);
        SctConsentTemplate guardianTpl = activeGuardian();

        boolean revoked = invitation.getClientId() != null
                && consentRepository.existsByTenantIdAndClientIdAndConsentTypeAndRevokedTrue(
                        invitation.getTenantId(), invitation.getClientId(),
                        SctConstants.CONSENT_SENSITIVE_INFO);

        boolean sensitiveOk = hasActiveConsent(
                invitation, SctConstants.CONSENT_SENSITIVE_INFO);
        boolean guardianOk = !requiresGuardian
                || hasActiveConsent(invitation, SctConstants.CONSENT_GUARDIAN_UNDER_14);
        boolean satisfied = !revoked && sensitiveOk && guardianOk;

        String mode = resolveGuardianVerifyMode(invitation.getTenantId());

        return SctConsentStatusView.builder()
                .signerBand(band)
                .requiresGuardian(requiresGuardian)
                .sensitiveRequired(!sensitiveOk)
                .guardianRequired(requiresGuardian && !guardianOk)
                .selfSignatureRequired(selfSig)
                .childNameOptional(childNameOptional)
                .satisfied(satisfied)
                .revoked(revoked)
                .sensitiveConsentTitle(sensitiveTpl == null ? null : sensitiveTpl.getTitle())
                .sensitiveConsentBody(sensitiveTpl == null ? null : sensitiveTpl.getBodyText())
                .sensitiveConsentVersion(sensitiveTpl == null ? null : sensitiveTpl.getVersion())
                .guardianConsentTitle(guardianTpl == null ? null : guardianTpl.getTitle())
                .guardianConsentBody(guardianTpl == null ? null : guardianTpl.getBodyText())
                .guardianConsentVersion(guardianTpl == null ? null : guardianTpl.getVersion())
                .guardianVerifyMode(mode)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public void requireSatisfied(SctInvitation invitation, String formType) {
        SctConsentStatusView status = resolveStatus(invitation, formType);
        if (status.isRevoked()) {
            throw new AccessDeniedException("동의가 철회되어 실시할 수 없습니다.");
        }
        if (!status.isSatisfied()) {
            throw new AccessDeniedException("필수 동의가 없습니다.");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public void assertNotRevokedForDispatch(String tenantId, Long clientId) {
        if (clientId == null) {
            return;
        }
        if (consentRepository.existsByTenantIdAndClientIdAndConsentTypeAndRevokedTrue(
                tenantId, clientId, SctConstants.CONSENT_SENSITIVE_INFO)) {
            throw new AccessDeniedException("동의가 철회되어 질문지를 발송할 수 없습니다.");
        }
    }

    @Override
    @Transactional
    public void recordPublicConsent(
            SctInvitation invitation,
            String formType,
            SctConsentRequest request,
            String clientIp,
            String userAgent) {
        if (request == null || !Boolean.TRUE.equals(request.getAgreed())) {
            throw new IllegalArgumentException("동의가 필요합니다.");
        }
        SctConsentStatusView status = resolveStatus(invitation, formType);
        if (status.isRevoked()) {
            throw new AccessDeniedException("동의가 철회되어 다시 동의할 수 없습니다. 센터에 문의해 주세요.");
        }

        String type = request.getConsentType();
        if (SctConstants.CONSENT_SENSITIVE_INFO.equals(type)) {
            recordSensitive(invitation, formType, status, request, clientIp, userAgent);
        } else if (SctConstants.CONSENT_GUARDIAN_UNDER_14.equals(type)) {
            recordGuardian(invitation, status, request, clientIp, userAgent);
        } else {
            throw new IllegalArgumentException("지원하지 않는 동의 유형입니다.");
        }
    }

    @Override
    @Transactional
    public void succeedUnlinkedToClient(
            String tenantId, Long invitationId, Long clientId, User actor) {
        List<SctConsent> unlinked = consentRepository
                .findByTenantIdAndInvitationIdAndClientIdIsNullAndRevokedFalse(tenantId, invitationId);
        if (unlinked.isEmpty()) {
            return;
        }
        for (SctConsent consent : unlinked) {
            consent.setClientId(clientId);
        }
        consentRepository.saveAll(unlinked);
        auditLogService.record(AuditLog.builder()
                .tenantId(tenantId)
                .actorUserId(actor == null ? null : actor.getId())
                .actorRole(actor == null || actor.getRole() == null ? null : actor.getRole().name())
                .targetUserId(clientId)
                .action(AuditAction.SCT_CONSENT_LINKED)
                .entityType(SctConstants.ENTITY_TYPE_CONSENT)
                .entityId(invitationId)
                .metadataJson("{\"count\":" + unlinked.size() + "}")
                .build());
    }

    @Override
    @Transactional
    public void revokeForClient(String tenantId, Long clientId, User actor) {
        if (actor == null || actor.getRole() != UserRole.ADMIN) {
            throw new AccessDeniedException("ADMIN만 동의를 철회할 수 있습니다.");
        }
        List<SctConsent> active = consentRepository
                .findByTenantIdAndClientIdAndRevokedFalse(tenantId, clientId);
        LocalDateTime now = LocalDateTime.now();
        for (SctConsent consent : active) {
            consent.setRevoked(true);
            consent.setRevokedAt(now);
            consent.setRevokedByUserId(actor.getId());
        }
        consentRepository.saveAll(active);
        auditLogService.record(AuditLog.builder()
                .tenantId(tenantId)
                .actorUserId(actor.getId())
                .actorRole(UserRole.ADMIN.name())
                .targetUserId(clientId)
                .action(AuditAction.SCT_CONSENT_REVOKED)
                .entityType(SctConstants.ENTITY_TYPE_CONSENT)
                .entityId(clientId)
                .metadataJson("{\"count\":" + active.size() + "}")
                .build());
    }

    private void recordSensitive(
            SctInvitation invitation,
            String formType,
            SctConsentStatusView status,
            SctConsentRequest request,
            String clientIp,
            String userAgent) {
        boolean under14 = status.isRequiresGuardian();
        if (under14) {
            // 아동·14세 미만: 법정대리인이 민감정보 동의 + 성명·관계
            if (!StringUtils.hasText(request.getGuardianName())
                    || !StringUtils.hasText(request.getGuardianRelation())) {
                throw new IllegalArgumentException("법정대리인 성명과 관계가 필요합니다.");
            }
        } else {
            // 성인·14세 이상: 본인 서명(성명)
            if (!StringUtils.hasText(request.getSignerName())) {
                throw new IllegalArgumentException("본인 서명이 필요합니다.");
            }
        }
        SctConsentTemplate tpl = activeSensitive(formType);
        SctConsent consent = upsertConsent(
                invitation, SctConstants.CONSENT_SENSITIVE_INFO, tpl, request, clientIp, userAgent);
        if (under14) {
            consent.setGuardianName(request.getGuardianName());
            consent.setGuardianRelation(request.getGuardianRelation());
            consent.setSignerName(request.getGuardianName());
        } else {
            consent.setSignerName(request.getSignerName());
        }
        if (StringUtils.hasText(request.getChildNameConfirm())) {
            consent.setChildNameConfirm(request.getChildNameConfirm());
        }
        consentRepository.save(consent);
        auditRecorded(invitation, consent);
    }

    private void recordGuardian(
            SctInvitation invitation,
            SctConsentStatusView status,
            SctConsentRequest request,
            String clientIp,
            String userAgent) {
        if (!status.isRequiresGuardian()) {
            throw new IllegalArgumentException("법정대리인 동의가 필요하지 않습니다.");
        }
        if (!StringUtils.hasText(request.getGuardianName())
                || !StringUtils.hasText(request.getGuardianRelation())) {
            throw new IllegalArgumentException("법정대리인 성명과 관계가 필요합니다.");
        }
        SctConsentTemplate tpl = activeGuardian();
        SctConsent consent = upsertConsent(
                invitation, SctConstants.CONSENT_GUARDIAN_UNDER_14, tpl, request, clientIp, userAgent);
        consent.setGuardianName(request.getGuardianName());
        consent.setGuardianRelation(request.getGuardianRelation());
        consent.setSignerName(request.getGuardianName());
        consentRepository.save(consent);
        auditRecorded(invitation, consent);
    }

    private SctConsent upsertConsent(
            SctInvitation invitation,
            String consentType,
            SctConsentTemplate tpl,
            SctConsentRequest request,
            String clientIp,
            String userAgent) {
        SctConsent consent = consentRepository
                .findByTenantIdAndInvitationIdAndConsentTypeAndRevokedFalse(
                        invitation.getTenantId(), invitation.getId(), consentType)
                .orElseGet(SctConsent::new);
        consent.setTenantId(invitation.getTenantId());
        consent.setInvitationId(invitation.getId());
        if (invitation.getClientId() != null) {
            consent.setClientId(invitation.getClientId());
        }
        consent.setConsentType(consentType);
        consent.setConsentTemplateVersion(tpl == null ? SctConsentKeys.TEMPLATE_VERSION_HANDOFF : tpl.getVersion());
        consent.setAgreed(true);
        consent.setRevoked(false);
        consent.setAgreedAt(LocalDateTime.now());
        consent.setIpHash(SctTokenHasher.sha256Hex(clientIp == null ? "unknown" : clientIp));
        consent.setUserAgentHash(userAgent == null ? null : SctTokenHasher.sha256Hex(userAgent));
        return consent;
    }

    private void auditRecorded(SctInvitation invitation, SctConsent consent) {
        auditLogService.record(AuditLog.builder()
                .tenantId(invitation.getTenantId())
                .targetUserId(invitation.getClientId())
                .action(AuditAction.SCT_CONSENT_RECORDED)
                .entityType(SctConstants.ENTITY_TYPE_CONSENT)
                .entityId(consent.getId())
                .metadataJson("{\"consentType\":\"" + consent.getConsentType()
                        + "\",\"invitationId\":" + invitation.getId() + "}")
                .build());
    }

    private boolean hasActiveConsent(SctInvitation invitation, String consentType) {
        if (invitation.getClientId() != null
                && consentRepository.existsByTenantIdAndClientIdAndConsentTypeAndAgreedTrueAndRevokedFalse(
                        invitation.getTenantId(), invitation.getClientId(), consentType)) {
            return true;
        }
        return consentRepository.existsByTenantIdAndInvitationIdAndConsentTypeAndAgreedTrueAndRevokedFalse(
                invitation.getTenantId(), invitation.getId(), consentType);
    }

    private SctConsentTemplate activeSensitive(String formType) {
        return consentTemplateRepository
                .findFirstByTenantIdAndConsentTypeAndFormTypeAndIsActiveTrueOrderByCreatedAtDesc(
                        SctConstants.CORE_TENANT_ID, SctConstants.CONSENT_SENSITIVE_INFO, formType)
                .or(() -> consentTemplateRepository
                        .findFirstByTenantIdAndConsentTypeAndIsActiveTrueOrderByCreatedAtDesc(
                                SctConstants.CORE_TENANT_ID, SctConstants.CONSENT_SENSITIVE_INFO))
                .orElse(null);
    }

    private SctConsentTemplate activeGuardian() {
        return consentTemplateRepository
                .findFirstByTenantIdAndConsentTypeAndFormTypeIsNullAndIsActiveTrueOrderByCreatedAtDesc(
                        SctConstants.CORE_TENANT_ID, SctConstants.CONSENT_GUARDIAN_UNDER_14)
                .or(() -> consentTemplateRepository
                        .findFirstByTenantIdAndConsentTypeAndIsActiveTrueOrderByCreatedAtDesc(
                                SctConstants.CORE_TENANT_ID, SctConstants.CONSENT_GUARDIAN_UNDER_14))
                .orElse(null);
    }

    private String resolveGuardianVerifyMode(String tenantId) {
        return systemConfigRepository
                .findByTenantIdAndConfigKeyAndIsActiveTrue(
                        tenantId, SctConsentKeys.CONFIG_GUARDIAN_VERIFY_MODE)
                .map(SystemConfig::getConfigValue)
                .filter(StringUtils::hasText)
                .or(() -> systemConfigRepository
                        .findByTenantIdAndConfigKeyAndIsActiveTrue(
                                "", SctConsentKeys.CONFIG_GUARDIAN_VERIFY_MODE)
                        .map(SystemConfig::getConfigValue)
                        .filter(StringUtils::hasText))
                .orElse(SctConsentKeys.GUARDIAN_VERIFY_CHECK_NAME_RELATION);
    }
}
