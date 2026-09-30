package com.coresolution.consultation.util;

import java.util.List;
import java.util.function.Supplier;
import lombok.extern.slf4j.Slf4j;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/**
 * 트랜잭션 동기화 범위 밖에서 작업을 실행한다 — 외부 API(PortOne 등) 호출 동안 DB 커넥션을 잡지 않게 한다.
 * <p>{@code @Transactional(propagation = NOT_SUPPORTED)} 는 실제 트랜잭션은 없지만 트랜잭션 동기화를 켠다.
 * 이 범위에서 리포지토리를 호출하면 EntityManager 가 범위에 묶이고, Spring 기본 Hibernate 설정
 * ({@code hibernate.connection.handling_mode=DELAYED_ACQUISITION_AND_HOLD})에서는 처음 얻은 JDBC 커넥션을
 * 범위가 끝날 때까지 쥔다. 이 유틸은 현재 스레드의 동기화를 잠시 내려놓고(Spring 의 빈 트랜잭션 suspend 와 같은 절차)
 * 작업을 실행한 뒤 되돌린다. 작업 안의 리포지토리 호출은 호출마다 커넥션을 반납하고,
 * {@code @Transactional} 메서드는 각자 짧은 트랜잭션으로 돈다.</p>
 * <p>실제 트랜잭션 안에서 부르면 그 트랜잭션의 커넥션은 풀 수 없으므로 동기화를 건드리지 않고 그대로 실행한다.</p>
 *
 * @author MindGarden
 * @since 2026-09-30
 */
@Slf4j
public final class OutsideTransactionScope {

    private OutsideTransactionScope() {
    }

    /**
     * @param work 실행할 작업
     * @param <T>  결과 타입
     * @return 작업 결과
     */
    public static <T> T call(Supplier<T> work) {
        if (TransactionSynchronizationManager.isActualTransactionActive()) {
            log.warn("실제 트랜잭션 안에서 트랜잭션 밖 작업 요청 — 호출측 트랜잭션 커넥션은 유지됨: tx={}",
                    TransactionSynchronizationManager.getCurrentTransactionName());
            return work.get();
        }
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            return work.get();
        }
        SuspendedScope suspended = SuspendedScope.suspend();
        try {
            return work.get();
        } finally {
            suspended.resume();
        }
    }

    /** 동기화 범위를 잠시 내려놓은 상태 (복원용) */
    private record SuspendedScope(
            List<TransactionSynchronization> synchronizations,
            String name,
            boolean readOnly,
            Integer isolationLevel) {

        static SuspendedScope suspend() {
            List<TransactionSynchronization> synchronizations = TransactionSynchronizationManager.getSynchronizations();
            for (TransactionSynchronization synchronization : synchronizations) {
                synchronization.suspend();
            }
            SuspendedScope suspended = new SuspendedScope(
                    synchronizations,
                    TransactionSynchronizationManager.getCurrentTransactionName(),
                    TransactionSynchronizationManager.isCurrentTransactionReadOnly(),
                    TransactionSynchronizationManager.getCurrentTransactionIsolationLevel());
            TransactionSynchronizationManager.clearSynchronization();
            TransactionSynchronizationManager.setCurrentTransactionName(null);
            TransactionSynchronizationManager.setCurrentTransactionReadOnly(false);
            TransactionSynchronizationManager.setCurrentTransactionIsolationLevel(null);
            return suspended;
        }

        void resume() {
            TransactionSynchronizationManager.setCurrentTransactionName(name);
            TransactionSynchronizationManager.setCurrentTransactionReadOnly(readOnly);
            TransactionSynchronizationManager.setCurrentTransactionIsolationLevel(isolationLevel);
            TransactionSynchronizationManager.initSynchronization();
            for (TransactionSynchronization synchronization : synchronizations) {
                synchronization.resume();
                TransactionSynchronizationManager.registerSynchronization(synchronization);
            }
        }
    }
}
