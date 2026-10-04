package com.coresolution.consultation.service.support;

import java.util.ArrayList;
import java.util.List;
import java.util.function.Supplier;

import lombok.extern.slf4j.Slf4j;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/**
 * 외부 알림(이메일·푸시·알림톡·SMS) 호출을 DB 트랜잭션이 끝난 뒤로 미룬다.
 *
 * <p>{@link #run(Supplier)} 구간 안에서 {@link #deferIfActive(Runnable)} 로 등록한 호출은 action 이 정상
 * 반환(트랜잭션 커밋·커넥션 반환)된 뒤 같은 스레드에서 실행되고, action 이 예외로 끝나면(롤백) 버린다.
 * afterCommit 콜백은 커넥션이 아직 바인딩된 상태라 쓰지 않는다. 구간 밖에서는 {@code deferIfActive} 가
 * false 를 돌려 호출자가 기존처럼 즉시 실행한다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-04
 */
@Slf4j
public final class DeferredExternalCalls {

    private static final ThreadLocal<List<Runnable>> QUEUE = new ThreadLocal<>();

    private DeferredExternalCalls() {
    }

    /**
     * 지연 구간이면 호출을 큐에 넣는다.
     *
     * @param call 트랜잭션 이후 실행할 외부 호출
     * @return 큐에 넣었으면 true (호출자는 실행하지 않는다), 구간 밖이면 false
     */
    public static boolean deferIfActive(Runnable call) {
        List<Runnable> queue = QUEUE.get();
        if (queue == null) {
            return false;
        }
        queue.add(call);
        return true;
    }

    /**
     * 트랜잭션 밖에서 action(트랜잭션 서비스 호출)을 실행하고, 정상 반환 뒤 쌓인 외부 호출을 실행한다.
     * 이미 구간 안이면 action 만 실행한다(바깥 구간이 비운다).
     *
     * @param action 트랜잭션 경계를 가진 서비스 호출
     * @param <T>    반환 타입
     * @return action 결과
     * @throws IllegalStateException 트랜잭션 안에서 호출했을 때 (외부 호출이 커넥션을 쥔 채 실행되는 것을 막음)
     */
    public static <T> T run(Supplier<T> action) {
        if (QUEUE.get() != null) {
            return action.get();
        }
        if (TransactionSynchronizationManager.isActualTransactionActive()) {
            throw new IllegalStateException("DeferredExternalCalls.run 은 트랜잭션 밖에서 호출해야 합니다.");
        }
        List<Runnable> queue = new ArrayList<>();
        QUEUE.set(queue);
        T result;
        try {
            result = action.get();
        } finally {
            QUEUE.remove();
        }
        for (Runnable call : queue) {
            try {
                call.run();
            } catch (RuntimeException e) {
                log.error("트랜잭션 이후 외부 호출 실패: {}", e.getClass().getSimpleName(), e);
            }
        }
        return result;
    }

    /**
     * 반환값 없는 action 용 {@link #run(Supplier)}.
     *
     * @param action 트랜잭션 경계를 가진 서비스 호출
     */
    public static void run(Runnable action) {
        run(() -> {
            action.run();
            return null;
        });
    }
}
