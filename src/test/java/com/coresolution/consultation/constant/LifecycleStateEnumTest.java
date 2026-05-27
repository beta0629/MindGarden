package com.coresolution.consultation.constant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.Set;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * {@link LifecycleState} SSOT enum 회귀 — Phase 1 (Q1).
 *
 * <p>USER_LIFECYCLE_TERMINATION_POLICY §3.6 전이 그래프와 ACTIVE_LIKE/TERMINAL 분류,
 * {@code fromCode} 정합, {@code canTransitionTo} 가드 동작을 모두 검증.</p>
 *
 * @author CoreSolution
 * @since 2026-06-05
 */
@DisplayName("LifecycleState SSOT enum 회귀 — Phase 1")
class LifecycleStateEnumTest {

    @Test
    @DisplayName("7 상태가 모두 정의된다 (§3.6)")
    void seven_states_defined() {
        assertThat(LifecycleState.values()).containsExactlyInAnyOrder(
                LifecycleState.ACTIVE,
                LifecycleState.SUSPENDED,
                LifecycleState.WITHDRAWAL_PENDING,
                LifecycleState.DORMANT,
                LifecycleState.ANONYMIZED,
                LifecycleState.DELETED_BY_ADMIN,
                LifecycleState.HARD_DELETED);
    }

    @Test
    @DisplayName("code 와 messageKey 가 SSOT 패턴을 따른다 (코드값 그대로 + enums.LifecycleState.<CODE>)")
    void code_messageKey_ssot() {
        for (LifecycleState state : LifecycleState.values()) {
            assertThat(state.getCode()).isEqualTo(state.name());
            assertThat(state.getMessageKey())
                    .isEqualTo("enums.LifecycleState." + state.name());
        }
    }

    @Test
    @DisplayName("ACTIVE_LIKE_STATES 는 ACTIVE/SUSPENDED/WITHDRAWAL_PENDING/DORMANT 4종")
    void activeLike_states() {
        assertThat(LifecycleState.ACTIVE_LIKE_STATES).containsExactlyInAnyOrder(
                LifecycleState.ACTIVE,
                LifecycleState.SUSPENDED,
                LifecycleState.WITHDRAWAL_PENDING,
                LifecycleState.DORMANT);
    }

    @Test
    @DisplayName("TERMINAL_STATES 는 ANONYMIZED/HARD_DELETED 2종")
    void terminal_states() {
        assertThat(LifecycleState.TERMINAL_STATES).containsExactlyInAnyOrder(
                LifecycleState.ANONYMIZED,
                LifecycleState.HARD_DELETED);
    }

    @Test
    @DisplayName("isActiveLike() 는 4 상태 + DELETED_BY_ADMIN/ANONYMIZED/HARD_DELETED 분리")
    void isActiveLike_classification() {
        assertThat(LifecycleState.ACTIVE.isActiveLike()).isTrue();
        assertThat(LifecycleState.SUSPENDED.isActiveLike()).isTrue();
        assertThat(LifecycleState.WITHDRAWAL_PENDING.isActiveLike()).isTrue();
        assertThat(LifecycleState.DORMANT.isActiveLike()).isTrue();
        assertThat(LifecycleState.ANONYMIZED.isActiveLike()).isFalse();
        assertThat(LifecycleState.DELETED_BY_ADMIN.isActiveLike()).isFalse();
        assertThat(LifecycleState.HARD_DELETED.isActiveLike()).isFalse();
    }

    @Test
    @DisplayName("isTerminal() 은 ANONYMIZED/HARD_DELETED 만 true")
    void isTerminal_classification() {
        assertThat(LifecycleState.ANONYMIZED.isTerminal()).isTrue();
        assertThat(LifecycleState.HARD_DELETED.isTerminal()).isTrue();

        assertThat(LifecycleState.ACTIVE.isTerminal()).isFalse();
        assertThat(LifecycleState.SUSPENDED.isTerminal()).isFalse();
        assertThat(LifecycleState.WITHDRAWAL_PENDING.isTerminal()).isFalse();
        assertThat(LifecycleState.DORMANT.isTerminal()).isFalse();
        assertThat(LifecycleState.DELETED_BY_ADMIN.isTerminal()).isFalse();
    }

    @Test
    @DisplayName("ACTIVE → SUSPENDED/WITHDRAWAL_PENDING/DORMANT/DELETED_BY_ADMIN/ANONYMIZED 전이 가능")
    void active_can_transition_to_5_states() {
        Set<LifecycleState> next = LifecycleState.ACTIVE.nextStates();
        assertThat(next).containsExactlyInAnyOrder(
                LifecycleState.SUSPENDED,
                LifecycleState.WITHDRAWAL_PENDING,
                LifecycleState.DORMANT,
                LifecycleState.DELETED_BY_ADMIN,
                LifecycleState.ANONYMIZED);
    }

    @Test
    @DisplayName("SUSPENDED → ACTIVE/ANONYMIZED 전이 가능 (해제 또는 종료)")
    void suspended_transitions() {
        Set<LifecycleState> next = LifecycleState.SUSPENDED.nextStates();
        assertThat(next).containsExactlyInAnyOrder(
                LifecycleState.ACTIVE,
                LifecycleState.ANONYMIZED);
    }

