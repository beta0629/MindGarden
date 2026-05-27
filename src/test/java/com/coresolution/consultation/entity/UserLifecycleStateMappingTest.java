package com.coresolution.consultation.entity;

import static org.assertj.core.api.Assertions.assertThat;

import java.lang.reflect.Field;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

import com.coresolution.consultation.constant.LifecycleState;

import jakarta.persistence.Column;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * {@link User} entity 의 lifecycle_state SSOT + withdrawal_requested_at 매핑 정합 회귀.
 *
 * <p>USER_LIFECYCLE_TERMINATION_POLICY §3.6 (Q1) — Phase 1 마이그레이션과 entity 매핑이
 * 일치하는지 리플렉션으로 검증. Spring context 부팅 없는 순수 단위 테스트.</p>
 *
 * @author CoreSolution
 * @since 2026-06-05
 */
@DisplayName("User entity — lifecycle_state SSOT + withdrawal_requested_at 매핑 회귀")
class UserLifecycleStateMappingTest {

    @Test
    @DisplayName("User.lifecycleState 필드는 LifecycleState enum 이며 @Column(name=lifecycle_state, length=30, nullable=false)")
    void lifecycleState_mapping() throws Exception {
        Field field = User.class.getDeclaredField("lifecycleState");
        assertThat(field.getType()).isEqualTo(LifecycleState.class);

        Enumerated enumerated = field.getAnnotation(Enumerated.class);
        assertThat(enumerated).isNotNull();
        assertThat(enumerated.value()).isEqualTo(EnumType.STRING);

        Column column = field.getAnnotation(Column.class);
        assertThat(column).isNotNull();
        assertThat(column.name()).isEqualTo("lifecycle_state");
        assertThat(column.nullable()).isFalse();
        assertThat(column.length()).isEqualTo(30);
    }

    @Test
    @DisplayName("User.withdrawalRequestedAt 필드는 LocalDateTime 이며 @Column(name=withdrawal_requested_at)")
    void withdrawalRequestedAt_mapping() throws Exception {
        Field field = User.class.getDeclaredField("withdrawalRequestedAt");
        assertThat(field.getType()).isEqualTo(LocalDateTime.class);

        Column column = field.getAnnotation(Column.class);
        assertThat(column).isNotNull();
        assertThat(column.name()).isEqualTo("withdrawal_requested_at");
    }

    @Test
    @DisplayName("@Table 인덱스에 idx_users_lifecycle_state + idx_users_withdrawal_pending 포함")
    void table_indexes_include_lifecycle() {
        Table table = User.class.getAnnotation(Table.class);
        assertThat(table).isNotNull();
        List<Index> indexes = Arrays.asList(table.indexes());

        assertThat(indexes)
                .extracting(Index::name)
                .contains("idx_users_lifecycle_state", "idx_users_withdrawal_pending");

        Index lifecycleIdx = indexes.stream()
                .filter(i -> "idx_users_lifecycle_state".equals(i.name()))
                .findFirst().orElseThrow();
        assertThat(lifecycleIdx.columnList()).contains("tenant_id", "lifecycle_state");

        Index withdrawalIdx = indexes.stream()
                .filter(i -> "idx_users_withdrawal_pending".equals(i.name()))
                .findFirst().orElseThrow();
        assertThat(withdrawalIdx.columnList())
                .contains("lifecycle_state", "withdrawal_requested_at");
    }

    @Test
    @DisplayName("기본값: User.lifecycleState 빌더 default 는 ACTIVE (NOT NULL 컬럼 자동 채움)")
    void lifecycleState_builder_default_active() {
        User user = User.builder().build();
        assertThat(user.getLifecycleState()).isEqualTo(LifecycleState.ACTIVE);
    }

    @Test
    @DisplayName("setLifecycleState / getLifecycleState 동작 (Lombok @Data setter)")
    void lifecycleState_setter_getter() {
        User user = new User();
        user.setLifecycleState(LifecycleState.WITHDRAWAL_PENDING);
        assertThat(user.getLifecycleState()).isEqualTo(LifecycleState.WITHDRAWAL_PENDING);

        user.setLifecycleState(LifecycleState.ANONYMIZED);
        assertThat(user.getLifecycleState()).isEqualTo(LifecycleState.ANONYMIZED);
    }

    @Test
    @DisplayName("withdrawalRequestedAt setter/getter 동작")
    void withdrawalRequestedAt_setter_getter() {
        User user = new User();
        LocalDateTime t = LocalDateTime.of(2026, 6, 5, 10, 30);
        user.setWithdrawalRequestedAt(t);
        assertThat(user.getWithdrawalRequestedAt()).isEqualTo(t);

        user.setWithdrawalRequestedAt(null);
        assertThat(user.getWithdrawalRequestedAt()).isNull();
    }

    @Test
    @DisplayName("isActive 필드는 보존되어 backward compat 유지 (deprecated 의도이지만 컬럼 살아있음)")
    void isActive_preserved_backward_compat() throws Exception {
        Field field = User.class.getDeclaredField("isActive");
        assertThat(field.getType()).isEqualTo(Boolean.class);
        Column column = field.getAnnotation(Column.class);
        assertThat(column.name()).isEqualTo("is_active");
    }
}
