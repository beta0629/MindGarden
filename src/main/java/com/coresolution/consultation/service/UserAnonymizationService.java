package com.coresolution.consultation.service;

import com.coresolution.consultation.dto.lifecycle.Actor;
import com.coresolution.consultation.dto.lifecycle.AnonymizeResult;
import com.coresolution.consultation.entity.User;

/**
 * 회원 익명화 SSOT — USER_LIFECYCLE_TERMINATION_POLICY §3 PII 매트릭스 + §7.1 W3 email tombstone.
 *
 * <p>자발/강제/자동 어느 경로든 lifecycle_state 이 ANONYMIZED 로 진입하는 시점의 PII 처리는
 * {@link #anonymize(Long, Actor, String)} 단일 진입점을 통해 수행한다. 분산 호출 절대 금지.</p>
 *
 * <p>본 service 는 단일 트랜잭션 내에서:</p>
 * <ol>
 *   <li>{@code users} PII 컬럼 surrogate 치환 (§3.2)</li>
 *   <li>W3 email tombstone 패턴 적용 — {@code deleted-{uid}-{epoch}@anonymized.local}</li>
 *   <li>{@code audit_logs} 에 USER_ANONYMIZE 기록 (W1 SSOT)</li>
 *   <li>{@code personal_data_destruction_logs} 에 ANONYMIZE 기록 (PIPA §16)</li>
 * </ol>
 *
 * <p>FK 자식 테이블 sweep (§4.4) — refresh_token / passkey / sessions 등의 정리는 별도
 * sweep 호출자에서 처리하거나 후속 위임 (Phase 2-β / 3) 에서 확장한다. 본 service 는 user
 * 행 자체의 PII 안전을 단일 책임으로 한다.</p>
 *
 * @author CoreSolution
 * @since 2026-06-05
 */
public interface UserAnonymizationService {

    /**
     * 사용자 PII 익명화 + W3 tombstone + audit/destruction 동시 기록.
     *
     * @param userId 대상 users.id
     * @param actor  행위자 ({@link Actor})
     * @param reason 사유 (예: WITHDRAWAL_GRACE_EXPIRED / ADMIN_WINDOW_EXPIRED / DORMANT_AUTO)
     * @return 익명화 결과
     */
    AnonymizeResult anonymize(Long userId, Actor actor, String reason);

    /**
     * Email tombstone 표준 패턴 빌드 (§7.1 W3).
     *
     * @param userId         users.id
     * @param epochSeconds   익명화 시각 epoch seconds
     * @return {@code deleted-{userId}-{epoch}@anonymized.local}
     */
    static String buildEmailTombstone(Long userId, long epochSeconds) {
        if (userId == null) {
            throw new IllegalArgumentException("userId must not be null for email tombstone");
        }
        return "deleted-" + userId + "-" + epochSeconds + "@anonymized.local";
    }

    /**
     * 입력 user 가 이미 ANONYMIZED 상태인지 확인 (idempotent guard 용).
     *
     * @param user user
     * @return 이미 익명화 (ANONYMIZED/HARD_DELETED) 상태면 true
     */
    static boolean isAlreadyTerminal(User user) {
        return user != null
                && user.getLifecycleState() != null
                && user.getLifecycleState().isTerminal();
    }
}
