package com.coresolution.consultation.sct.service.impl;

import java.util.Optional;
import com.coresolution.consultation.exception.EntityNotFoundException;
import com.coresolution.consultation.sct.constant.SctConstants;
import com.coresolution.consultation.sct.constant.SctInviteStatus;
import com.coresolution.consultation.sct.entity.SctInvitation;
import com.coresolution.consultation.sct.entity.SctRotatedTokenHash;
import com.coresolution.consultation.sct.exception.SctGoneException;
import com.coresolution.consultation.sct.exception.SctLinkSessionExpiredException;
import com.coresolution.consultation.sct.repository.SctInvitationRepository;
import com.coresolution.consultation.sct.repository.SctRotatedTokenHashRepository;
import com.coresolution.consultation.sct.service.SctExchangeCodeStore;
import com.coresolution.consultation.sct.service.SctPublicTokenResolver;
import com.coresolution.consultation.security.pii.PiiHmacService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

/**
 * SCT 공개 토큰·교환 코드 해석 구현.
 *
 * <p>교환 코드 → 초대는 반드시 {@code findByTenantIdAndId...}(tenantId 포함).
 * tokenHash 바인딩·취소/만료는 fail-closed.</p>
 *
 * <p>교환 코드 사용 시간 초과는 410 {@link SctLinkSessionExpiredException}, 미존재는 404.
 * 로그에는 토큰·코드 원문 대신 {@link SctExchangeCodeStore#logRef(String)} 해시 접두만 남긴다.</p>
 *
 * @author MindGarden
 * @since 2026-11-27
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SctPublicTokenResolverImpl implements SctPublicTokenResolver {

    private final SctInvitationRepository invitationRepository;
    private final SctRotatedTokenHashRepository rotatedTokenHashRepository;
    private final SctExchangeCodeStore exchangeCodeStore;
    private final PiiHmacService piiHmacService;

    @Override
    public ResolvedPublicToken resolveToken(String rawToken, boolean allowReissuedForMeta) {
        if (!StringUtils.hasText(rawToken)) {
            throw new EntityNotFoundException("SCT 링크를 찾을 수 없습니다.");
        }
        String trimmed = rawToken.trim();
        Optional<SctInvitation> byHash = findInvitationByTokenCandidates(trimmed);
        if (byHash.isPresent()) {
            return new ResolvedPublicToken(byHash.get(), null);
        }

        Optional<SctExchangeCodeStore.ExchangeEntry> exchange = exchangeCodeStore.resolve(trimmed);
        if (exchange.isPresent()) {
            return resolveExchangeEntry(exchange.get(), allowReissuedForMeta);
        }
        throwIfExchangeExpired(trimmed);

        Optional<SctRotatedTokenHash> rotated = findRotatedByTokenCandidates(trimmed);
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
        log.warn("SCT public link miss: ref={}", SctExchangeCodeStore.logRef(trimmed));
        throw new EntityNotFoundException(SctConstants.MSG_LINK_NOT_FOUND);
    }

    /**
     * 발급됐으나 사용 시간이 지난 교환 코드 → 410(없음 404 와 구분).
     *
     * @param trimmed 토큰/교환 코드
     */
    private void throwIfExchangeExpired(String trimmed) {
        if (exchangeCodeStore.isExpired(trimmed)) {
            log.warn("SCT public link session expired: ref={}", SctExchangeCodeStore.logRef(trimmed));
            throw new SctLinkSessionExpiredException(SctConstants.MSG_LINK_SESSION_EXPIRED);
        }
    }

    @Override
    public SctInvitation loadByToken(String rawToken) {
        ResolvedPublicToken resolved = resolveToken(rawToken, false);
        if (SctConstants.PUBLIC_STATUS_REISSUED.equals(resolved.statusOverride())) {
            throw new SctGoneException("링크가 만료되었거나 취소되었습니다.");
        }
        return resolved.invitation();
    }

    @Override
    public SctInvitation loadInvitationForVerify(String rawToken) {
        if (!StringUtils.hasText(rawToken)) {
            throw new EntityNotFoundException("SCT 링크를 찾을 수 없습니다.");
        }
        String trimmed = rawToken.trim();
        Optional<SctInvitation> locked = findInvitationByTokenCandidatesForUpdate(trimmed);
        if (locked.isPresent()) {
            return locked.get();
        }

        Optional<SctExchangeCodeStore.ExchangeEntry> exchange = exchangeCodeStore.resolve(trimmed);
        if (exchange.isPresent()) {
            SctExchangeCodeStore.ExchangeEntry entry = exchange.get();
            if (SctConstants.PUBLIC_STATUS_REISSUED.equals(entry.landingStatus())) {
                throw new SctGoneException("링크가 만료되었거나 취소되었습니다.");
            }
            SctInvitation invitation = invitationRepository
                    .findByTenantIdAndIdAndIsDeletedFalseForUpdate(
                            entry.tenantId(), entry.invitationId())
                    .orElseThrow(() -> new EntityNotFoundException("SCT 링크를 찾을 수 없습니다."));
            assertExchangeBoundToInvitation(entry, invitation);
            assertExchangeInvitationNotClosed(invitation);
            return invitation;
        }

        // 회전 이력 등 — loadByToken이 410/404 처리
        return loadByToken(trimmed);
    }

    private Optional<SctInvitation> findInvitationByTokenCandidates(String rawToken) {
        for (String hash : piiHmacService.lookupCandidates(rawToken)) {
            Optional<SctInvitation> found =
                    invitationRepository.findByTokenHashAndIsDeletedFalse(hash);
            if (found.isPresent()) {
                return found;
            }
        }
        return Optional.empty();
    }

    private Optional<SctInvitation> findInvitationByTokenCandidatesForUpdate(String rawToken) {
        for (String hash : piiHmacService.lookupCandidates(rawToken)) {
            Optional<SctInvitation> found =
                    invitationRepository.findByTokenHashAndIsDeletedFalseForUpdate(hash);
            if (found.isPresent()) {
                return found;
            }
        }
        return Optional.empty();
    }

    private Optional<SctRotatedTokenHash> findRotatedByTokenCandidates(String rawToken) {
        for (String hash : piiHmacService.lookupCandidates(rawToken)) {
            Optional<SctRotatedTokenHash> found = rotatedTokenHashRepository.findByTokenHash(hash);
            if (found.isPresent()) {
                return found;
            }
        }
        return Optional.empty();
    }

    /**
     * 교환 코드 → 초대. tokenHash 불일치·취소/만료는 fail-closed.
     *
     * @param entry                Redis 엔트리
     * @param allowReissuedForMeta meta 전용 REISSUED 허용
     * @return 해석 결과
     */
    private ResolvedPublicToken resolveExchangeEntry(
            SctExchangeCodeStore.ExchangeEntry entry, boolean allowReissuedForMeta) {
        if (SctConstants.PUBLIC_STATUS_REISSUED.equals(entry.landingStatus())) {
            if (!allowReissuedForMeta) {
                throw new SctGoneException("링크가 만료되었거나 취소되었습니다.");
            }
        }
        SctInvitation invitation = invitationRepository
                .findByTenantIdAndIdAndIsDeletedFalse(entry.tenantId(), entry.invitationId())
                .orElseThrow(() -> new EntityNotFoundException("SCT 링크를 찾을 수 없습니다."));
        assertExchangeBoundToInvitation(entry, invitation);
        assertExchangeInvitationNotClosed(invitation);
        return new ResolvedPublicToken(invitation, entry.landingStatus());
    }

    /**
     * 교환 코드가 발급 시점 tokenHash와 일치하는지 확인(재발급·재발송 무효화).
     *
     * @param entry      Redis 엔트리
     * @param invitation 현재 초대
     */
    private void assertExchangeBoundToInvitation(
            SctExchangeCodeStore.ExchangeEntry entry, SctInvitation invitation) {
        if (!invitation.getTenantId().equals(entry.tenantId())) {
            log.warn("SCT exchange tenant mismatch: invitationId={}", entry.invitationId());
            throw new EntityNotFoundException(SctConstants.MSG_LINK_NOT_FOUND);
        }
        if (!StringUtils.hasText(entry.tokenHash())
                || !entry.tokenHash().equals(invitation.getTokenHash())) {
            log.warn("SCT exchange token rotated (reissue/resend): invitationId={}", entry.invitationId());
            throw new EntityNotFoundException(SctConstants.MSG_LINK_NOT_FOUND);
        }
    }

    /**
     * 취소·만료 초대에 묶인 교환 코드는 Gone(신규 교환도 단축 링크에서 차단).
     *
     * @param invitation 초대
     */
    private void assertExchangeInvitationNotClosed(SctInvitation invitation) {
        if (SctInviteStatus.CANCELLED.name().equals(invitation.getStatus())
                || SctInviteStatus.EXPIRED.name().equals(invitation.getStatus())) {
            throw new SctGoneException("링크가 만료되었거나 취소되었습니다.");
        }
    }
}
