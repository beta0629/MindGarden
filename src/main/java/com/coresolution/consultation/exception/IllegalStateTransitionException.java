package com.coresolution.consultation.exception;

import com.coresolution.consultation.constant.LifecycleState;

/**
 * lifecycle 상태 전이 가드 위반 시 발생하는 예외.
 *
 * <p>USER_LIFECYCLE_TERMINATION_POLICY §3.6 전이 그래프 위반 또는 Q5 7일 윈도우 미만료 시
 * ANONYMIZED 진입 시도 등 비정상 전이를 단일 예외로 표현한다.</p>
 *
 * @author CoreSolution
 * @since 2026-06-05
 */
public class IllegalStateTransitionException extends RuntimeException {

    private final LifecycleState fromState;
    private final LifecycleState toState;

    public IllegalStateTransitionException(LifecycleState fromState, LifecycleState toState) {
        super(buildMessage(fromState, toState, null));
        this.fromState = fromState;
        this.toState = toState;
    }

    public IllegalStateTransitionException(LifecycleState fromState, LifecycleState toState, String reason) {
        super(buildMessage(fromState, toState, reason));
        this.fromState = fromState;
        this.toState = toState;
    }

    private static String buildMessage(LifecycleState fromState, LifecycleState toState, String reason) {
        StringBuilder sb = new StringBuilder("Illegal lifecycle transition: ")
                .append(fromState)
                .append(" -> ")
                .append(toState);
        if (reason != null && !reason.isBlank()) {
            sb.append(" (").append(reason).append(")");
        }
        return sb.toString();
    }

    public LifecycleState getFromState() {
        return fromState;
    }

    public LifecycleState getToState() {
        return toState;
    }
}
