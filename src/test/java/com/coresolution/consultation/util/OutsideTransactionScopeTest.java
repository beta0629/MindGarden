package com.coresolution.consultation.util;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/**
 * {@link OutsideTransactionScope} — 동기화 범위를 내려놓고 작업한 뒤 원래대로 되돌리는지.
 *
 * @author MindGarden
 * @since 2026-09-30
 */
@DisplayName("OutsideTransactionScope — 트랜잭션 동기화 범위 밖 실행")
class OutsideTransactionScopeTest {

    private static final String SCOPE_NAME = "outside-scope-test";

    @AfterEach
    void tearDown() {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.clearSynchronization();
        }
        TransactionSynchronizationManager.setCurrentTransactionName(null);
        TransactionSynchronizationManager.setCurrentTransactionReadOnly(false);
    }

    @Test
    @DisplayName("동기화 범위 안에서 호출 → 작업 중엔 동기화 없음, 끝나면 이름·읽기전용·등록 동기화 복원(suspend/resume 1회)")
    void activeSynchronization_suspendedDuringWorkAndRestored() {
        TransactionSynchronizationManager.initSynchronization();
        TransactionSynchronizationManager.setCurrentTransactionName(SCOPE_NAME);
        TransactionSynchronizationManager.setCurrentTransactionReadOnly(true);
        CountingSynchronization registered = new CountingSynchronization();
        TransactionSynchronizationManager.registerSynchronization(registered);

        Boolean activeInside = OutsideTransactionScope.call(TransactionSynchronizationManager::isSynchronizationActive);

        assertThat(activeInside).isFalse();
        assertThat(TransactionSynchronizationManager.isSynchronizationActive()).isTrue();
        assertThat(TransactionSynchronizationManager.getCurrentTransactionName()).isEqualTo(SCOPE_NAME);
        assertThat(TransactionSynchronizationManager.isCurrentTransactionReadOnly()).isTrue();
        List<TransactionSynchronization> restored = TransactionSynchronizationManager.getSynchronizations();
        assertThat(restored).containsExactly(registered);
        assertThat(registered.suspended.get()).isEqualTo(1);
        assertThat(registered.resumed.get()).isEqualTo(1);
    }

    @Test
    @DisplayName("작업이 예외를 던져도 동기화 범위는 복원")
    void workThrows_synchronizationStillRestored() {
        TransactionSynchronizationManager.initSynchronization();
        CountingSynchronization registered = new CountingSynchronization();
        TransactionSynchronizationManager.registerSynchronization(registered);

        assertThatThrownBy(() -> OutsideTransactionScope.call(() -> {
            throw new IllegalStateException("boom");
        })).isInstanceOf(IllegalStateException.class);

        assertThat(TransactionSynchronizationManager.isSynchronizationActive()).isTrue();
        assertThat(TransactionSynchronizationManager.getSynchronizations()).containsExactly(registered);
        assertThat(registered.resumed.get()).isEqualTo(1);
    }

    @Test
    @DisplayName("동기화 범위 밖에서 호출 → 그대로 실행, 동기화를 새로 켜지 않음")
    void noSynchronization_runsDirectly() {
        String result = OutsideTransactionScope.call(() -> "done");

        assertThat(result).isEqualTo("done");
        assertThat(TransactionSynchronizationManager.isSynchronizationActive()).isFalse();
    }

    private static final class CountingSynchronization implements TransactionSynchronization {

        private final AtomicInteger suspended = new AtomicInteger();
        private final AtomicInteger resumed = new AtomicInteger();

        @Override
        public void suspend() {
            suspended.incrementAndGet();
        }

        @Override
        public void resume() {
            resumed.incrementAndGet();
        }
    }
}
