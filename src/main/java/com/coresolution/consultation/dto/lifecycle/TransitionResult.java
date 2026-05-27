package com.coresolution.consultation.dto.lifecycle;

import java.time.LocalDateTime;

import com.coresolution.consultation.constant.LifecycleState;

/**
 * {@code UserLifecycleService.transitionTo(...)} 결과 VO.
 *
 * <p>전이 전후 상태와 audit_logs / personal_data_destruction_logs 의 신규 기록 PK 를 함께
 * 반환하여 호출자가 후속 처리 (알림 발송 / 응답 본문) 에 사용할 수 있게 한다.</p>
 *
 * @author CoreSolution
 * @since 2026-06-05
 */
public final class TransitionResult {

    private final Long userId;
    private final LifecycleState fromState;
    private final LifecycleState toState;
    private final Long auditLogId;
    private final Long destructionLogId;
    private final LocalDateTime transitionedAt;

    private TransitionResult(Builder builder) {
        this.userId = builder.userId;
        this.fromState = builder.fromState;
        this.toState = builder.toState;
        this.auditLogId = builder.auditLogId;
        this.destructionLogId = builder.destructionLogId;
        this.transitionedAt = builder.transitionedAt;
    }

    public static Builder builder() {
        return new Builder();
    }

    public Long getUserId() {
        return userId;
    }

    public LifecycleState getFromState() {
        return fromState;
    }

    public LifecycleState getToState() {
        return toState;
    }

    public Long getAuditLogId() {
        return auditLogId;
    }

    public Long getDestructionLogId() {
        return destructionLogId;
    }

    public LocalDateTime getTransitionedAt() {
        return transitionedAt;
    }

    public static final class Builder {
        private Long userId;
        private LifecycleState fromState;
        private LifecycleState toState;
        private Long auditLogId;
        private Long destructionLogId;
        private LocalDateTime transitionedAt;

        public Builder userId(Long userId) {
            this.userId = userId;
            return this;
        }

        public Builder fromState(LifecycleState fromState) {
            this.fromState = fromState;
            return this;
        }

        public Builder toState(LifecycleState toState) {
            this.toState = toState;
            return this;
        }

        public Builder auditLogId(Long auditLogId) {
            this.auditLogId = auditLogId;
            return this;
        }

        public Builder destructionLogId(Long destructionLogId) {
            this.destructionLogId = destructionLogId;
            return this;
        }

        public Builder transitionedAt(LocalDateTime transitionedAt) {
            this.transitionedAt = transitionedAt;
            return this;
        }

        public TransitionResult build() {
            return new TransitionResult(this);
        }
    }
}
