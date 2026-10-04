package com.coresolution.consultation.service.support;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/**
 * {@link DeferredExternalCalls} — 외부 호출을 action 정상 종료 뒤로 미루고, 실패(롤백) 시 버리는지.
 *
 * @author CoreSolution
 * @since 2026-10-04
 */
@DisplayName("DeferredExternalCalls — 트랜잭션 이후 외부 호출")
class DeferredExternalCallsTest {

    @AfterEach
    void tearDown() {
        TransactionSynchronizationManager.setActualTransactionActive(false);
    }

    @Test
    @DisplayName("구간 밖 deferIfActive 는 false — 호출자가 즉시 실행")
    void outsideScope_notDeferred() {
        assertThat(DeferredExternalCalls.deferIfActive(() -> { })).isFalse();
    }

    @Test
    @DisplayName("구간 안에서 등록한 호출은 action 반환 뒤에 실행")
    void deferredCallsRunAfterAction() {
        List<String> events = new ArrayList<>();
        String result = DeferredExternalCalls.run(() -> {
            assertThat(DeferredExternalCalls.deferIfActive(() -> events.add("external"))).isTrue();
            events.add("action-end");
            return "ok";
        });
        assertThat(result).isEqualTo("ok");
        assertThat(events).containsExactly("action-end", "external");
        assertThat(DeferredExternalCalls.deferIfActive(() -> { })).isFalse();
    }

    @Test
    @DisplayName("action 이 예외(롤백)면 등록된 외부 호출은 실행하지 않음")
    void failedActionDiscardsCalls() {
        List<String> events = new ArrayList<>();
        assertThatThrownBy(() -> DeferredExternalCalls.run(() -> {
            DeferredExternalCalls.deferIfActive(() -> events.add("external"));
            throw new IllegalStateException("rollback");
        })).isInstanceOf(IllegalStateException.class);
        assertThat(events).isEmpty();
        assertThat(DeferredExternalCalls.deferIfActive(() -> { })).isFalse();
    }

    @Test
    @DisplayName("외부 호출 하나가 실패해도 나머지는 실행되고 결과는 그대로")
    void failingCallDoesNotBreakOthers() {
        List<String> events = new ArrayList<>();
        DeferredExternalCalls.run(() -> {
            DeferredExternalCalls.deferIfActive(() -> {
                throw new IllegalStateException("smtp down");
            });
            DeferredExternalCalls.deferIfActive(() -> events.add("second"));
        });
        assertThat(events).containsExactly("second");
    }

    @Test
    @DisplayName("열린 트랜잭션 안에서 run 호출은 거부")
    void rejectsInsideTransaction() {
        TransactionSynchronizationManager.setActualTransactionActive(true);
        List<String> events = new ArrayList<>();
        assertThatThrownBy(() -> DeferredExternalCalls.run(() -> events.add("action")))
                .isInstanceOf(IllegalStateException.class);
        assertThat(events).isEmpty();
    }

    @Test
    @DisplayName("중첩 run 은 바깥 구간이 끝난 뒤 한 번만 실행")
    void nestedRunDefersToOuter() {
        List<String> events = new ArrayList<>();
        DeferredExternalCalls.run(() -> {
            DeferredExternalCalls.run(() -> {
                DeferredExternalCalls.deferIfActive(() -> events.add("external"));
            });
            events.add("outer-end");
        });
        assertThat(events).containsExactly("outer-end", "external");
    }
}
