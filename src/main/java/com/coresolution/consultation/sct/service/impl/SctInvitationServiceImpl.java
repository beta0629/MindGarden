package com.coresolution.consultation.sct.service.impl;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;
import com.coresolution.consultation.constant.AuditAction;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.AuditLog;
import com.coresolution.consultation.entity.Client;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.exception.EntityNotFoundException;
import com.coresolution.consultation.repository.ClientRepository;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.service.AuditLogService;
import com.coresolution.consultation.service.SmsAuthService;
import com.coresolution.consultation.sct.constant.SctConsentKeys;
import com.coresolution.consultation.sct.constant.SctConstants;
import com.coresolution.consultation.sct.constant.SctFormType;
import com.coresolution.consultation.sct.constant.SctInviteStatus;
import com.coresolution.consultation.sct.dto.SctAnswerView;
import com.coresolution.consultation.sct.dto.SctFormSummaryResponse;
import com.coresolution.consultation.sct.dto.SctInviteCreateRequest;
import com.coresolution.consultation.sct.dto.SctInvitationResponse;
import com.coresolution.consultation.sct.dto.SctLinkCandidateResponse;
import com.coresolution.consultation.sct.dto.SctLinkRequest;
import com.coresolution.consultation.sct.entity.SctDomainMemo;
import com.coresolution.consultation.sct.entity.SctFormItem;
import com.coresolution.consultation.sct.entity.SctFormTemplate;
import com.coresolution.consultation.sct.entity.SctInvitation;
import com.coresolution.consultation.sct.entity.SctManagementNoSeq;
import com.coresolution.consultation.sct.entity.SctResponseAnswer;
import com.coresolution.consultation.sct.entity.SctRotatedTokenHash;
import com.coresolution.consultation.sct.entity.SctShortLink;
import com.coresolution.consultation.sct.exception.SctConflictException;
import com.coresolution.consultation.sct.repository.SctDomainMemoRepository;
import com.coresolution.consultation.sct.repository.SctFormItemRepository;
import com.coresolution.consultation.sct.repository.SctFormTemplateRepository;
import com.coresolution.consultation.sct.repository.SctInvitationRepository;
import com.coresolution.consultation.sct.repository.SctManagementNoSeqRepository;
import com.coresolution.consultation.sct.repository.SctResponseAnswerRepository;
import com.coresolution.consultation.sct.repository.SctRotatedTokenHashRepository;
import com.coresolution.consultation.sct.service.SctAccessLogService;
import com.coresolution.consultation.sct.service.SctClinicalAccessDeniedAuditWriter;
import com.coresolution.consultation.sct.service.SctClinicalAccessDenySupport;
import com.coresolution.consultation.sct.service.SctConsentService;
import com.coresolution.consultation.sct.service.SctFeatureGuard;
import com.coresolution.consultation.sct.service.SctInvitationService;
import com.coresolution.consultation.sct.service.SctSettingsService;
import com.coresolution.consultation.sct.service.SctShortLinkService;
import com.coresolution.consultation.sct.service.SctTenantPublicUrlResolver;
import com.coresolution.consultation.sct.util.SctSmsMessageBuilder;
import com.coresolution.consultation.sct.util.SctTokenHasher;
import com.coresolution.consultation.util.LoginIdentifierUtils;
import com.coresolution.consultation.util.PhoneHashUtils;
import com.coresolution.consultation.util.PhoneLogMasking;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * SCT 초대 관리 서비스.
 *
 * @author MindGarden
 * @since 2026-11-23
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SctInvitationServiceImpl implements SctInvitationService {

    private final SctFeatureGuard sctFeatureGuard;
    private final SctSettingsService sctSettingsService;
    private final SctFormTemplateRepository formTemplateRepository;
    private final SctFormItemRepository formItemRepository;
    private final SctInvitationRepository invitationRepository;
    private final SctResponseAnswerRepository answerRepository;
    private final SctDomainMemoRepository domainMemoRepository;
    private final SctManagementNoSeqRepository managementNoSeqRepository;
    private final ClientRepository clientRepository;
    private final ConsultantClientMappingRepository mappingRepository;
    private final SmsAuthService smsAuthService;
    private final AuditLogService auditLogService;
    private final SctAccessLogService sctAccessLogService;
    private final SctConsentService sctConsentService;
    private final SctRotatedTokenHashRepository rotatedTokenHashRepository;
    private final SctClinicalAccessDeniedAuditWriter clinicalAccessDeniedAuditWriter;
    private final SctTenantPublicUrlResolver tenantPublicUrlResolver;
    private final SctShortLinkService sctShortLinkService;

    @Override
    @Transactional(readOnly = true)
    public List<SctFormSummaryResponse> listForms(String tenantId) {
        sctFeatureGuard.requireEnabled(tenantId);
        List<SctFormTemplate> core = formTemplateRepository
                .findByTenantIdAndIsActiveTrueAndIsDeletedFalse(SctConstants.CORE_TENANT_ID);
        return core.stream().map(t -> SctFormSummaryResponse.builder()
                .formTemplateId(t.getId())
                .formType(t.getFormType())
                .formVersion(t.getFormVersion())
                .title(t.getTitle())
                .targetDesc(t.getTargetDesc())
                .itemCount((int) formItemRepository.countByFormTemplateId(t.getId()))
                .build()).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public SctInvitationResponse createInvitation(
            String tenantId, User actor, SctInviteCreateRequest request) {
        sctFeatureGuard.requireEnabled(tenantId);
        requireStaffLike(actor);
        SctFormType formType = SctFormType.fromCode(request.getFormType());
        if (!formType.isOnlineSupported()) {
            throw new IllegalArgumentException(SctConstants.MSG_CHILD_ONLINE_UNSUPPORTED);
        }
        SctFormTemplate template = resolveActiveTemplate(formType);

        Long clientId = request.getClientId();
        Long mappingId = request.getMappingId();
        Long consultantId = null;
        if (mappingId != null) {
            ConsultantClientMapping mapping = mappingRepository.findById(mappingId)
                    .orElseThrow(() -> new EntityNotFoundException("배정을 찾을 수 없습니다."));
            if (!tenantId.equals(mapping.getTenantId())) {
                throw new AccessDeniedException("타 테넌트 배정입니다.");
            }
            if (mapping.getClient() == null) {
                throw new IllegalArgumentException("배정에 내담자가 없습니다.");
            }
            clientId = mapping.getClient().getId();
            if (mapping.getConsultant() != null) {
                consultantId = mapping.getConsultant().getId();
            }
            if (actor.getRole() == UserRole.CONSULTANT
                    && !Objects.equals(actor.getId(), consultantId)) {
                throw new AccessDeniedException("담당 배정만 발송할 수 있습니다.");
            }
        } else if (clientId != null) {
            Client client = clientRepository.findById(clientId)
                    .orElseThrow(() -> new EntityNotFoundException("내담자를 찾을 수 없습니다."));
            if (!tenantId.equals(client.getTenantId())) {
                throw new AccessDeniedException("타 테넌트 내담자입니다.");
            }
            if (actor.getRole() == UserRole.CONSULTANT) {
                ensureConsultantOwnsClient(tenantId, actor, clientId);
                consultantId = actor.getId();
            }
        } else if (actor.getRole() == UserRole.CONSULTANT) {
            throw new AccessDeniedException("상담사는 담당 내담자/배정으로만 발송할 수 있습니다.");
        }

        sctConsentService.assertNotRevokedForDispatch(tenantId, clientId);

        Client linkedClient = null;
        if (clientId != null) {
            linkedClient = clientRepository.findById(clientId).orElse(null);
        }

        String phone = StringUtils.hasText(request.getPhone())
                ? LoginIdentifierUtils.normalizeKoreanMobileDigits(request.getPhone())
                : null;
        String email = StringUtils.hasText(request.getEmail())
                ? request.getEmail().trim().toLowerCase(Locale.ROOT)
                : null;
        if (!StringUtils.hasText(phone) && !StringUtils.hasText(email)) {
            throw new IllegalArgumentException("휴대폰 또는 이메일이 필요합니다.");
        }

        int expiryDays = request.getExpiresInDays() != null
                ? request.getExpiresInDays()
                : sctSettingsService.resolveLinkExpiryDays(tenantId);
        if (expiryDays < 1 || expiryDays > 30) {
            throw new IllegalArgumentException("만료 일수는 1~30 이어야 합니다.");
        }

        boolean requiresGuardian = resolveRequiresGuardian(formType, linkedClient, request);

        String rawToken = SctTokenHasher.generateOpaqueToken();
        LocalDateTime expiresAt = LocalDateTime.now().plusDays(expiryDays);
        String managementNo = nextManagementNo(tenantId);

        String recipientName = normalizeRecipientName(request.getRecipientName());

        SctInvitation invitation = SctInvitation.builder()
                .formTemplateId(template.getId())
                .clientId(clientId)
                .mappingId(mappingId)
                .consultantId(consultantId)
                .managementNo(managementNo)
                .recipientName(recipientName)
                .targetPhone(phone)
                .targetEmail(email)
                .targetPhoneHash(phone == null ? null : PhoneHashUtils.sha256Hex(phone))
                .targetEmailHash(email == null ? null : SctTokenHasher.sha256Hex(email))
                .tokenHash(SctTokenHasher.sha256Hex(rawToken))
                .tokenExpiresAt(expiresAt)
                .status(SctInviteStatus.SENT.name())
                .sentAt(LocalDateTime.now())
                .sentByUserId(actor.getId())
                .requiresGuardian(requiresGuardian)
                .verifyFailCount(0)
                .build();
        invitation.setTenantId(tenantId);
        invitation = invitationRepository.save(invitation);

        SctShortLink shortLink = createShortLinkSafe(invitation);
        String smsResult = dispatchSms(
                tenantId, phone, template.getFormType(), expiresAt, rawToken, shortLink);
        invitation.setSmsDispatchResult(smsResult);
        invitation = invitationRepository.save(invitation);

        auditLogService.record(AuditLog.builder()
                .tenantId(tenantId)
                .actorUserId(actor.getId())
                .actorRole(actor.getRole() == null ? null : actor.getRole().name())
                .targetUserId(clientId)
                .action(AuditAction.SCT_INVITE_SENT)
                .entityType(SctConstants.ENTITY_TYPE_INVITATION)
                .entityId(invitation.getId())
                .metadataJson("{\"formType\":\"" + formType.name()
                        + "\",\"smsResult\":\"" + smsResult + "\"}")
                .build());

        SctInvitationResponse response = toMetaResponse(invitation, template.getFormType());
        response.setLinkExpiryDays(expiryDays);
        // STAFF는 SMS 발송용 초대 생성만 — publicUrl/평문 토큰 미노출(임상 본문 403 정합)
        if (canReceiveOneShotPublicLink(actor)) {
            attachOneShotPublicLink(response, tenantId, rawToken, shortLink);
        }
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public List<SctInvitationResponse> listInvitations(
            String tenantId, User actor, Long clientId, String status) {
        sctFeatureGuard.requireEnabled(tenantId);
        requireStaffLike(actor);
        List<SctInvitation> list;
        if (clientId != null) {
            ensureCanAccessClient(tenantId, actor, clientId);
            list = invitationRepository
                    .findByTenantIdAndClientIdAndIsDeletedFalseOrderByCreatedAtDesc(tenantId, clientId);
        } else if (StringUtils.hasText(status)) {
            list = invitationRepository
                    .findByTenantIdAndStatusAndIsDeletedFalseOrderByCreatedAtDesc(tenantId, status);
        } else {
            list = invitationRepository.findByTenantIdAndIsDeletedFalseOrderByCreatedAtDesc(tenantId);
        }
        if (actor.getRole() == UserRole.CONSULTANT) {
            list = list.stream()
                    .filter(i -> canConsultantAccess(tenantId, actor.getId(), i))
                    .collect(Collectors.toList());
        }
        return list.stream()
                .map(i -> toMetaResponse(i, resolveFormType(i.getFormTemplateId())))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public SctInvitationResponse getInvitation(
            String tenantId, User actor, Long id, boolean includeAnswers,
            String clientIp, String userAgent) {
        sctFeatureGuard.requireEnabled(tenantId);
        requireStaffLike(actor);
        SctInvitation invitation = requireInvitation(tenantId, id);
        ensureCanAccessInvitation(tenantId, actor, invitation);
        refreshExpired(invitation);
        SctInvitationResponse response = toMetaResponse(
                invitation, resolveFormType(invitation.getFormTemplateId()));
        if (includeAnswers && SctInviteStatus.SUBMITTED.name().equals(invitation.getStatus())) {
            ensureCanAccessClinicalBody(tenantId, actor, invitation);
            response.setAnswers(loadAnswers(invitation));
            sctAccessLogService.logViewBody(
                    invitation, actor.getId(),
                    actor.getRole().name(), clientIp, userAgent);
            auditLogService.record(AuditLog.builder()
                    .tenantId(tenantId)
                    .actorUserId(actor.getId())
                    .actorRole(actor.getRole().name())
                    .targetUserId(invitation.getClientId())
                    .action(AuditAction.SCT_RESPONSE_VIEWED)
                    .entityType(SctConstants.ENTITY_TYPE_INVITATION)
                    .entityId(invitation.getId())
                    .build());
        }
        return response;
    }

    @Override
    @Transactional
    public SctInvitationResponse cancel(String tenantId, User actor, Long id) {
        sctFeatureGuard.requireEnabled(tenantId);
        requireStaffLike(actor);
        SctInvitation invitation = requireInvitation(tenantId, id);
        ensureCanAccessInvitation(tenantId, actor, invitation);
        if (SctInviteStatus.SUBMITTED.name().equals(invitation.getStatus())) {
            throw new SctConflictException("제출된 건은 취소할 수 없습니다.");
        }
        invitation.setStatus(SctInviteStatus.CANCELLED.name());
        invitation.setCancelledAt(LocalDateTime.now());
        invitationRepository.save(invitation);
        // 단축 링크 비활성 — 신규 교환 발급 차단. 기존 교환은 Public resolve 시 status로 거부.
        sctShortLinkService.deactivateForInvitation(tenantId, invitation.getId());
        auditLogService.record(AuditLog.builder()
                .tenantId(tenantId)
                .actorUserId(actor.getId())
                .actorRole(actor.getRole().name())
                .action(AuditAction.SCT_INVITE_CANCELLED)
                .entityType(SctConstants.ENTITY_TYPE_INVITATION)
                .entityId(invitation.getId())
                .build());
        return toMetaResponse(invitation, resolveFormType(invitation.getFormTemplateId()));
    }

    @Override
    @Transactional
    public SctInvitationResponse resendSms(String tenantId, User actor, Long id) {
        sctFeatureGuard.requireEnabled(tenantId);
        requireStaffLike(actor);
        SctInvitation invitation = requireInvitation(tenantId, id);
        ensureCanAccessInvitation(tenantId, actor, invitation);
        refreshExpired(invitation);
        if (SctInviteStatus.EXPIRED.name().equals(invitation.getStatus())
                || SctInviteStatus.CANCELLED.name().equals(invitation.getStatus())
                || SctInviteStatus.SUBMITTED.name().equals(invitation.getStatus())) {
            throw new SctConflictException("재발송할 수 없는 상태입니다. 새 초대를 발송하세요.");
        }
        // 미제출: 평문 토큰은 DB에 없으므로 신규 토큰·단축 코드 발급 후 해시 교체
        String rawToken = SctTokenHasher.generateOpaqueToken();
        persistRotatedTokenHash(invitation);
        invitation.setTokenHash(SctTokenHasher.sha256Hex(rawToken));
        invitation.setSentAt(LocalDateTime.now());
        invitationRepository.save(invitation);
        SctFormTemplate template = formTemplateRepository.findByIdAndIsDeletedFalse(
                invitation.getFormTemplateId()).orElseThrow();
        SctShortLink shortLink = createShortLinkSafe(invitation);
        String smsResult = dispatchSms(
                tenantId, invitation.getTargetPhone(), template.getFormType(),
                invitation.getTokenExpiresAt(), rawToken, shortLink);
        invitation.setSmsDispatchResult(smsResult);
        invitationRepository.save(invitation);
        SctInvitationResponse response = toMetaResponse(invitation, template.getFormType());
        if (canReceiveOneShotPublicLink(actor)) {
            attachOneShotPublicLink(response, tenantId, rawToken, shortLink);
        }
        return response;
    }

    @Override
    @Transactional
    public SctInvitationResponse reissueLink(String tenantId, User actor, Long id) {
        sctFeatureGuard.requireEnabled(tenantId);
        requireAdminOrConsultant(actor);
        SctInvitation invitation = requireInvitation(tenantId, id);
        ensureCanAccessInvitation(tenantId, actor, invitation);
        refreshExpired(invitation);
        if (SctInviteStatus.EXPIRED.name().equals(invitation.getStatus())
                || SctInviteStatus.CANCELLED.name().equals(invitation.getStatus())
                || SctInviteStatus.SUBMITTED.name().equals(invitation.getStatus())) {
            throw new SctConflictException("링크를 재발급할 수 없는 상태입니다.");
        }
        String rawToken = SctTokenHasher.generateOpaqueToken();
        persistRotatedTokenHash(invitation);
        invitation.setTokenHash(SctTokenHasher.sha256Hex(rawToken));
        invitation.setSentAt(LocalDateTime.now());
        invitation.setVerifyFailCount(0);
        invitation.setVerifyLockedUntil(null);
        invitationRepository.save(invitation);
        SctShortLink shortLink = createShortLinkSafe(invitation);
        auditLogService.record(AuditLog.builder()
                .tenantId(tenantId)
                .actorUserId(actor.getId())
                .actorRole(actor.getRole().name())
                .targetUserId(invitation.getClientId())
                .action(AuditAction.SCT_INVITE_REISSUED)
                .entityType(SctConstants.ENTITY_TYPE_INVITATION)
                .entityId(invitation.getId())
                .metadataJson("{\"managementNo\":\"" + invitation.getManagementNo() + "\"}")
                .build());
        SctInvitationResponse response = toMetaResponse(
                invitation, resolveFormType(invitation.getFormTemplateId()));
        attachOneShotPublicLink(response, tenantId, rawToken, shortLink);
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public List<SctInvitationResponse> listByClient(String tenantId, User actor, Long clientId) {
        return listInvitations(tenantId, actor, clientId, null);
    }

    @Override
    @Transactional
    public SctInvitationResponse latestSubmitted(
            String tenantId, User actor, Long clientId, String clientIp, String userAgent) {
        sctFeatureGuard.requireEnabled(tenantId);
        requireStaffLike(actor);
        ensureCanAccessClient(tenantId, actor, clientId);
        SctInvitation invitation = invitationRepository
                .findFirstByTenantIdAndClientIdAndStatusAndIsDeletedFalseOrderBySubmittedAtDesc(
                        tenantId, clientId, SctInviteStatus.SUBMITTED.name())
                .orElseThrow(() -> new EntityNotFoundException("제출된 SCT 응답이 없습니다."));
        SctInvitationResponse response = toMetaResponse(
                invitation, resolveFormType(invitation.getFormTemplateId()));
        response.setAnswers(loadAnswers(invitation));
        sctAccessLogService.logSessionView(
                invitation, actor.getId(), actor.getRole().name(), clientIp, userAgent);
        return response;
    }

    @Override
    @Transactional
    public SctInvitationResponse sessionView(
            String tenantId, User actor, Long clientId, Long mappingId,
            String clientIp, String userAgent) {
        if (mappingId != null) {
            ConsultantClientMapping mapping = mappingRepository.findById(mappingId)
                    .orElseThrow(() -> new EntityNotFoundException("배정을 찾을 수 없습니다."));
            if (!tenantId.equals(mapping.getTenantId())) {
                throw new AccessDeniedException("타 테넌트 배정입니다.");
            }
            clientId = mapping.getClient().getId();
        }
        return latestSubmitted(tenantId, actor, clientId, clientIp, userAgent);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SctInvitationResponse> listUnlinked(String tenantId) {
        sctFeatureGuard.requireEnabled(tenantId);
        return invitationRepository
                .findByTenantIdAndClientIdIsNullAndIsDeletedFalseOrderByCreatedAtDesc(tenantId)
                .stream()
                .map(i -> toMetaResponse(i, resolveFormType(i.getFormTemplateId())))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<SctLinkCandidateResponse> linkCandidates(String tenantId, Long invitationId) {
        sctFeatureGuard.requireEnabled(tenantId);
        SctInvitation invitation = requireInvitation(tenantId, invitationId);
        // 자동 배정 금지 — 동일 테넌트 활성 내담자만 스캔해 후보 반환.
        String targetPhoneHash = invitation.getTargetPhoneHash();
        String targetEmailHash = invitation.getTargetEmailHash();
        if (!StringUtils.hasText(targetPhoneHash) && !StringUtils.hasText(targetEmailHash)) {
            return List.of();
        }

        List<Client> clients = clientRepository.findByTenantIdAndIsDeletedFalse(tenantId);
        List<SctLinkCandidateResponse> candidates = new ArrayList<>();
        for (Client client : clients) {
            boolean phoneMatch = StringUtils.hasText(targetPhoneHash)
                    && targetPhoneHash.equals(hashClientPhone(client));
            boolean emailMatch = StringUtils.hasText(targetEmailHash)
                    && targetEmailHash.equals(hashClientEmail(client));
            if (!phoneMatch && !emailMatch) {
                continue;
            }
            String channel;
            if (phoneMatch && emailMatch) {
                channel = SctConstants.MATCH_CHANNEL_BOTH;
            } else if (phoneMatch) {
                channel = SctConstants.MATCH_CHANNEL_PHONE;
            } else {
                channel = SctConstants.MATCH_CHANNEL_EMAIL;
            }
            candidates.add(SctLinkCandidateResponse.builder()
                    .clientId(client.getId())
                    .maskedName(maskClientName(client.getName()))
                    .matchChannel(channel)
                    .build());
        }
        log.info("SCT link-candidates invitationId={} tenant={} count={}",
                invitationId, tenantId, candidates.size());
        return candidates;
    }

    /**
     * Client.phone(컨버터 복호) → 정규화 → SHA-256.
     *
     * @param client 내담자
     * @return 해시 또는 null
     */
    private static String hashClientPhone(Client client) {
        if (client == null || !StringUtils.hasText(client.getPhone())) {
            return null;
        }
        try {
            String normalized = LoginIdentifierUtils.normalizeKoreanMobileDigits(client.getPhone());
            if (!StringUtils.hasText(normalized)) {
                return null;
            }
            return PhoneHashUtils.sha256Hex(normalized);
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Client.email(컨버터 복호) → 소문자 정규화 → SHA-256(초대 해시와 동일).
     *
     * @param client 내담자
     * @return 해시 또는 null
     */
    private static String hashClientEmail(Client client) {
        if (client == null || !StringUtils.hasText(client.getEmail())) {
            return null;
        }
        try {
            String normalized = client.getEmail().trim().toLowerCase(Locale.ROOT);
            if (!StringUtils.hasText(normalized)) {
                return null;
            }
            return SctTokenHasher.sha256Hex(normalized);
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * 내담자명 마스킹(자동 배정 금지·후보 표시용).
     *
     * @param name 이름
     * @return 마스킹
     */
    private static String maskClientName(String name) {
        if (name == null || name.isBlank()) {
            return "***";
        }
        String trimmed = name.trim();
        if (trimmed.length() == 1) {
            return trimmed;
        }
        if (trimmed.length() == 2) {
            return trimmed.charAt(0) + "*";
        }
        return trimmed.charAt(0)
                + "*".repeat(trimmed.length() - 2)
                + trimmed.charAt(trimmed.length() - 1);
    }

    @Override
    @Transactional
    public SctInvitationResponse link(
            String tenantId, User actor, Long invitationId, SctLinkRequest request) {
        sctFeatureGuard.requireEnabled(tenantId);
        if (actor.getRole() != UserRole.ADMIN) {
            throw new AccessDeniedException("ADMIN만 배정할 수 있습니다.");
        }
        SctInvitation invitation = requireInvitation(tenantId, invitationId);
        Client client = clientRepository.findById(request.getClientId())
                .orElseThrow(() -> new EntityNotFoundException("내담자를 찾을 수 없습니다."));
        if (!tenantId.equals(client.getTenantId())) {
            throw new AccessDeniedException("타 테넌트 내담자입니다.");
        }
        Long mappingId = request.getMappingId();
        Long consultantId = invitation.getConsultantId();
        if (mappingId != null) {
            ConsultantClientMapping mapping = mappingRepository.findById(mappingId)
                    .orElseThrow(() -> new EntityNotFoundException("배정을 찾을 수 없습니다."));
            if (!tenantId.equals(mapping.getTenantId())
                    || !Objects.equals(mapping.getClient().getId(), client.getId())) {
                throw new IllegalArgumentException("배정과 내담자가 일치하지 않습니다.");
            }
            if (mapping.getConsultant() != null) {
                consultantId = mapping.getConsultant().getId();
            }
        }
        invitation.setClientId(client.getId());
        invitation.setMappingId(mappingId);
        invitation.setConsultantId(consultantId);
        if (client.getBirthDate() != null && isUnder14(client.getBirthDate())) {
            invitation.setRequiresGuardian(true);
        }
        invitationRepository.save(invitation);
        sctConsentService.succeedUnlinkedToClient(
                tenantId, invitation.getId(), client.getId(), actor);
        auditLogService.record(AuditLog.builder()
                .tenantId(tenantId)
                .actorUserId(actor.getId())
                .actorRole(actor.getRole().name())
                .targetUserId(client.getId())
                .action(AuditAction.SCT_CLIENT_LINKED)
                .entityType(SctConstants.ENTITY_TYPE_INVITATION)
                .entityId(invitation.getId())
                .metadataJson("{\"clientId\":" + client.getId()
                        + ",\"mappingId\":" + mappingId + "}")
                .build());
        return toMetaResponse(invitation, resolveFormType(invitation.getFormTemplateId()));
    }

    @Override
    @Transactional
    public void revokeClientConsent(String tenantId, User actor, Long clientId) {
        sctFeatureGuard.requireEnabled(tenantId);
        ensureCanAccessClient(tenantId, actor, clientId);
        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new EntityNotFoundException("내담자를 찾을 수 없습니다."));
        if (!tenantId.equals(client.getTenantId())) {
            throw new AccessDeniedException("타 테넌트 내담자입니다.");
        }
        sctConsentService.revokeForClient(tenantId, clientId, actor);
    }

    @Override
    @Transactional
    public void recordPrintAudit(
            String tenantId, User actor, Long id, String clientIp, String userAgent) {
        sctFeatureGuard.requireEnabled(tenantId);
        requireStaffLike(actor);
        SctInvitation invitation = requireInvitation(tenantId, id);
        ensureCanAccessClinicalBody(tenantId, actor, invitation);
        if (!SctInviteStatus.SUBMITTED.name().equals(invitation.getStatus())) {
            throw new SctConflictException("제출된 응답만 인쇄할 수 있습니다.");
        }
        sctAccessLogService.logPrint(
                invitation, actor.getId(), actor.getRole().name(), clientIp, userAgent);
        auditLogService.record(AuditLog.builder()
                .tenantId(tenantId)
                .actorUserId(actor.getId())
                .actorRole(actor.getRole().name())
                .targetUserId(invitation.getClientId())
                .action(AuditAction.SCT_RESPONSE_PRINTED)
                .entityType(SctConstants.ENTITY_TYPE_INVITATION)
                .entityId(invitation.getId())
                .build());
    }

    @Override
    @Transactional
    public void destroyInvitation(String tenantId, User actor, Long id) {
        sctFeatureGuard.requireEnabled(tenantId);
        if (actor == null || actor.getRole() != UserRole.ADMIN) {
            throw new AccessDeniedException("ADMIN만 파기할 수 있습니다.");
        }
        SctInvitation invitation = requireInvitation(tenantId, id);
        int retentionDays = sctSettingsService.resolveRetentionDays(tenantId);
        if (!isDestroyEligible(invitation, retentionDays)) {
            throw new SctConflictException(SctConstants.MSG_DESTROY_NOT_ELIGIBLE);
        }
        String managementNo = invitation.getManagementNo();
        answerRepository.deleteByTenantIdAndInvitationId(tenantId, invitation.getId());
        List<SctDomainMemo> memos = domainMemoRepository
                .findByTenantIdAndInvitationIdAndIsDeletedFalse(tenantId, invitation.getId());
        for (SctDomainMemo memo : memos) {
            memo.delete();
        }
        if (!memos.isEmpty()) {
            domainMemoRepository.saveAll(memos);
        }
        // 동의(sct_consents)는 남김
        invitation.delete();
        invitationRepository.save(invitation);
        auditLogService.record(AuditLog.builder()
                .tenantId(tenantId)
                .actorUserId(actor.getId())
                .actorRole(actor.getRole().name())
                .action(AuditAction.SCT_RESPONSE_DESTROYED)
                .entityType(SctConstants.ENTITY_TYPE_INVITATION)
                .entityId(invitation.getId())
                .metadataJson("{\"managementNo\":\"" + escapeJson(managementNo) + "\"}")
                .build());
        log.info("SCT destroy invitationId={} tenant={} managementNo={} actor={}",
                id, tenantId, managementNo, actor.getId());
    }

    @Override
    @Transactional
    public SctInvitationResponse unlink(String tenantId, User actor, Long invitationId) {
        sctFeatureGuard.requireEnabled(tenantId);
        if (actor.getRole() != UserRole.ADMIN) {
            throw new AccessDeniedException("ADMIN만 배정을 해제할 수 있습니다.");
        }
        SctInvitation invitation = requireInvitation(tenantId, invitationId);
        Long previousClientId = invitation.getClientId();
        invitation.setClientId(null);
        invitation.setMappingId(null);
        invitation.setConsultantId(null);
        invitationRepository.save(invitation);
        auditLogService.record(AuditLog.builder()
                .tenantId(tenantId)
                .actorUserId(actor.getId())
                .actorRole(actor.getRole().name())
                .targetUserId(previousClientId)
                .action(AuditAction.SCT_CLIENT_UNLINKED)
                .entityType(SctConstants.ENTITY_TYPE_INVITATION)
                .entityId(invitation.getId())
                .build());
        return toMetaResponse(invitation, resolveFormType(invitation.getFormTemplateId()));
    }

    /**
     * SCT 초대 SMS 발송. 단축 URL 단문(≤90B EUC-KR). 본문에 전화번호 없음.
     *
     * @param tenantId  테넌트 ID
     * @param phone     수신 번호(없으면 NO_PHONE)
     * @param formType  양식 유형
     * @param expiresAt 만료 시각
     * @param rawToken  평문 토큰(LMS 폴백용)
     * @param shortLink 단축 링크(없으면 LMS 폴백)
     * @return SMS 발송 결과 코드
     */
    private String dispatchSms(
            String tenantId,
            String phone,
            String formType,
            LocalDateTime expiresAt,
            String rawToken,
            SctShortLink shortLink) {
        if (!StringUtils.hasText(phone)) {
            return SctConstants.SMS_RESULT_NO_PHONE;
        }
        String message;
        String resultOnSuccess = SctConstants.SMS_RESULT_SENT;
        int eucKrBytes;
        if (shortLink != null && StringUtils.hasText(shortLink.getShortCode())) {
            String absoluteShort = tenantPublicUrlResolver.resolveAbsoluteShortUrl(
                    tenantId, shortLink.getShortCode());
            message = SctSmsMessageBuilder.buildShortSmsBody(formType, expiresAt, absoluteShort);
            if (message == null) {
                eucKrBytes = -1;
                log.warn("SCT SMS BODY_TOO_LONG formType={} eucKrBytes=overflow phone={}",
                        formType, PhoneLogMasking.maskForLog(phone));
                return SctConstants.SMS_RESULT_BODY_TOO_LONG;
            }
            eucKrBytes = SctSmsMessageBuilder.eucKrByteLength(message);
        } else {
            String office = sctSettingsService.resolvePublicOfficePhone(tenantId);
            String longUrl = tenantPublicUrlResolver.resolveAbsolutePublicUrl(tenantId, rawToken);
            message = SctSmsMessageBuilder.buildLmsFallbackBody(
                    formType, expiresAt, office, longUrl);
            eucKrBytes = SctSmsMessageBuilder.eucKrByteLength(message);
            resultOnSuccess = SctConstants.SMS_RESULT_LMS_FALLBACK;
            log.info("SCT SMS LMS fallback formType={} eucKrBytes={}", formType, eucKrBytes);
        }
        if (smsAuthService.isTestMode()) {
            log.info("SCT SMS TEST_MODE_SKIP formType={} eucKrBytes={} phone={}",
                    formType, eucKrBytes, PhoneLogMasking.maskForLog(phone));
            return SctConstants.SMS_RESULT_TEST_MODE_SKIP;
        }
        boolean ok = smsAuthService.sendNotificationMessage(phone, message);
        log.info("SCT SMS dispatch formType={} eucKrBytes={} result={}",
                formType, eucKrBytes, ok ? resultOnSuccess : SctConstants.SMS_RESULT_FAILED);
        return ok ? resultOnSuccess : SctConstants.SMS_RESULT_FAILED;
    }

    private SctShortLink createShortLinkSafe(SctInvitation invitation) {
        try {
            return sctShortLinkService.createOrRotate(invitation);
        } catch (RuntimeException ex) {
            log.warn("SCT short-link create failed invitationId={} tenant={}: {}",
                    invitation.getId(), invitation.getTenantId(), ex.getMessage());
            return null;
        }
    }

    private SctFormTemplate resolveActiveTemplate(SctFormType formType) {
        return formTemplateRepository
                .findByTenantIdAndFormTypeAndFormVersionAndIsActiveTrueAndIsDeletedFalse(
                        SctConstants.CORE_TENANT_ID, formType.name(), SctConstants.FORM_VERSION_V3)
                .orElseThrow(() -> new EntityNotFoundException("SCT 양식을 찾을 수 없습니다."));
    }

    private SctInvitation requireInvitation(String tenantId, Long id) {
        return invitationRepository.findByTenantIdAndIdAndIsDeletedFalse(tenantId, id)
                .orElseThrow(() -> new EntityNotFoundException("SCT 초대를 찾을 수 없습니다."));
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

    private List<SctAnswerView> loadAnswers(SctInvitation invitation) {
        List<SctFormItem> items = formItemRepository
                .findByFormTemplateIdOrderBySortOrderAsc(invitation.getFormTemplateId());
        List<SctResponseAnswer> answers = answerRepository
                .findByTenantIdAndInvitationId(invitation.getTenantId(), invitation.getId());
        return items.stream().map(item -> {
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
    }

    private SctInvitationResponse toMetaResponse(SctInvitation invitation, String formType) {
        int retentionDays = sctSettingsService.resolveRetentionDays(invitation.getTenantId());
        return SctInvitationResponse.builder()
                .id(invitation.getId())
                .formType(formType)
                .formTemplateId(invitation.getFormTemplateId())
                .clientId(invitation.getClientId())
                .mappingId(invitation.getMappingId())
                .consultantId(invitation.getConsultantId())
                .managementNo(invitation.getManagementNo())
                .status(invitation.getStatus())
                .maskedPhone(invitation.getTargetPhone() == null
                        ? null : PhoneLogMasking.maskForLog(invitation.getTargetPhone()))
                .maskedEmail(maskEmail(invitation.getTargetEmail()))
                .tokenExpiresAt(invitation.getTokenExpiresAt())
                .sentAt(invitation.getSentAt())
                .draftSavedAt(invitation.getDraftSavedAt())
                .submittedAt(invitation.getSubmittedAt())
                .cancelledAt(invitation.getCancelledAt())
                .smsDispatchResult(invitation.getSmsDispatchResult())
                .requiresGuardian(invitation.getRequiresGuardian())
                .destroyEligible(isDestroyEligible(invitation, retentionDays))
                .recipientName(invitation.getRecipientName())
                .build();
    }

    private static String normalizeRecipientName(String raw) {
        if (!StringUtils.hasText(raw)) {
            return null;
        }
        String trimmed = raw.trim();
        if (trimmed.length() > 120) {
            return trimmed.substring(0, 120);
        }
        return trimmed;
    }

    /**
     * one-shot publicUrl·absoluteUrl·shortUrl·평문 토큰 — ADMIN·CONSULTANT만 수신.
     *
     * @param response  응답
     * @param tenantId  테넌트 ID
     * @param rawToken  평문 토큰
     * @param shortLink 단축 링크(없으면 short 필드 null)
     */
    private void attachOneShotPublicLink(
            SctInvitationResponse response,
            String tenantId,
            String rawToken,
            SctShortLink shortLink) {
        if (!StringUtils.hasText(rawToken) || response == null) {
            return;
        }
        response.setToken(rawToken);
        response.setPublicUrl(SctConstants.PUBLIC_SCT_WEB_PREFIX + rawToken);
        response.setAbsoluteUrl(tenantPublicUrlResolver.resolveAbsolutePublicUrl(tenantId, rawToken));
        if (shortLink != null && StringUtils.hasText(shortLink.getShortCode())) {
            response.setShortUrl(SctConstants.SHORT_LINK_WEB_PREFIX + shortLink.getShortCode());
            response.setAbsoluteShortUrl(
                    tenantPublicUrlResolver.resolveAbsoluteShortUrl(tenantId, shortLink.getShortCode()));
        }
    }

    /**
     * 공개 링크(one-shot) 수신 가능 역할 — ADMIN·CONSULTANT.
     * STAFF는 임상 본문 403과 정합해 URL/토큰 미수신.
     *
     * @param actor 행위자
     * @return true면 one-shot 링크 포함 가능
     */
    private static boolean canReceiveOneShotPublicLink(User actor) {
        if (actor == null || actor.getRole() == null) {
            return false;
        }
        UserRole role = actor.getRole();
        return role == UserRole.ADMIN || role == UserRole.CONSULTANT;
    }

    /**
     * 링크 재발급 — ADMIN·CONSULTANT만 (STAFF 제외).
     *
     * @param actor 행위자
     */
    private static void requireAdminOrConsultant(User actor) {
        if (!canReceiveOneShotPublicLink(actor)) {
            throw new AccessDeniedException("권한이 없습니다.");
        }
    }

    /**
     * 테넌트 시퀀스로 관리번호 발급(PII 없음).
     *
     * @param tenantId 테넌트
     * @return SCT-000001 형식
     */
    private String nextManagementNo(String tenantId) {
        SctManagementNoSeq seq = managementNoSeqRepository.findByTenantIdForUpdate(tenantId)
                .orElseGet(() -> {
                    SctManagementNoSeq created = SctManagementNoSeq.builder()
                            .tenantId(tenantId)
                            .nextVal(1L)
                            .build();
                    return managementNoSeqRepository.saveAndFlush(created);
                });
        long value = seq.getNextVal() == null ? 1L : seq.getNextVal();
        seq.setNextVal(value + 1);
        managementNoSeqRepository.save(seq);
        return SctConstants.MANAGEMENT_NO_PREFIX
                + String.format(Locale.ROOT, "%0" + SctConstants.MANAGEMENT_NO_DIGITS + "d", value);
    }

    /**
     * 제출일(실시일) + 보관일 경과 여부.
     *
     * @param invitation    초대
     * @param retentionDays 보관일
     * @return 파기 대상이면 true
     */
    public static boolean isDestroyEligible(SctInvitation invitation, int retentionDays) {
        if (invitation == null || invitation.getSubmittedAt() == null) {
            return false;
        }
        if (!SctInviteStatus.SUBMITTED.name().equals(invitation.getStatus())) {
            return false;
        }
        LocalDateTime eligibleAt = invitation.getSubmittedAt().plusDays(retentionDays);
        return !eligibleAt.isAfter(LocalDateTime.now());
    }

    private static String escapeJson(String raw) {
        if (raw == null) {
            return "";
        }
        return raw.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    private String resolveFormType(Long formTemplateId) {
        return formTemplateRepository.findByIdAndIsDeletedFalse(formTemplateId)
                .map(SctFormTemplate::getFormType)
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

    private void requireStaffLike(User actor) {
        if (actor == null || actor.getRole() == null) {
            throw new AccessDeniedException("인증이 필요합니다.");
        }
        UserRole role = actor.getRole();
        if (role != UserRole.ADMIN && role != UserRole.STAFF && role != UserRole.CONSULTANT) {
            throw new AccessDeniedException("권한이 없습니다.");
        }
    }

    private void ensureCanAccessClient(String tenantId, User actor, Long clientId) {
        if (actor.getRole() == UserRole.ADMIN || actor.getRole() == UserRole.STAFF) {
            return;
        }
        ensureConsultantOwnsClient(tenantId, actor, clientId);
    }

    private void ensureCanAccessInvitation(String tenantId, User actor, SctInvitation invitation) {
        if (actor.getRole() == UserRole.ADMIN || actor.getRole() == UserRole.STAFF) {
            return;
        }
        if (!canConsultantAccess(tenantId, actor.getId(), invitation)) {
            throw new AccessDeniedException("담당 건만 접근할 수 있습니다.");
        }
    }

    private void ensureCanAccessClinicalBody(String tenantId, User actor, SctInvitation invitation) {
        if (actor.getRole() == UserRole.ADMIN) {
            return;
        }
        if (actor.getRole() == UserRole.STAFF) {
            SctClinicalAccessDenySupport.denyAndThrow(
                    clinicalAccessDeniedAuditWriter,
                    tenantId, actor, invitation, null,
                    "권한이 없습니다.");
        }
        if (actor.getRole() == UserRole.CONSULTANT) {
            if (!canConsultantAccess(tenantId, actor.getId(), invitation)) {
                SctClinicalAccessDenySupport.denyAndThrow(
                        clinicalAccessDeniedAuditWriter,
                        tenantId, actor, invitation, null,
                        "담당 건만 접근할 수 있습니다.");
            }
            return;
        }
        throw new AccessDeniedException("권한이 없습니다.");
    }

    /**
     * 토큰 해시 교체 직전 이전 해시를 회전 이력에 남긴다(평문 미저장).
     *
     * @param invitation 현재 초대
     */
    private void persistRotatedTokenHash(SctInvitation invitation) {
        String oldHash = invitation.getTokenHash();
        if (!StringUtils.hasText(oldHash)) {
            return;
        }
        if (rotatedTokenHashRepository.existsByTokenHash(oldHash)) {
            return;
        }
        rotatedTokenHashRepository.save(SctRotatedTokenHash.builder()
                .tenantId(invitation.getTenantId())
                .invitationId(invitation.getId())
                .tokenHash(oldHash)
                .rotatedAt(LocalDateTime.now())
                .build());
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

    private void ensureConsultantOwnsClient(String tenantId, User actor, Long clientId) {
        boolean ok = !mappingRepository
                .findActiveOrExhaustedListByTenantIdAndConsultantIdAndClientId(
                        tenantId, actor.getId(), clientId)
                .isEmpty();
        if (!ok) {
            SctClinicalAccessDenySupport.denyAndThrow(
                    clinicalAccessDeniedAuditWriter,
                    tenantId, actor, null, clientId,
                    "담당 내담자가 아닙니다.");
        }
    }

    /**
     * birthDate로 만 14세 미만 여부. 없으면 요청 플래그·CHILD 양식.
     *
     * @param formType 양식
     * @param client 내담자(미연동 null)
     * @param request 발송 요청
     * @return 법정대리인 필요 여부
     */
    private static boolean resolveRequiresGuardian(
            SctFormType formType, Client client, SctInviteCreateRequest request) {
        if (formType == SctFormType.CHILD) {
            return true;
        }
        if (client != null && client.getBirthDate() != null) {
            return isUnder14(client.getBirthDate());
        }
        return Boolean.TRUE.equals(request.getRequiresGuardian());
    }

    /**
     * 만 14세 미만 판정({@link Period}).
     *
     * @param birthDate 생년월일
     * @return true면 만 14세 미만
     */
    private static boolean isUnder14(LocalDate birthDate) {
        if (birthDate == null) {
            return false;
        }
        return Period.between(birthDate, LocalDate.now()).getYears() < SctConsentKeys.UNDER_14_AGE;
    }
}
