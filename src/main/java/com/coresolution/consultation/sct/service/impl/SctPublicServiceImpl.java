package com.coresolution.consultation.sct.service.impl;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;
import com.coresolution.consultation.constant.AuditAction;
import com.coresolution.consultation.entity.AuditLog;
import com.coresolution.consultation.exception.EntityNotFoundException;
import com.coresolution.consultation.service.AuditLogService;
import com.coresolution.consultation.sct.constant.SctConstants;
import com.coresolution.consultation.sct.constant.SctInviteStatus;
import com.coresolution.consultation.sct.dto.SctAnswerView;
import com.coresolution.consultation.sct.dto.SctConsentRequest;
import com.coresolution.consultation.sct.dto.SctDraftAnswerItem;
import com.coresolution.consultation.sct.dto.SctDraftSaveRequest;
import com.coresolution.consultation.sct.dto.SctPublicFormResponse;
import com.coresolution.consultation.sct.dto.SctPublicMetaResponse;
import com.coresolution.consultation.sct.dto.SctSubmitRequest;
import com.coresolution.consultation.sct.dto.SctVerifyRequest;
import com.coresolution.consultation.sct.dto.SctVerifyResponse;
import com.coresolution.consultation.sct.entity.SctConsent;
import com.coresolution.consultation.sct.entity.SctConsentTemplate;
import com.coresolution.consultation.sct.entity.SctFormItem;
import com.coresolution.consultation.sct.entity.SctFormTemplate;
import com.coresolution.consultation.sct.entity.SctInvitation;
import com.coresolution.consultation.sct.entity.SctInviteAccessAttempt;
import com.coresolution.consultation.sct.entity.SctResponseAnswer;
import com.coresolution.consultation.sct.exception.SctConflictException;
import com.coresolution.consultation.sct.exception.SctGoneException;
import com.coresolution.consultation.sct.exception.SctVerifyLockedException;
import com.coresolution.consultation.sct.repository.SctConsentRepository;
import com.coresolution.consultation.sct.repository.SctConsentTemplateRepository;
import com.coresolution.consultation.sct.repository.SctFormItemRepository;
import com.coresolution.consultation.sct.repository.SctFormTemplateRepository;
import com.coresolution.consultation.sct.repository.SctInvitationRepository;
import com.coresolution.consultation.sct.repository.SctInviteAccessAttemptRepository;
import com.coresolution.consultation.sct.repository.SctResponseAnswerRepository;
import com.coresolution.consultation.sct.service.SctFeatureGuard;
import com.coresolution.consultation.sct.service.SctPublicService;
import com.coresolution.consultation.sct.service.SctVerifySessionStore;
import com.coresolution.consultation.sct.util.SctTokenHasher;
import com.coresolution.consultation.util.LoginIdentifierUtils;
import com.coresolution.consultation.util.PhoneHashUtils;
import com.coresolution.consultation.util.PhoneLogMasking;
import com.coresolution.core.context.TenantContextHolder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * SCT 공개 API 서비스. 토큰 행의 tenantId 로 TenantContext 강제.
 *
 * @author MindGarden
 * @since 2026-11-23
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SctPublicServiceImpl implements SctPublicService {

    private final SctInvitationRepository invitationRepository;
    private final SctFormTemplateRepository formTemplateRepository;
    private final SctFormItemRepository formItemRepository;
    private final SctResponseAnswerRepository answerRepository;
    private final SctConsentRepository consentRepository;
    private final SctConsentTemplateRepository consentTemplateRepository;
    private final SctInviteAccessAttemptRepository attemptRepository;
    private final SctVerifySessionStore verifySessionStore;
    private final SctFeatureGuard sctFeatureGuard;
    private final AuditLogService auditLogService;

    @Override
    @Transactional
    public SctPublicMetaResponse getMeta(String rawToken) {
        SctInvitation invitation = loadByToken(rawToken);
        bindTenantAndGuard(invitation);
        assertReadable(invitation);
        SctFormTemplate template = requireTemplate(invitation.getFormTemplateId());
        int itemCount = (int) formItemRepository.countByFormTemplateId(template.getId());
        boolean hasDraft = SctInviteStatus.DRAFT.name().equals(invitation.getStatus())
                || !answerRepository.findByTenantIdAndInvitationId(
                        invitation.getTenantId(), invitation.getId()).isEmpty();
        return SctPublicMetaResponse.builder()
                .formType(template.getFormType())
                .title(template.getTitle())
                .status(invitation.getStatus())
                .itemCount(itemCount)
                .maskedPhoneHint(invitation.getTargetPhone() == null
                        ? null : PhoneLogMasking.maskForLog(invitation.getTargetPhone()))
                .maskedEmailHint(maskEmail(invitation.getTargetEmail()))
                .tokenExpiresAt(invitation.getTokenExpiresAt())
                .hasDraft(hasDraft)
                .requiresGuardian(Boolean.TRUE.equals(invitation.getRequiresGuardian()))
                .build();
    }

    @Override
    @Transactional
    public SctVerifyResponse verify(String rawToken, SctVerifyRequest request, String clientIp) {
        SctInvitation invitation = loadByToken(rawToken);
        bindTenantAndGuard(invitation);
        assertWritableOrVerify(invitation);
        if (invitation.getVerifyLockedUntil() != null
                && invitation.getVerifyLockedUntil().isAfter(LocalDateTime.now())) {
            throw new SctVerifyLockedException("검증이 잠겼습니다. 잠시 후 다시 시도하세요.");
        }
        boolean matched = matchesContact(invitation, request);
        String ipHash = SctTokenHasher.sha256Hex(clientIp == null ? "unknown" : clientIp);
        attemptRepository.save(SctInviteAccessAttempt.builder()
                .tenantId(invitation.getTenantId())
                .invitationId(invitation.getId())
                .success(matched)
                .ipHash(ipHash)
                .build());
        if (!matched) {
            int fails = invitation.getVerifyFailCount() == null ? 0 : invitation.getVerifyFailCount();
            fails++;
            invitation.setVerifyFailCount(fails);
            if (fails >= SctConstants.VERIFY_MAX_FAILURES) {
                invitation.setVerifyLockedUntil(
                        LocalDateTime.now().plusMinutes(SctConstants.VERIFY_LOCK_MINUTES));
            }
            invitationRepository.save(invitation);
            if (fails >= SctConstants.VERIFY_MAX_FAILURES) {
                throw new SctVerifyLockedException("검증 시도 횟수를 초과했습니다.");
            }
            throw new IllegalArgumentException("연락처가 일치하지 않습니다.");
        }
        invitation.setVerifyFailCount(0);
        invitation.setVerifyLockedUntil(null);
        if (invitation.getLinkOpenedAt() == null) {
            invitation.setLinkOpenedAt(LocalDateTime.now());
        }
        invitationRepository.save(invitation);
        String sessionId = verifySessionStore.issue(invitation.getId(), invitation.getTenantId());
        return SctVerifyResponse.builder()
                .verifySessionId(sessionId)
                .expiresInSeconds(SctConstants.VERIFY_SESSION_TTL_MINUTES * 60)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public SctPublicFormResponse getForm(String rawToken, String verifySessionId) {
        SctInvitation invitation = loadByToken(rawToken);
        bindTenantAndGuard(invitation);
        requireVerifySession(verifySessionId, invitation);
        assertReadable(invitation);
        SctFormTemplate template = requireTemplate(invitation.getFormTemplateId());
        List<SctFormItem> items = formItemRepository
                .findByFormTemplateIdOrderBySortOrderAsc(template.getId());
        List<SctResponseAnswer> answers = answerRepository
                .findByTenantIdAndInvitationId(invitation.getTenantId(), invitation.getId());
        List<SctAnswerView> views = items.stream().map(item -> {
            Optional<SctResponseAnswer> ans = answers.stream()
                    .filter(a -> Objects.equals(a.getFormItemId(), item.getId()))
                    .findFirst();
            return SctAnswerView.builder()
                    .formItemId(item.getId())
                    .itemNo(item.getItemNo())
                    .promptText(item.getPromptText())
                    .domainCode(item.getDomainCode())
                    .domainLabel(item.getDomainLabel())
                    .allowsNotApplicable(item.getAllowsNotApplicable())
                    .answerText(ans.map(SctResponseAnswer::getAnswerText).orElse(null))
                    .notApplicable(ans.map(SctResponseAnswer::getNotApplicable).orElse(false))
                    .isBlank(ans.map(SctResponseAnswer::getIsBlank).orElse(true))
                    .build();
        }).collect(Collectors.toList());

        SctConsentTemplate sensitive = activeConsent(SctConstants.CONSENT_SENSITIVE_INFO);
        SctConsentTemplate guardian = activeConsent(SctConstants.CONSENT_GUARDIAN_UNDER_14);
        boolean sensitiveDone = consentRepository
                .existsByTenantIdAndInvitationIdAndConsentTypeAndAgreedTrue(
                        invitation.getTenantId(), invitation.getId(),
                        SctConstants.CONSENT_SENSITIVE_INFO);
        boolean guardianDone = consentRepository
                .existsByTenantIdAndInvitationIdAndConsentTypeAndAgreedTrue(
                        invitation.getTenantId(), invitation.getId(),
                        SctConstants.CONSENT_GUARDIAN_UNDER_14);

        return SctPublicFormResponse.builder()
                .formType(template.getFormType())
                .title(template.getTitle())
                .instructionText(template.getInstructionText())
                .status(invitation.getStatus())
                .requiresGuardian(Boolean.TRUE.equals(invitation.getRequiresGuardian()))
                .sensitiveConsentRequired(!sensitiveDone)
                .guardianConsentRequired(
                        Boolean.TRUE.equals(invitation.getRequiresGuardian()) && !guardianDone)
                .sensitiveConsentTitle(sensitive == null ? null : sensitive.getTitle())
                .sensitiveConsentBody(sensitive == null ? null : sensitive.getBodyText())
                .guardianConsentTitle(guardian == null ? null : guardian.getTitle())
                .guardianConsentBody(guardian == null ? null : guardian.getBodyText())
                .items(views)
                .build();
    }

    @Override
    @Transactional
    public void saveDraft(String rawToken, SctDraftSaveRequest request) {
        SctInvitation invitation = loadByToken(rawToken);
        bindTenantAndGuard(invitation);
        requireVerifySession(request.getVerifySessionId(), invitation);
        assertWritable(invitation);
        if (request.getAnswers() != null) {
            for (SctDraftAnswerItem item : request.getAnswers()) {
                upsertAnswer(invitation, item);
            }
        }
        if (SctInviteStatus.SENT.name().equals(invitation.getStatus())) {
            invitation.setStatus(SctInviteStatus.DRAFT.name());
        }
        invitation.setDraftSavedAt(LocalDateTime.now());
        invitationRepository.save(invitation);
    }

    @Override
    @Transactional
    public void saveConsent(
            String rawToken, SctConsentRequest request, String clientIp, String userAgent) {
        SctInvitation invitation = loadByToken(rawToken);
        bindTenantAndGuard(invitation);
        requireVerifySession(request.getVerifySessionId(), invitation);
        assertWritable(invitation);
        if (!Boolean.TRUE.equals(request.getAgreed())) {
            throw new IllegalArgumentException("동의가 필요합니다.");
        }
        SctConsentTemplate template = activeConsent(request.getConsentType());
        String version = template == null ? null : template.getVersion();
        Optional<SctConsent> existing = consentRepository
                .findByTenantIdAndInvitationIdAndConsentType(
                        invitation.getTenantId(), invitation.getId(), request.getConsentType());
        SctConsent consent = existing.orElseGet(SctConsent::new);
        consent.setTenantId(invitation.getTenantId());
        consent.setInvitationId(invitation.getId());
        consent.setConsentType(request.getConsentType());
        consent.setConsentTemplateVersion(version);
        consent.setAgreed(true);
        consent.setGuardianName(request.getGuardianName());
        consent.setGuardianRelation(request.getGuardianRelation());
        consent.setAgreedAt(LocalDateTime.now());
        consent.setIpHash(SctTokenHasher.sha256Hex(clientIp == null ? "unknown" : clientIp));
        consent.setUserAgentHash(
                userAgent == null ? null : SctTokenHasher.sha256Hex(userAgent));
        consentRepository.save(consent);
    }

    @Override
    @Transactional
    public void submit(String rawToken, SctSubmitRequest request) {
        SctInvitation invitation = loadByToken(rawToken);
        bindTenantAndGuard(invitation);
        requireVerifySession(request.getVerifySessionId(), invitation);
        assertWritable(invitation);
        boolean sensitive = consentRepository
                .existsByTenantIdAndInvitationIdAndConsentTypeAndAgreedTrue(
                        invitation.getTenantId(), invitation.getId(),
                        SctConstants.CONSENT_SENSITIVE_INFO);
        if (!sensitive) {
            throw new IllegalArgumentException("민감정보 동의가 필요합니다.");
        }
        if (Boolean.TRUE.equals(invitation.getRequiresGuardian())) {
            boolean guardian = consentRepository
                    .existsByTenantIdAndInvitationIdAndConsentTypeAndAgreedTrue(
                            invitation.getTenantId(), invitation.getId(),
                            SctConstants.CONSENT_GUARDIAN_UNDER_14);
            if (!guardian) {
                throw new IllegalArgumentException("보호자 동의가 필요합니다.");
            }
        }
        invitation.setStatus(SctInviteStatus.SUBMITTED.name());
        invitation.setSubmittedAt(LocalDateTime.now());
        invitationRepository.save(invitation);
        auditLogService.record(AuditLog.builder()
                .tenantId(invitation.getTenantId())
                .action(AuditAction.SCT_RESPONSE_SUBMITTED)
                .entityType(SctConstants.ENTITY_TYPE_INVITATION)
                .entityId(invitation.getId())
                .targetUserId(invitation.getClientId())
                .metadataJson("{\"formTemplateId\":" + invitation.getFormTemplateId() + "}")
                .build());
    }

    private void upsertAnswer(SctInvitation invitation, SctDraftAnswerItem item) {
        if (item.getFormItemId() == null) {
            return;
        }
        formItemRepository.findByIdAndFormTemplateId(item.getFormItemId(), invitation.getFormTemplateId())
                .orElseThrow(() -> new IllegalArgumentException("문항이 올바르지 않습니다."));
        SctResponseAnswer answer = answerRepository
                .findByTenantIdAndInvitationIdAndFormItemId(
                        invitation.getTenantId(), invitation.getId(), item.getFormItemId())
                .orElseGet(SctResponseAnswer::new);
        answer.setTenantId(invitation.getTenantId());
        answer.setInvitationId(invitation.getId());
        answer.setFormItemId(item.getFormItemId());
        boolean na = Boolean.TRUE.equals(item.getNotApplicable());
        answer.setNotApplicable(na);
        String text = na ? null : item.getAnswerText();
        answer.setAnswerText(text);
        answer.setIsBlank(!na && (text == null || text.isBlank()));
        answerRepository.save(answer);
    }

    private SctInvitation loadByToken(String rawToken) {
        if (!StringUtils.hasText(rawToken)) {
            throw new EntityNotFoundException("SCT 링크를 찾을 수 없습니다.");
        }
        String hash = SctTokenHasher.sha256Hex(rawToken);
        return invitationRepository.findByTokenHashAndIsDeletedFalse(hash)
                .orElseThrow(() -> new EntityNotFoundException("SCT 링크를 찾을 수 없습니다."));
    }

    private void bindTenantAndGuard(SctInvitation invitation) {
        TenantContextHolder.setTenantId(invitation.getTenantId());
        sctFeatureGuard.requireEnabled(invitation.getTenantId());
        refreshExpired(invitation);
    }

    private void refreshExpired(SctInvitation invitation) {
        if (invitation.getTokenExpiresAt() != null
                && invitation.getTokenExpiresAt().isBefore(LocalDateTime.now())
                && (SctInviteStatus.SENT.name().equals(invitation.getStatus())
                || SctInviteStatus.DRAFT.name().equals(invitation.getStatus()))) {
            invitation.setStatus(SctInviteStatus.EXPIRED.name());
            invitationRepository.save(invitation);
        }
    }

    private void assertReadable(SctInvitation invitation) {
        if (SctInviteStatus.EXPIRED.name().equals(invitation.getStatus())
                || SctInviteStatus.CANCELLED.name().equals(invitation.getStatus())) {
            throw new SctGoneException("링크가 만료되었거나 취소되었습니다.");
        }
    }

    private void assertWritableOrVerify(SctInvitation invitation) {
        if (SctInviteStatus.EXPIRED.name().equals(invitation.getStatus())
                || SctInviteStatus.CANCELLED.name().equals(invitation.getStatus())) {
            throw new SctGoneException("링크가 만료되었거나 취소되었습니다.");
        }
        if (SctInviteStatus.SUBMITTED.name().equals(invitation.getStatus())) {
            throw new SctConflictException("이미 제출된 질문지입니다.");
        }
    }

    private void assertWritable(SctInvitation invitation) {
        assertWritableOrVerify(invitation);
    }

    private void requireVerifySession(String sessionId, SctInvitation invitation) {
        Optional<String> tenant = verifySessionStore.validate(sessionId, invitation.getId());
        if (tenant.isEmpty() || !tenant.get().equals(invitation.getTenantId())) {
            throw new IllegalArgumentException("본인 확인이 필요합니다.");
        }
    }

    private boolean matchesContact(SctInvitation invitation, SctVerifyRequest request) {
        if (request == null) {
            return false;
        }
        if (StringUtils.hasText(request.getPhone()) && invitation.getTargetPhoneHash() != null) {
            String normalized = LoginIdentifierUtils.normalizeKoreanMobileDigits(request.getPhone());
            return invitation.getTargetPhoneHash().equals(PhoneHashUtils.sha256Hex(normalized));
        }
        if (StringUtils.hasText(request.getEmail()) && invitation.getTargetEmailHash() != null) {
            String normalized = request.getEmail().trim().toLowerCase(Locale.ROOT);
            return invitation.getTargetEmailHash().equals(SctTokenHasher.sha256Hex(normalized));
        }
        return false;
    }

    private SctFormTemplate requireTemplate(Long id) {
        return formTemplateRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("양식을 찾을 수 없습니다."));
    }

    private SctConsentTemplate activeConsent(String type) {
        return consentTemplateRepository
                .findFirstByTenantIdAndConsentTypeAndIsActiveTrueOrderByCreatedAtDesc(
                        SctConstants.CORE_TENANT_ID, type)
                .orElse(null);
    }

    private static String maskEmail(String email) {
        if (email == null || email.isBlank()) {
            return null;
        }
        int at = email.indexOf('@');
        if (at <= 1) {
            return "***";
        }
        return email.charAt(0) + "***" + email.substring(at);
    }
}
