package com.coresolution.consultation.service;

import com.coresolution.consultation.constant.LifecycleState;
import com.coresolution.consultation.dto.lifecycle.Actor;
import com.coresolution.consultation.dto.lifecycle.TransitionResult;
import com.coresolution.consultation.dto.lifecycle.WithdrawalOptions;
import com.coresolution.consultation.exception.IllegalStateTransitionException;

/**
 * 회원 lifecycle 단계 전이 SSOT — USER_LIFECYCLE_TERMINATION_POLICY §3.6 단일 진입점.
 *
 * <p>자발/강제/자동 모든 종료 경로는 본 service 의 {@link #transitionTo(Long, LifecycleState,
 * Actor, String)} 만 호출해야 한다. 본 service 가 (a) 전이 그래프 가드, (b) PII 매트릭스
 * 적용 위임, (c) audit_logs 기록, (d) 단일 트랜잭션 보장을 담당한다.</p>
 *
 * <p>호출 예:</p>
 * <pre>{@code
 *   userLifecycleService.transitionTo(userId, LifecycleState.WITHDRAWAL_PENDING,
 *       Actor.user(currentUserId, "CLIENT"), "SELF_WITHDRAWAL_REQUEST");
 * }</pre>
 *
 * @author CoreSolution
 * @since 2026-06-05
 */
public interface UserLifecycleService {

    /**
     * 회원 lifecycle 상태 전이 단일 진입점.
     *
     * @param userId   대상 users.id
     * @param newState 목표 상태 ({@link LifecycleState})
     * @param actor    행위자 ({@link Actor})
     * @param reason   사유 (audit_logs / destruction_logs metadata)
     * @return 전이 결과 ({@link TransitionResult})
     * @throws IllegalArgumentException        userId/newState/actor 가 null 일 때
     * @throws IllegalStateTransitionException §3.6 전이 그래프 위반 시
     */
    TransitionResult transitionTo(Long userId, LifecycleState newState, Actor actor, String reason);

    /**
     * 자발 탈퇴 신청 — ACTIVE → WITHDRAWAL_PENDING 전이 + withdrawal_requested_at stamp.
     *
     * <p>본인 옵션 없이 호출하는 호환용 시그니처. 내부적으로
     * {@link WithdrawalOptions#defaults()} 로 위임된다.</p>
     *
     * @param userId 대상 users.id (본인)
     * @param actor  행위자 (본인)
     * @return 전이 결과
     */
    TransitionResult requestWithdrawal(Long userId, Actor actor);

    /**
     * 자발 탈퇴 신청 — ACTIVE → WITHDRAWAL_PENDING 전이 + withdrawal_requested_at stamp +
     * withdrawal_options_json 직렬화.
     *
     * <p>USER_LIFECYCLE_TERMINATION_POLICY v1.1 §0.1 Q12-b — 본인이 선택한 옵션을
     * {@code users.withdrawal_options_json} 컬럼에 보관한다. 30일 유예 만료 후
     * {@code WithdrawalGracePeriodScheduler} 가 ANONYMIZED 전이 시점에
     * {@link com.coresolution.consultation.service.UserAnonymizationService} 로 옵션을
     * 복원·전달하여 community body 처리 등 PII 분기에 사용한다.</p>
     *
     * @param userId  대상 users.id (본인)
     * @param actor   행위자 (본인)
     * @param options 본인 선택 옵션 (null 인 경우 {@link WithdrawalOptions#defaults()} 로 해석)
     * @return 전이 결과
     */
    TransitionResult requestWithdrawal(Long userId, Actor actor, WithdrawalOptions options);

    /**
     * 자발 탈퇴 취소 — WITHDRAWAL_PENDING → ACTIVE 전이 + withdrawal_requested_at clear.
     *
     * @param userId 대상 users.id (본인)
     * @param actor  행위자 (본인)
     * @return 전이 결과
     */
    TransitionResult cancelWithdrawal(Long userId, Actor actor);

    /**
     * 휴면 사용자 활성 복귀 — DORMANT → ACTIVE 전이 + dormant_user_pii_vault 복호화/원복.
     *
     * <p>USER_LIFECYCLE_TERMINATION_POLICY v1.2 §10.9 (Q9) — 4년 안정 보관 기간 중 사용자가
     * 로그인하거나 명시적 복귀를 요청한 경우 본 메서드를 호출한다. 단일 트랜잭션 내에서:</p>
     * <ol>
     *   <li>vault 행 조회 — 없으면 IllegalArgumentException (DORMANT 가 아니거나 이미 복구됨)</li>
     *   <li>encrypted_pii AES-256-GCM 복호화 → {@link com.coresolution.consultation.dto.lifecycle.DormantUserPiiSnapshot}</li>
     *   <li>{@link com.coresolution.consultation.entity.User} 행에 PII 원복</li>
     *   <li>lifecycle_state = ACTIVE 전이 (audit_logs.PII_VAULT_RESTORE 기록)</li>
     *   <li>vault 행 hard delete (PII 영구 파기)</li>
     * </ol>
     *
     * @param userId   대상 users.id
     * @param tenantId 테넌트 ID (vault 행 멀티테넌트 격리 검증)
     * @param actor    행위자 (본인 또는 ADMIN)
     * @return 전이 결과 (PII_VAULT_RESTORE audit log id 포함)
     * @throws IllegalArgumentException userId 미존재 / vault 행 없음 / 복호화 실패
     */
    TransitionResult reactivate(Long userId, String tenantId, Actor actor);
}
