package com.coresolution.integrationtest.support;

import java.util.concurrent.atomic.AtomicLong;

import org.hibernate.resource.jdbc.spi.StatementInspector;

/**
 * 요청(측정) 스레드에만 한정된 Hibernate SQL 문 카운터.
 *
 * <p>SessionFactory 전역 {@code Statistics#getPrepareStatementCount()} 는 동일 JVM의
 * Async·스케줄러 등 타 스레드 SQL 까지 합산해 CI flake(large≠small)를 유발할 수 있다.
 * 본 인스펙터는 {@link #start()}~{@link #stop()} 구간에 <strong>현재 스레드</strong>에서
 * 실행된 SQL만 집계하므로 N+1 불변식(large==small) 검증이 안정적이다.
 * 실제 N+1(행당 추가 SQL)은 측정 스레드에서 그대로 반영되어 large&gt;small 로 실패한다.</p>
 *
 * <p>test 프로파일에서 {@code hibernate.session_factory.statement_inspector} 로 등록한다.
 * Hibernate가 클래스명으로 인스턴스화해도 {@link ThreadLocal} 은 static 이라 공유된다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-14
 */
public final class RequestScopedStatementCounter implements StatementInspector {

    private static final ThreadLocal<AtomicLong> ACTIVE = new ThreadLocal<>();

    /**
     * Hibernate 리플렉션 인스턴스화용.
     */
    public RequestScopedStatementCounter() {
    }

    @Override
    public String inspect(String sql) {
        AtomicLong counter = ACTIVE.get();
        if (counter != null) {
            counter.incrementAndGet();
        }
        return sql;
    }

    /**
     * 현재 스레드에서 SQL 집계를 시작한다. 기존 카운터는 덮어쓴다.
     */
    public static void start() {
        ACTIVE.set(new AtomicLong(0L));
    }

    /**
     * 집계를 종료하고 누적 문 수를 반환한다. 측정 중이 아니면 0.
     *
     * @return 측정 구간 동안 현재 스레드에서 관측된 SQL 문 수
     */
    public static long stop() {
        AtomicLong counter = ACTIVE.get();
        ACTIVE.remove();
        return counter == null ? 0L : counter.get();
    }

    /**
     * {@code action} 실행 동안 현재 스레드 SQL 문 수만 집계한다.
     *
     * @param <T> 액션 결과 타입
     * @param action 측정 대상 (예: MockMvc perform)
     * @return 결과·문 수·소요 ms
     * @throws Exception action 예외 그대로 전파
     */
    public static <T> Measured<T> measure(ThrowingSupplier<T> action) throws Exception {
        start();
        long started = System.nanoTime();
        try {
            T value = action.get();
            long statements = stop();
            long millis = (System.nanoTime() - started) / 1_000_000L;
            return new Measured<>(value, statements, millis);
        } catch (Exception ex) {
            stop();
            throw ex;
        }
    }

    /**
     * 예외를 던질 수 있는 supplier.
     *
     * @param <T> 결과 타입
     */
    @FunctionalInterface
    public interface ThrowingSupplier<T> {
        /**
         * @return 공급 값
         * @throws Exception 호출부에서 처리
         */
        T get() throws Exception;
    }

    /**
     * 측정 결과.
     *
     * @param value      액션 반환값
     * @param statements 현재 스레드 SQL 문 수
     * @param millis     소요 시간(ms)
     * @param <T>        액션 결과 타입
     */
    public record Measured<T>(T value, long statements, long millis) {
    }
}
