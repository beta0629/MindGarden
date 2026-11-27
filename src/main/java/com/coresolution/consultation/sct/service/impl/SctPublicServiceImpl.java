package com.coresolution.consultation.sct.service.impl;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;
import com.coresolution.consultation.constant.AuditAction;
import com.coresolution.consultation.entity.AuditLog;
import com.coresolution.consultation.exception.EntityNotFoundException;
import com.coresolution.consultation.service.AuditLogService;
import com.coresolution.consultation.sct.constant.SctConsentKeys;
import com.coresolution.consultation.sct.constant.SctConstants;
import com.coresolution.consultation.sct.constant.SctFormType;
import com.coresolution.consultation.sct.constant.SctInviteStatus;
import com.coresolution.consultation.sct.dto.SctAnswerView;
import com.coresolution.consultation.sct.dto.SctConsentRequest;
import com.coresolution.consultation.sct.dto.SctConsentStatusView;
import com.coresolution.consultation.sct.dto.SctDraftAnswerItem;
import com.coresolution.consultation.sct.dto.SctDraftSaveRequest;
import com.coresolution.consultation.sct.dto.SctPublicFormResponse;
import com.coresolution.consultation.sct.dto.SctPublicMetaResponse;
import com.coresolution.consultation.sct.dto.SctSubmitRequest;
import com.coresolution.consultation.sct.dto.SctVerifyRequest;
import com.coresolution.consultation.sct.dto.SctVerifyResponse;
import com.coresolution.consultation.sct.entity.SctFormItem;
import com.coresolution.consultation.sct.entity.SctFormTemplate;
import com.coresolution.consultation.sct.entity.SctInvitation;
import com.coresolution.consultation.sct.entity.SctInviteAccessAttempt;
import com.coresolution.consultation.sct.entity.SctResponseAnswer;
import com.coresolution.consultation.sct.entity.SctRotatedTokenHash;
import com.coresolution.consultation.sct.exception.SctConflictException;
import com.coresolution.consultation.sct.exception.SctGoneException;
import com.coresolution.consultation.sct.exception.SctVerifyLockedException;
import com.coresolution.consultation.sct.exception.SctVerifyRequiredException;
import com.coresolution.consultation.sct.repository.SctFormItemRepository;
import com.coresolution.consultation.sct.repository.SctFormTemplateRepository;
import com.coresolution.consultation.sct.repository.SctInvitationRepository;
import com.coresolution.consultation.sct.repository.SctInviteAccessAttemptRepository;
import com.coresolution.consultation.sct.repository.SctResponseAnswerRepository;
import com.coresolution.consultation.sct.repository.SctRotatedTokenHashRepository;
import com.coresolution.consultation.sct.service.SctConsentService;
import com.coresolution.consultation.sct.service.SctExchangeCodeStore;
import com.coresolution.consultation.sct.service.SctFeatureGuard;
import com.coresolution.consultation.sct.service.SctPublicService;
import com.coresolution.consultation.sct.service.SctSettingsService;
import com.coresolution.consultation.sct.service.SctVerifySessionStore;
import com.coresolution.consultation.sct.util.SctTokenHasher;
import com.coresolution.consultation.util.LoginIdentifierUtils;
import com.coresolution.consultation.util.PhoneHashUtils;
import com.coresolution.core.context.TenantContextHolder;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.OptimisticLockingFailureException;
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

    /** 동시 임시저장(@Version) 충돌 시 재시도 상한. */
    private static final int DRAFT_OPTIMISTIC_LOCK_MAX_ATTEMPTS = 3;

    /** 초대 tokenExpiresAt(LocalDateTime) → Instant 변환 존. */
    private static final ZoneId TOKEN_EXPIRY_ZONE = ZoneId.of("Asia/Seoul");

    private final SctInvitationRepository invitationRepository;
    private final SctFormTemplateRepository formTemplateRepository;
    private final SctFormItemRepository formItemRepository;
    private final SctResponseAnswerRepository answerRepository;
    private final SctInviteAccessAttemptRepository attemptRepository;
    private final SctRotatedTokenHashRepository rotatedTokenHashRepository;
    private final SctVerifySessionStore verifySessionStore;
    private final SctExchangeCodeStore exchangeCodeStore;
    private final SctFeatureGuard sctFeatureGuard;
    private final SctConsentService sctConsentService;
    private final SctSettingsService sctSettingsService;
    private final AuditLogService auditLogService;

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    @Transactional
    public SctPublicMetaResponse getMeta(String rawToken) {
        ResolvedPublicToken resolved = resolveTokenForMeta(rawToken);
        SctInvitation invitation = resolved.invitation();
        bindTenantAndGuard(invitation);
        SctFormTemplate template = requireTemplate(invitation.getFormTemplateId());
        int itemCount = (int) formItemRepository.countByFormTemplateId(template.getId());
        boolean hasDraft = SctInviteStatus.DRAFT.name().equals(invitation.getStatus())
                || !answerRepository.findByTenantIdAndInvitationId(
                        invitation.getTenantId(), invitation.getId()).isEmpty();
        boolean requiresGuardian = Boolean.TRUE.equals(invitation.getRequiresGuardian());
        String channel = null;
        if (StringUtils.hasText(invitation.getTargetPhoneHash())) {
            channel = SctConsentKeys.CHANNEL_PHONE;
        } else if (StringUtils.hasText(invitation.getTargetEmailHash())) {
            channel = SctConsentKeys.CHANNEL_EMAIL;
        }
        String status = StringUtils.hasText(resolved.statusOverride())
                ? resolved.statusOverride()
                : invitation.getStatus();
        return SctPublicMetaResponse.builder()
                .formType(template.getFormType())
                .title(template.getTitle())
                .status(status)
                .itemCount(itemCount)
                .verifyChannelHint(channel)
                .tokenExpiresAt(invitation.getTokenExpiresAt())
                .hasDraft(hasDraft)
                .requiresGuardian(requiresGuardian)
                .signerBand(sctConsentService.resolveSignerBand(template.getFormType(), requiresGuardian))
                .recipientName(invitation.getRecipientName())
                .officePhone(sctSettingsService.resolvePublicOfficePhone(invitation.getTenantId()))
                .mobilePhone(sctSettingsService.resolvePublicMobilePhone(invitation.getTenantId()))
                .submittedAt(invitation.getSubmittedAt())
                .build();
    }

    @Override
    @Transactional
    public SctVerifyResponse verify(String rawToken, SctVerifyRequest request, String clientIp) {
        SctInvitation invitation = loadInvitationForVerify(rawToken);
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
        String sessionId = verifySessionStore.issue(
                invitation.getId(),
                invitation.getTenantId(),
                absoluteExpiry(invitation));
        SctFormTemplate template = requireTemplate(invitation.getFormTemplateId());
        SctConsentStatusView consent = sctConsentService.resolveStatus(invitation, template.getFormType());
        return SctVerifyResponse.builder()
                .verifySessionId(sessionId)
                .expiresInSeconds(SctConstants.VERIFY_SESSION_IDLE_MINUTES * 60)
                .consent(consent)
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
        sctConsentService.requireSatisfied(invitation, template.getFormType());

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

        SctConsentStatusView consent = sctConsentService.resolveStatus(invitation, template.getFormType());
        return SctPublicFormResponse.builder()
                .formType(template.getFormType())
                .title(template.getTitle())
                .instructionText(template.getInstructionText())
                .headerFieldsJson(template.getHeaderFieldsJson())
                .status(invitation.getStatus())
                .requiresGuardian(Boolean.TRUE.equals(invitation.getRequiresGuardian()))
                .signerBand(consent.getSignerBand())
                .consent(consent)
                .items(views)
                .build();
    }

    @Override
    @Transactional
    public void saveDraft(String rawToken, SctDraftSaveRequest request) {
        OptimisticLockingFailureException lastConflict = null;
        for (int attempt = 1; attempt <= DRAFT_OPTIMISTIC_LOCK_MAX_ATTEMPTS; attempt++) {
            try {
                persistDraftAttempt(rawToken, request);
                return;
            } catch (OptimisticLockingFailureException conflict) {
                lastConflict = conflict;
                log.warn(
                        "SCT draft save optimistic-lock conflict attempt={}/{}",
                        attempt,
                        DRAFT_OPTIMISTIC_LOCK_MAX_ATTEMPTS);
                if (attempt < DRAFT_OPTIMISTIC_LOCK_MAX_ATTEMPTS && entityManager != null) {
                    entityManager.clear();
                }
            }
        }
        throw lastConflict;
    }

    /**
     * 임시저장 1회 시도 — 초대 재조회·검증·답변 upsert·draftSavedAt 반영.
     *
     * <p>초안 답은 {@code sct_response_answers} 에 초대 수명 동안 보관된다.
     * verify 세션 만료·재시작으로 세션이 사라져도 답행은 삭제하지 않는다.</p>
     *
     * @param rawToken 공개 토큰
     * @param request  임시저장 요청
     */
    private void persistDraftAttempt(String rawToken, SctDraftSaveRequest request) {
        SctInvitation invitation = loadByToken(rawToken);
        bindTenantAndGuard(invitation);
        requireVerifySession(request.getVerifySessionId(), invitation);
        assertWritable(invitation);
        SctFormTemplate template = requireTemplate(invitation.getFormTemplateId());
        sctConsentService.requireSatisfied(invitation, template.getFormType());
        if (request.getAnswers() != null) {
            for (SctDraftAnswerItem item : request.getAnswers()) {
                upsertAnswer(invitation, item);
            }
        }
        if (SctInviteStatus.SENT.name().equals(invitation.getStatus())) {
            invitation.setStatus(SctInviteStatus.DRAFT.name());
        }
        invitation.setDraftSavedAt(LocalDateTime.now());
        // flush 로 커밋 전 @Version 충돌을 드러내 재시도 루프에서 잡는다.
        invitationRepository.saveAndFlush(invitation);
    }

    @Override
    @Transactional
    public void saveConsent(
            String rawToken, SctConsentRequest request, String clientIp, String userAgent) {
        SctInvitation invitation = loadByToken(rawToken);
        bindTenantAndGuard(invitation);
        requireVerifySession(request.getVerifySessionId(), invitation);
        assertWritable(invitation);
        SctFormTemplate template = requireTemplate(invitation.getFormTemplateId());
        sctConsentService.recordPublicConsent(
                invitation, template.getFormType(), request, clientIp, userAgent);
    }

    @Override
    @Transactional
    public void submit(String rawToken, SctSubmitRequest request) {
        SctInvitation invitation = loadByToken(rawToken);
        bindTenantAndGuard(invitation);
        requireVerifySession(request.getVerifySessionId(), invitation);
        assertWritable(invitation);
        SctFormTemplate template = requireTemplate(invitation.getFormTemplateId());
        sctConsentService.requireSatisfied(invitation, template.getFormType());
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
        SctFormItem formItem = formItemRepository
                .findByIdAndFormTemplateId(item.getFormItemId(), invitation.getFormTemplateId())
                .orElseThrow(() -> new IllegalArgumentException("문항이 올바르지 않습니다."));
        boolean na = Boolean.TRUE.equals(item.getNotApplicable());
        if (na && !Boolean.TRUE.equals(formItem.getAllowsNotApplicable())) {
            throw new IllegalArgumentException("해당 없음이 허용되지 않는 문항입니다.");
        }
        SctResponseAnswer answer = answerRepository
                .findByTenantIdAndInvitationIdAndFormItemId(
                        invitation.getTenantId(), invitation.getId(), item.getFormItemId())
                .orElseGet(SctResponseAnswer::new);
        answer.setTenantId(invitation.getTenantId());
        answer.setInvitationId(invitation.getId());
        answer.setFormItemId(item.getFormItemId());
        answer.setNotApplicable(na);
        String text = na ? null : item.getAnswerText();
        answer.setAnswerText(text);
        answer.setIsBlank(!na && (text == null || text.isBlank()));
        answerRepository.save(answer);
    }

    private SctInvitation loadByToken(String rawToken) {
        ResolvedPublicToken resolved = resolveToken(rawToken, false);
        if (SctConstants.PUBLIC_STATUS_REISSUED.equals(resolved.statusOverride())) {
            throw new SctGoneException("링크가 만료되었거나 취소되었습니다.");
        }
        return resolved.invitation();
    }

    /**
     * 메타 전용 — 회전·비활성 단축 교환은 REISSUED status로 반환(410 대신).
     *
     * @param rawToken 초대 토큰 또는 교환 코드
     * @return 해석 결과
     */
    private ResolvedPublicToken resolveTokenForMeta(String rawToken) {
        return resolveToken(rawToken, true);
    }

    /**
     * 초대 토큰 해시 → Redis 교환 코드 → 회전 이력 순으로 해석.
     *
     * @param rawToken             경로 토큰
     * @param allowReissuedForMeta true면 회전/재발급을 REISSUED로 반환
     * @return 해석 결과
     */
    private ResolvedPublicToken resolveToken(String rawToken, boolean allowReissuedForMeta) {
        if (!StringUtils.hasText(rawToken)) {
            throw new EntityNotFoundException("SCT 링크를 찾을 수 없습니다.");
        }
        String trimmed = rawToken.trim();
        String hash = SctTokenHasher.sha256Hex(trimmed);
        Optional<SctInvitation> byHash = invitationRepository.findByTokenHashAndIsDeletedFalse(hash);
        if (byHash.isPresent()) {
            return new ResolvedPublicToken(byHash.get(), null);
        }

        Optional<SctExchangeCodeStore.ExchangeEntry> exchange = exchangeCodeStore.resolve(trimmed);
        if (exchange.isPresent()) {
            SctExchangeCodeStore.ExchangeEntry entry = exchange.get();
            SctInvitation invitation = invitationRepository
                    .findByTenantIdAndIdAndIsDeletedFalse(entry.tenantId(), entry.invitationId())
                    .orElseThrow(() -> new EntityNotFoundException("SCT 링크를 찾을 수 없습니다."));
            if (!invitation.getTenantId().equals(entry.tenantId())) {
                throw new EntityNotFoundException("SCT 링크를 찾을 수 없습니다.");
            }
            return new ResolvedPublicToken(invitation, entry.landingStatus());
        }

        Optional<SctRotatedTokenHash> rotated = rotatedTokenHashRepository.findByTokenHash(hash);
        if (rotated.isPresent()) {
            if (!allowReissuedForMeta) {
                throw new SctGoneException("링크가 만료되었거나 취소되었습니다.");
            }
            SctRotatedTokenHash rotatedRow = rotated.get();
            SctInvitation invitation = invitationRepository
                    .findByTenantIdAndIdAndIsDeletedFalse(
                            rotatedRow.getTenantId(), rotatedRow.getInvitationId())
                    .orElseThrow(() -> new EntityNotFoundException("SCT 링크를 찾을 수 없습니다."));
            return new ResolvedPublicToken(invitation, SctConstants.PUBLIC_STATUS_REISSUED);
        }
        throw new EntityNotFoundException("SCT 링크를 찾을 수 없습니다.");
    }

    /**
     * @param invitation     초대
     * @param statusOverride REISSUED 등 또는 null
     */
    private record ResolvedPublicToken(SctInvitation invitation, String statusOverride) {
    }

    /**
     * verify — 평문 토큰은 pessimistic lock, 교환 코드는 일반 로드 후 재발급 거부.
     *
     * @param rawToken 토큰 또는 교환 코드
     * @return 초대
     */
    private SctInvitation loadInvitationForVerify(String rawToken) {
        if (!StringUtils.hasText(rawToken)) {
            throw new EntityNotFoundException("SCT 링크를 찾을 수 없습니다.");
        }
        String trimmed = rawToken.trim();
        String hash = SctTokenHasher.sha256Hex(trimmed);
        Optional<SctInvitation> locked =
                invitationRepository.findByTokenHashAndIsDeletedFalseForUpdate(hash);
        if (locked.isPresent()) {
            return locked.get();
        }
        // 교환 코드·회전 이력 — ForUpdate 불가 시 일반 resolve(재발급은 410)
        return loadByToken(trimmed);
    }

    private void bindTenantAndGuard(SctInvitation invitation) {
        TenantContextHolder.setTenantId(invitation.getTenantId());
        sctFeatureGuard.requireEnabled(invitation.getTenantId());
        refreshExpired(invitation);
        assertOnlineFormType(invitation);
    }

    /**
     * 아동용 초대 토큰은 공개 API에서 거부(온라인 미제공).
     *
     * @param invitation 초대
     */
    private void assertOnlineFormType(SctInvitation invitation) {
        formTemplateRepository.findByIdAndIsDeletedFalse(invitation.getFormTemplateId())
                .ifPresent(template -> {
                    if (SctFormType.CHILD.name().equals(template.getFormType())) {
                        throw new IllegalArgumentException(
                                SctConstants.MSG_CHILD_ONLINE_UNSUPPORTED);
                    }
                });
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
        Optional<String> tenant = verifySessionStore.validate(
                sessionId,
                invitation.getId(),
                absoluteExpiry(invitation));
        if (tenant.isEmpty() || !tenant.get().equals(invitation.getTenantId())) {
            throw new SctVerifyRequiredException(SctConstants.MSG_VERIFY_REQUIRED);
        }
    }

    /**
     * 초대 링크 절대 만료 — verify 세션 sliding 상한.
     *
     * @param invitation 초대
     * @return absolute Instant
     */
    private Instant absoluteExpiry(SctInvitation invitation) {
        LocalDateTime expires = invitation.getTokenExpiresAt();
        if (expires == null) {
            return Instant.now().plusSeconds(SctConstants.VERIFY_SESSION_IDLE_MINUTES * 60L);
        }
        return expires.atZone(TOKEN_EXPIRY_ZONE).toInstant();
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
}
