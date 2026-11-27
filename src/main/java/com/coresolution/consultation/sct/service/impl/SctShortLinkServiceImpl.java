package com.coresolution.consultation.sct.service.impl;

import java.time.LocalDateTime;
import java.util.Optional;
import com.coresolution.consultation.sct.constant.SctConstants;
import com.coresolution.consultation.sct.entity.SctInvitation;
import com.coresolution.consultation.sct.entity.SctShortLink;
import com.coresolution.consultation.sct.repository.SctInvitationRepository;
import com.coresolution.consultation.sct.repository.SctShortLinkRepository;
import com.coresolution.consultation.sct.service.SctExchangeCodeStore;
import com.coresolution.consultation.sct.service.SctShortLinkService;
import com.coresolution.consultation.sct.util.SctShortCodeGenerator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * SCT 단축 링크 서비스.
 *
 * @author MindGarden
 * @since 2026-11-27
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SctShortLinkServiceImpl implements SctShortLinkService {

    private final SctShortLinkRepository shortLinkRepository;
    private final SctInvitationRepository invitationRepository;
    private final SctExchangeCodeStore exchangeCodeStore;

    @Override
    @Transactional
    public SctShortLink createOrRotate(SctInvitation invitation) {
        if (invitation == null || invitation.getId() == null
                || !StringUtils.hasText(invitation.getTenantId())) {
            throw new IllegalArgumentException("invitation with id and tenantId required");
        }
        String tenantId = invitation.getTenantId();
        Long invitationId = invitation.getId();
        shortLinkRepository.deactivateActiveForInvitation(tenantId, invitationId);

        LocalDateTime expiresAt = invitation.getTokenExpiresAt();
        if (expiresAt == null) {
            throw new IllegalStateException("invitation tokenExpiresAt required for short link");
        }

        DataIntegrityViolationException lastCollision = null;
        for (int attempt = 1; attempt <= SctConstants.SHORT_CODE_MAX_RETRIES; attempt++) {
            String code = SctShortCodeGenerator.generate();
            if (shortLinkRepository.existsByShortCodeAndIsDeletedFalse(code)) {
                continue;
            }
            SctShortLink link = SctShortLink.builder()
                    .invitationId(invitationId)
                    .shortCode(code)
                    .expiresAt(expiresAt)
                    .isActive(true)
                    .build();
            link.setTenantId(tenantId);
            try {
                SctShortLink saved = shortLinkRepository.saveAndFlush(link);
                log.info("SCT short-link created: tenant={} invitationId={} codePrefix={} attempt={}",
                        tenantId, invitationId, codePrefix(code), attempt);
                return saved;
            } catch (DataIntegrityViolationException collision) {
                lastCollision = collision;
                log.warn("SCT short-link UK collision attempt={}/{} codePrefix={}",
                        attempt, SctConstants.SHORT_CODE_MAX_RETRIES, codePrefix(code));
            }
        }
        throw new IllegalStateException(
                "SCT 단축 코드 발급에 실패했습니다(충돌 재시도 초과).", lastCollision);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<SctShortLink> findActive(String tenantId, Long invitationId) {
        if (!StringUtils.hasText(tenantId) || invitationId == null) {
            return Optional.empty();
        }
        return shortLinkRepository
                .findFirstByTenantIdAndInvitationIdAndIsActiveTrueAndIsDeletedFalseOrderByCreatedAtDesc(
                        tenantId, invitationId);
    }

    @Override
    @Transactional
    public String resolveRedirectPath(String shortCode) {
        if (!SctShortCodeGenerator.isValidFormat(shortCode)) {
            log.info("SCT short-link redirect invalid format codePrefix={}", codePrefix(shortCode));
            return SctConstants.SHORT_LINK_INVALID_REDIRECT_PATH;
        }
        Optional<SctShortLink> found =
                shortLinkRepository.findByShortCodeAndIsDeletedFalse(shortCode.trim());
        if (found.isEmpty()) {
            log.info("SCT short-link redirect miss codePrefix={}", codePrefix(shortCode));
            return SctConstants.SHORT_LINK_INVALID_REDIRECT_PATH;
        }
        SctShortLink link = found.get();
        Optional<SctInvitation> invitationOpt = invitationRepository
                .findByTenantIdAndIdAndIsDeletedFalse(link.getTenantId(), link.getInvitationId());
        if (invitationOpt.isEmpty()) {
            log.info("SCT short-link redirect orphan codePrefix={} tenant={}",
                    codePrefix(shortCode), link.getTenantId());
            return SctConstants.SHORT_LINK_INVALID_REDIRECT_PATH;
        }
        SctInvitation invitation = invitationOpt.get();
        if (!link.getTenantId().equals(invitation.getTenantId())) {
            log.warn("SCT short-link tenant mismatch codePrefix={}", codePrefix(shortCode));
            return SctConstants.SHORT_LINK_INVALID_REDIRECT_PATH;
        }

        String landingStatus = null;
        boolean inactive = !Boolean.TRUE.equals(link.getIsActive());
        boolean codeExpired = link.getExpiresAt() != null
                && link.getExpiresAt().isBefore(LocalDateTime.now());
        if (inactive) {
            landingStatus = SctConstants.PUBLIC_STATUS_REISSUED;
        }

        try {
            String exchange = exchangeCodeStore.issue(
                    invitation.getId(), invitation.getTenantId(), landingStatus);
            log.info("SCT short-link redirect ok codePrefix={} inactive={} expired={} exchangePrefix={}",
                    codePrefix(shortCode), inactive, codeExpired, codePrefix(exchange));
            return SctConstants.PUBLIC_SCT_WEB_PREFIX + exchange;
        } catch (RuntimeException ex) {
            log.warn("SCT short-link exchange issue failed codePrefix={}: {}",
                    codePrefix(shortCode), ex.getMessage());
            return SctConstants.SHORT_LINK_INVALID_REDIRECT_PATH;
        }
    }

    @Override
    @Transactional
    public void refreshExpiry(String tenantId, Long invitationId, LocalDateTime expiresAt) {
        if (!StringUtils.hasText(tenantId) || invitationId == null || expiresAt == null) {
            return;
        }
        shortLinkRepository
                .findByTenantIdAndInvitationIdAndIsActiveTrueAndIsDeletedFalse(tenantId, invitationId)
                .forEach(link -> {
                    link.setExpiresAt(expiresAt);
                    shortLinkRepository.save(link);
                });
    }

    private static String codePrefix(String code) {
        if (!StringUtils.hasText(code)) {
            return "";
        }
        int keep = Math.min(2, code.length());
        return code.substring(0, keep);
    }
}
