package com.coresolution.consultation.service.impl;

import java.util.Optional;

import com.coresolution.consultation.constant.LifecycleState;
import com.coresolution.consultation.dto.lifecycle.Actor;
import com.coresolution.consultation.dto.lifecycle.DormantUserDetailResponse;
import com.coresolution.consultation.dto.lifecycle.DormantUserSummaryResponse;
import com.coresolution.consultation.dto.lifecycle.TransitionResult;
import com.coresolution.consultation.entity.DormantUserPiiVault;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.CommunityAnonymizationAuditRepository;
import com.coresolution.consultation.repository.DormantUserPiiVaultRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.AdminLifecycleService;
import com.coresolution.consultation.service.UserLifecycleService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * {@link AdminLifecycleService} 기본 구현 — Phase 4 어드민 모니터링.
 *
 * <p>휴면 사용자의 vault 메타데이터를 합쳐 응답을 빌드한다. 원본 PII 는 항상 vault 에
 * 안전 보관되며 본 서비스는 절대 복호화하지 않는다. reactivate 만이 PII 복원을 수행한다.</p>
 *
 * @author CoreSolution
 * @since 2026-06-06
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AdminLifecycleServiceImpl implements AdminLifecycleService {

    /** 마스킹 시 앞에서 보여줄 문자 수 (예: "client" 6자 → "client*****"). */
    static final int MASK_VISIBLE_PREFIX_LENGTH = 4;

    /** 마스킹에 사용되는 단일 문자. */
    static final char MASK_CHAR = '*';

    /** 마스킹 후 노출되는 최소 문자열 길이 (전체 마스킹 회피). */
    static final int MIN_MASKED_LENGTH = 4;

    private final UserRepository userRepository;
    private final DormantUserPiiVaultRepository dormantUserPiiVaultRepository;
    private final CommunityAnonymizationAuditRepository communityAnonymizationAuditRepository;
    private final UserLifecycleService userLifecycleService;

    @Override
    @Transactional(readOnly = true)
    public Page<DormantUserSummaryResponse> listDormantUsers(
            String tenantId, Pageable pageable) {
        if (tenantId == null || tenantId.isBlank()) {
            throw new IllegalArgumentException("tenantId must not be blank");
        }
        Page<User> page = userRepository.findDormantUsersByTenantId(tenantId, pageable);
        return page.map(user -> buildSummary(user, tenantId));
    }

    @Override
    @Transactional(readOnly = true)
    public DormantUserDetailResponse getDormantUserDetail(String tenantId, Long userId) {
        if (tenantId == null || tenantId.isBlank()) {
            throw new IllegalArgumentException("tenantId must not be blank");
        }
        if (userId == null) {
            throw new IllegalArgumentException("userId must not be null");
        }
        User user = userRepository.findDormantUserByTenantIdAndId(tenantId, userId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "DORMANT user not found for tenantId=" + tenantId + ", userId=" + userId));

        Optional<DormantUserPiiVault> vaultOpt =
                dormantUserPiiVaultRepository.findByUserIdAndTenantId(userId, tenantId);
        long auditCount = communityAnonymizationAuditRepository
                .countByTenantIdAndOriginalUserId(tenantId, userId);

        return DormantUserDetailResponse.builder()
                .userId(user.getId())
                .maskedUserId(maskUserId(user.getUserId()))
                .role(user.getRole() != null ? user.getRole().name() : null)
                .lifecycleState(user.getLifecycleState() != null
                        ? user.getLifecycleState().name() : null)
                .lastLoginAt(user.getLastLoginAt())
                .updatedAt(user.getUpdatedAt())
                .dormantEnteredAt(vaultOpt.map(DormantUserPiiVault::getDormantEnteredAt).orElse(null))
                .anonymizeScheduledAt(vaultOpt
                        .map(DormantUserPiiVault::getAnonymizeScheduledAt).orElse(null))
                .preNoticeSentAt(vaultOpt.map(DormantUserPiiVault::getPreNoticeSentAt).orElse(null))
                .preNoticeChannel(vaultOpt
                        .map(DormantUserPiiVault::getPreNoticeChannel).orElse(null))
                .communityAnonymizationAuditCount(auditCount)
                .vaultPresent(vaultOpt.isPresent())
                .build();
    }

    @Override
    @Transactional
    public TransitionResult reactivateDormantUser(String tenantId, Long userId, Actor actor) {
        ensureActor(actor);
        log.info("[AdminLifecycle] reactivate request — tenantId={}, userId={}, actor={}",
                tenantId, userId, actor);
        return userLifecycleService.reactivate(userId, tenantId, actor);
    }

    @Override
    @Transactional
    public TransitionResult forceAnonymizeDormantUser(
            String tenantId, Long userId, Actor actor) {
        ensureActor(actor);
        if (tenantId == null || tenantId.isBlank()) {
            throw new IllegalArgumentException("tenantId must not be blank");
        }
        if (userId == null) {
            throw new IllegalArgumentException("userId must not be null");
        }
        // 가드: DORMANT 인 사용자만 본 endpoint 로 접근 가능 (다른 상태는 별도 경로 사용).
        User user = userRepository.findDormantUserByTenantIdAndId(tenantId, userId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "DORMANT user not found for tenantId=" + tenantId + ", userId=" + userId));

        log.info("[AdminLifecycle] forceAnonymize request — tenantId={}, userId={}, "
                        + "actor={}, currentState={}",
                tenantId, userId, actor, user.getLifecycleState());

        // ANONYMIZED 로 전이 — UserAnonymizationService 가 PII 매트릭스 + community 옵션 b 적용.
        TransitionResult result = userLifecycleService.transitionTo(
                userId, LifecycleState.ANONYMIZED, actor, "ADMIN_FORCED_DORMANT_ANONYMIZE");

        // vault 행 정리 — anonymize 후에는 더 이상 보관 불요 (PIPA §16).
        dormantUserPiiVaultRepository.findByUserIdAndTenantId(userId, tenantId)
                .ifPresent(dormantUserPiiVaultRepository::delete);

        return result;
    }

    /**
     * Summary 응답 빌드 — vault 없으면 vaultPresent=false 로 표기.
     *
     * @param user     DORMANT 사용자
     * @param tenantId 테넌트 ID
     * @return summary DTO
     */
    DormantUserSummaryResponse buildSummary(User user, String tenantId) {
        Optional<DormantUserPiiVault> vaultOpt =
                dormantUserPiiVaultRepository.findByUserIdAndTenantId(user.getId(), tenantId);
        return DormantUserSummaryResponse.builder()
                .userId(user.getId())
                .maskedUserId(maskUserId(user.getUserId()))
                .role(user.getRole() != null ? user.getRole().name() : null)
                .dormantEnteredAt(vaultOpt
                        .map(DormantUserPiiVault::getDormantEnteredAt).orElse(null))
                .anonymizeScheduledAt(vaultOpt
                        .map(DormantUserPiiVault::getAnonymizeScheduledAt).orElse(null))
                .preNoticeSentAt(vaultOpt
                        .map(DormantUserPiiVault::getPreNoticeSentAt).orElse(null))
                .preNoticeChannel(vaultOpt
                        .map(DormantUserPiiVault::getPreNoticeChannel).orElse(null))
                .vaultPresent(vaultOpt.isPresent())
                .build();
    }

    /**
     * userId 의 처음 {@link #MASK_VISIBLE_PREFIX_LENGTH} 자만 노출하고 나머지는 마스킹.
     *
     * <p>예: "client123" → "clie*****", "ab" → "ab**" (최소 노출 길이 강제).</p>
     *
     * @param userId users.user_id (string)
     * @return 마스킹된 문자열 (null 입력 시 빈 문자열)
     */
    static String maskUserId(String userId) {
        if (userId == null || userId.isEmpty()) {
            return "";
        }
        int prefixLen = Math.min(userId.length(), MASK_VISIBLE_PREFIX_LENGTH);
        String prefix = userId.substring(0, prefixLen);
        int maskCount = Math.max(MIN_MASKED_LENGTH, userId.length() - prefixLen);
        char[] mask = new char[maskCount];
        java.util.Arrays.fill(mask, MASK_CHAR);
        return prefix + new String(mask);
    }

    static void ensureActor(Actor actor) {
        if (actor == null) {
            throw new IllegalArgumentException("actor must not be null");
        }
    }
}
