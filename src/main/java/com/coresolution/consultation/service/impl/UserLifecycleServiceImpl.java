package com.coresolution.consultation.service.impl;

import java.time.LocalDateTime;

import com.coresolution.consultation.constant.AuditAction;
import com.coresolution.consultation.constant.LifecycleState;
import com.coresolution.consultation.dto.lifecycle.Actor;
import com.coresolution.consultation.dto.lifecycle.AnonymizeResult;
import com.coresolution.consultation.dto.lifecycle.DormantUserPiiSnapshot;
import com.coresolution.consultation.dto.lifecycle.TransitionResult;
import com.coresolution.consultation.dto.lifecycle.WithdrawalOptions;
import com.coresolution.consultation.entity.AuditLog;
import com.coresolution.consultation.entity.DormantUserPiiVault;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.exception.IllegalStateTransitionException;
import com.coresolution.consultation.repository.AuditLogRepository;
import com.coresolution.consultation.repository.DormantUserPiiVaultRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.DormantPiiVaultService;
import com.coresolution.consultation.service.UserAnonymizationService;
import com.coresolution.consultation.service.UserLifecycleService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * {@link UserLifecycleService} 기본 구현 — USER_LIFECYCLE_TERMINATION_POLICY §3.6 단일 진입점.
 *
 * <p>전이 가드 → PII 매트릭스 위임 → audit_logs 기록 의 3단계를 단일 트랜잭션으로 수행한다.
 * ANONYMIZED 진입 시에는 {@link UserAnonymizationService} 가 PII 처리·email tombstone·
 * destruction log 까지 책임지므로 본 service 는 audit_logs 만 보강한다.</p>
 *
 * @author CoreSolution
 * @since 2026-06-05
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserLifecycleServiceImpl implements UserLifecycleService {

    private final UserRepository userRepository;
    private final AuditLogRepository auditLogRepository;
    private final UserAnonymizationService userAnonymizationService;
    private final DormantUserPiiVaultRepository dormantUserPiiVaultRepository;
    private final DormantPiiVaultService dormantPiiVaultService;

    @Override
    @Transactional
    public TransitionResult transitionTo(
            Long userId, LifecycleState newState, Actor actor, String reason) {
        if (userId == null) {
            throw new IllegalArgumentException("userId must not be null");
        }
        if (newState == null) {
            throw new IllegalArgumentException("newState must not be null");
        }
        if (actor == null) {
            throw new IllegalArgumentException("actor must not be null");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        LifecycleState fromState = user.getLifecycleState();
        if (fromState == null) {
            // 마이그레이션 적용 직후 NULL 잔존 시 — 전이 가드 보호 차원
            throw new IllegalStateTransitionException(null, newState,
                    "current lifecycleState is null (migration not applied?)");
        }

        if (!fromState.canTransitionTo(newState)) {
            throw new IllegalStateTransitionException(fromState, newState);
        }

        LocalDateTime now = LocalDateTime.now();

        if (newState == LifecycleState.ANONYMIZED) {
            // ANONYMIZED 진입 — PII 매트릭스 + email tombstone + destruction log 위임
            AnonymizeResult anonymizeResult =
                    userAnonymizationService.anonymize(userId, actor, reason);
            return TransitionResult.builder()
                    .userId(userId)
                    .fromState(fromState)
                    .toState(LifecycleState.ANONYMIZED)
                    .auditLogId(anonymizeResult.getAuditLogId())
                    .destructionLogId(anonymizeResult.getDestructionLogId())
                    .transitionedAt(anonymizeResult.getAnonymizedAt())
                    .build();
        }

        // 일반 전이 — withdrawal stamp 처리 + audit_logs 기록
        applyWithdrawalStamp(user, fromState, newState, now);
        user.setLifecycleState(newState);
        user.setUpdatedAt(now);
        userRepository.save(user);

        AuditLog auditEntry = AuditLog.builder()
                .tenantId(user.getTenantId())
                .actorUserId(actor.getActorUserId())
                .actorRole(actor.getActorRole())
                .targetUserId(userId)
                .action(resolveAuditAction(fromState, newState))
                .entityType("USER")
                .entityId(userId)
                .build();
        AuditLog savedAudit = auditLogRepository.save(auditEntry);

        log.info("[Lifecycle] transition: userId={}, {} -> {}, actor={}, reason={}",
                userId, fromState, newState, actor, reason);

        return TransitionResult.builder()
                .userId(userId)
                .fromState(fromState)
                .toState(newState)
                .auditLogId(savedAudit.getId())
                .transitionedAt(now)
                .build();
    }

    @Override
    @Transactional
    public TransitionResult requestWithdrawal(Long userId, Actor actor) {
        return requestWithdrawal(userId, actor, WithdrawalOptions.defaults());
    }

    @Override
    @Transactional
    public TransitionResult requestWithdrawal(Long userId, Actor actor, WithdrawalOptions options) {
        WithdrawalOptions resolved = options != null ? options : WithdrawalOptions.defaults();
        TransitionResult result = transitionTo(userId, LifecycleState.WITHDRAWAL_PENDING, actor,
                "SELF_WITHDRAWAL_REQUEST");

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalStateException(
                        "User disappeared after transitionTo: " + userId));
        // toJsonOrNull() — 기본값은 null 반환 → 컬럼 NULL 유지 (storage 효율 + idempotent 비교).
        user.setWithdrawalOptionsJson(resolved.toJsonOrNull());
        userRepository.save(user);

        return result;
    }

    @Override
    @Transactional
    public TransitionResult cancelWithdrawal(Long userId, Actor actor) {
        TransitionResult result = transitionTo(userId, LifecycleState.ACTIVE, actor,
                "SELF_WITHDRAWAL_CANCEL");
        // 취소 시점에 보관된 옵션 정리 (재요청 시 깨끗한 상태에서 다시 적재).
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalStateException(
                        "User disappeared after transitionTo: " + userId));
        user.setWithdrawalOptionsJson(null);
        userRepository.save(user);
        return result;
    }

    @Override
    @Transactional
    public TransitionResult reactivate(Long userId, String tenantId, Actor actor) {
        if (userId == null) {
            throw new IllegalArgumentException("userId must not be null");
        }
        if (tenantId == null || tenantId.isBlank()) {
            throw new IllegalArgumentException("tenantId must not be blank");
        }
        if (actor == null) {
            throw new IllegalArgumentException("actor must not be null");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        if (user.getLifecycleState() == LifecycleState.ACTIVE) {
            // 이미 ACTIVE — idempotent (vault 행이 잔존하면 함께 정리)
            dormantUserPiiVaultRepository
                    .findByUserIdAndTenantId(userId, tenantId)
                    .ifPresent(vault -> {
                        vault.setPreNoticeAcknowledgedAt(LocalDateTime.now());
                        dormantUserPiiVaultRepository.delete(vault);
                    });
            return TransitionResult.builder()
                    .userId(userId)
                    .fromState(LifecycleState.ACTIVE)
                    .toState(LifecycleState.ACTIVE)
                    .transitionedAt(LocalDateTime.now())
                    .build();
        }

        if (user.getLifecycleState() != LifecycleState.DORMANT) {
            throw new IllegalStateTransitionException(
                    user.getLifecycleState(), LifecycleState.ACTIVE,
                    "reactivate() requires lifecycleState=DORMANT — actual: "
                            + user.getLifecycleState());
        }

        DormantUserPiiVault vault = dormantUserPiiVaultRepository
                .findByUserIdAndTenantId(userId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "DormantUserPiiVault not found for userId=" + userId
                                + ", tenantId=" + tenantId));

        DormantUserPiiSnapshot snapshot = dormantPiiVaultService.decrypt(vault.getEncryptedPii());
        snapshot.applyTo(user);

        LocalDateTime now = LocalDateTime.now();
        user.setLifecycleState(LifecycleState.ACTIVE);
        user.setUpdatedAt(now);
        userRepository.save(user);

        AuditLog auditEntry = AuditLog.builder()
                .tenantId(user.getTenantId())
                .actorUserId(actor.getActorUserId())
                .actorRole(actor.getActorRole())
                .targetUserId(userId)
                .action(AuditAction.PII_VAULT_RESTORE)
                .entityType("USER")
                .entityId(userId)
                .build();
        AuditLog savedAudit = auditLogRepository.save(auditEntry);

        // vault 행 정리 — PII 복원 완료 후에는 더 이상 vault 보관 불요
        dormantUserPiiVaultRepository.delete(vault);

        log.info("[Lifecycle] reactivate complete: userId={}, tenantId={}, actor={}",
                userId, tenantId, actor);

        return TransitionResult.builder()
                .userId(userId)
                .fromState(LifecycleState.DORMANT)
                .toState(LifecycleState.ACTIVE)
                .auditLogId(savedAudit.getId())
                .transitionedAt(now)
                .build();
    }

    /**
     * withdrawal_requested_at stamp 처리.
     *
     * <ul>
     *   <li>WITHDRAWAL_PENDING 진입 → now() stamp</li>
     *   <li>WITHDRAWAL_PENDING → ACTIVE 복귀 → null 로 clear</li>
     *   <li>그 외 전이 → 변경 없음</li>
     * </ul>
     */
    void applyWithdrawalStamp(
            User user, LifecycleState fromState, LifecycleState newState, LocalDateTime now) {
        if (newState == LifecycleState.WITHDRAWAL_PENDING) {
            user.setWithdrawalRequestedAt(now);
        } else if (fromState == LifecycleState.WITHDRAWAL_PENDING
                && newState == LifecycleState.ACTIVE) {
            user.setWithdrawalRequestedAt(null);
        }
    }

    /**
     * audit_logs.action enum 매핑 — §8.2 표.
     */
    static AuditAction resolveAuditAction(LifecycleState fromState, LifecycleState newState) {
        if (newState == LifecycleState.WITHDRAWAL_PENDING) {
            return AuditAction.USER_WITHDRAWAL_REQUEST;
        }
        if (fromState == LifecycleState.WITHDRAWAL_PENDING && newState == LifecycleState.ACTIVE) {
            return AuditAction.USER_WITHDRAWAL_CANCEL;
        }
        if (newState == LifecycleState.DELETED_BY_ADMIN) {
            return AuditAction.ADMIN_FORCE_DEACTIVATE;
        }
        if (newState == LifecycleState.DORMANT) {
            return AuditAction.USER_DORMANT_TRANSITION;
        }
        if (newState == LifecycleState.HARD_DELETED) {
            return AuditAction.USER_HARD_DELETE;
        }
        if (newState == LifecycleState.ACTIVE) {
            return AuditAction.USER_RESTORE;
        }
        return AuditAction.LIFECYCLE_STATE_CHANGE;
    }
}
