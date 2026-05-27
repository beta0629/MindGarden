package com.coresolution.consultation.exception;

import static org.assertj.core.api.Assertions.assertThat;

import com.coresolution.consultation.constant.LifecycleState;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * {@link IllegalStateTransitionException} 메시지·상태 보존 회귀.
 *
 * @author CoreSolution
 * @since 2026-06-05
 */
@DisplayName("IllegalStateTransitionException 회귀 — Phase 2-α")
class IllegalStateTransitionExceptionTest {

    @Test
    @DisplayName("기본 생성자: from/to 상태가 보존되고 메시지에 포함")
    void basic_message_includes_states() {
        IllegalStateTransitionException ex = new IllegalStateTransitionException(
                LifecycleState.HARD_DELETED, LifecycleState.ACTIVE);

        assertThat(ex.getFromState()).isEqualTo(LifecycleState.HARD_DELETED);
        assertThat(ex.getToState()).isEqualTo(LifecycleState.ACTIVE);
        assertThat(ex.getMessage())
                .contains("HARD_DELETED")
                .contains("ACTIVE")
                .contains("Illegal lifecycle transition");
    }

    @Test
    @DisplayName("reason 포함 생성자: 메시지에 reason 도 포함")
    void reason_included_in_message() {
        IllegalStateTransitionException ex = new IllegalStateTransitionException(
                null, LifecycleState.ANONYMIZED, "current lifecycleState is null");

        assertThat(ex.getFromState()).isNull();
        assertThat(ex.getToState()).isEqualTo(LifecycleState.ANONYMIZED);
        assertThat(ex.getMessage())
                .contains("current lifecycleState is null")
                .contains("ANONYMIZED");
    }

    @Test
    @DisplayName("RuntimeException 상속 — Spring transactional 롤백 트리거")
    void is_runtime_exception() {
        IllegalStateTransitionException ex = new IllegalStateTransitionException(
                LifecycleState.ACTIVE, LifecycleState.HARD_DELETED);
        assertThat(ex).isInstanceOf(RuntimeException.class);
    }
}