    @Test
    @DisplayName("WITHDRAWAL_PENDING → ACTIVE(취소)/ANONYMIZED(만료) 전이 가능")
    void withdrawalPending_transitions() {
        Set<LifecycleState> next = LifecycleState.WITHDRAWAL_PENDING.nextStates();
        assertThat(next).containsExactlyInAnyOrder(
                LifecycleState.ACTIVE,
                LifecycleState.ANONYMIZED);
    }

    @Test
    @DisplayName("DORMANT → ACTIVE(재로그인)/ANONYMIZED(추가 4년 경과) 전이 가능")
    void dormant_transitions() {
        Set<LifecycleState> next = LifecycleState.DORMANT.nextStates();
        assertThat(next).containsExactlyInAnyOrder(
                LifecycleState.ACTIVE,
                LifecycleState.ANONYMIZED);
    }

    @Test
    @DisplayName("DELETED_BY_ADMIN → ACTIVE(7일 내 롤백)/ANONYMIZED 전이 가능")
    void deletedByAdmin_transitions() {
        Set<LifecycleState> next = LifecycleState.DELETED_BY_ADMIN.nextStates();
        assertThat(next).containsExactlyInAnyOrder(
                LifecycleState.ACTIVE,
                LifecycleState.ANONYMIZED);
    }

    @Test
    @DisplayName("ANONYMIZED → HARD_DELETED 전이만 가능")
    void anonymized_only_to_hardDeleted() {
        Set<LifecycleState> next = LifecycleState.ANONYMIZED.nextStates();
        assertThat(next).containsExactly(LifecycleState.HARD_DELETED);
    }

    @Test
    @DisplayName("HARD_DELETED 는 종착 — nextStates 는 빈 Set")
    void hardDeleted_is_terminal() {
        assertThat(LifecycleState.HARD_DELETED.nextStates()).isEmpty();
    }

    @Test
    @DisplayName("canTransitionTo: 정상 전이는 true")
    void canTransitionTo_legal() {
        assertThat(LifecycleState.ACTIVE.canTransitionTo(LifecycleState.WITHDRAWAL_PENDING)).isTrue();
        assertThat(LifecycleState.WITHDRAWAL_PENDING.canTransitionTo(LifecycleState.ACTIVE)).isTrue();
        assertThat(LifecycleState.WITHDRAWAL_PENDING.canTransitionTo(LifecycleState.ANONYMIZED)).isTrue();
        assertThat(LifecycleState.ANONYMIZED.canTransitionTo(LifecycleState.HARD_DELETED)).isTrue();
    }

    @Test
    @DisplayName("canTransitionTo: 동일 상태 → 자기 자신 false")
    void canTransitionTo_self_false() {
        for (LifecycleState state : LifecycleState.values()) {
            assertThat(state.canTransitionTo(state))
                    .as("자기 자신으로의 전이는 false 여야 한다 (state=%s)", state)
                    .isFalse();
        }
    }

    @Test
    @DisplayName("canTransitionTo: 전이 그래프 위반 (예: HARD_DELETED → ACTIVE) 은 false")
    void canTransitionTo_illegal_false() {
        assertThat(LifecycleState.HARD_DELETED.canTransitionTo(LifecycleState.ACTIVE)).isFalse();
        assertThat(LifecycleState.ANONYMIZED.canTransitionTo(LifecycleState.ACTIVE)).isFalse();
        assertThat(LifecycleState.SUSPENDED.canTransitionTo(LifecycleState.WITHDRAWAL_PENDING)).isFalse();
        assertThat(LifecycleState.DORMANT.canTransitionTo(LifecycleState.WITHDRAWAL_PENDING)).isFalse();
        assertThat(LifecycleState.WITHDRAWAL_PENDING.canTransitionTo(LifecycleState.DORMANT)).isFalse();
    }

    @Test
    @DisplayName("canTransitionTo: null 입력 시 false")
    void canTransitionTo_null_false() {
        assertThat(LifecycleState.ACTIVE.canTransitionTo(null)).isFalse();
        assertThat(LifecycleState.HARD_DELETED.canTransitionTo(null)).isFalse();
    }

    @Test
    @DisplayName("fromCode: 정확한 enum 을 반환하고 알 수 없는/null 코드는 예외")
    void fromCode_roundtrip() {
        assertThat(LifecycleState.fromCode("ACTIVE")).isEqualTo(LifecycleState.ACTIVE);
        assertThat(LifecycleState.fromCode("WITHDRAWAL_PENDING"))
                .isEqualTo(LifecycleState.WITHDRAWAL_PENDING);
        assertThat(LifecycleState.fromCode("HARD_DELETED")).isEqualTo(LifecycleState.HARD_DELETED);

        assertThatThrownBy(() -> LifecycleState.fromCode("UNKNOWN"))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> LifecycleState.fromCode(null))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("nextStates 는 불변 Set — 외부 변경 시도 시 UnsupportedOperationException")
    void nextStates_immutable() {
        Set<LifecycleState> next = LifecycleState.ACTIVE.nextStates();
        assertThatThrownBy(() -> next.add(LifecycleState.ANONYMIZED))
                .isInstanceOf(UnsupportedOperationException.class);
    }
}
