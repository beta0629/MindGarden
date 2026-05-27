package com.coresolution.consultation.service;

import com.coresolution.consultation.constant.LifecycleState;
import com.coresolution.consultation.dto.lifecycle.Actor;
import com.coresolution.consultation.dto.lifecycle.TransitionResult;
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
     * @param userId 대상 users.id (본인)
     * @param actor  행위자 (본인)
     * @return 전이 결과
     */
    TransitionResult requestWithdrawal(Long userId, Actor actor);

    /**
     * 자발 탈퇴 취소 — WITHDRAWAL_PENDING → ACTIVE 전이 + withdrawal_requested_at clear.
     *
     * @param userId 대상 users.id (본인)
     * @param actor  행위자 (본인)
     * @return 전이 결과
     */
    TransitionResult cancelWithdrawal(Long userId, Actor actor);
}
