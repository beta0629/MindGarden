package com.coresolution.consultation.health;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import java.util.concurrent.atomic.AtomicBoolean;
import javax.sql.DataSource;
import com.zaxxer.hikari.HikariDataSource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.DisposableBean;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.connection.RedisConnection;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.stereotype.Component;

/**
 * 운영 블루/그린 전환 직전에 비활성 슬롯의 DB 풀을 minimum-idle 만큼 실제로 열고
 * {@code SELECT 1} 이 예산 안에 끝나는지, Redis 가 응답하는지를 확인한다.
 * 연결을 한 번 열고 {@link Connection#isValid(int)} 만 보는 것으로는
 * 재기동 직후 풀이 비어 첫 요청이 Hikari connection-timeout 까지 기다리는 상태를 거르지 못한다.
 * 테넌트 데이터가 아닌 인프라 연결만 본다.
 *
 * @author MindGarden
 * @since 2026-09-25
 */
@Slf4j
@Component
public class DeploySlotReadinessProbe implements DisposableBean {

    /**
     * {@code SELECT 1} 문 타임아웃(초). 풀 워밍 전체 예산도 이 값이다.
     * Hikari {@code connection-timeout}(운영 30000ms)은 바꾸지 않는다.
     */
    public static final int CONNECTION_VALIDATION_TIMEOUT_SECONDS = 5;

    private static final String SELECT_ONE = "SELECT 1";

    private static final int SELECT_ONE_RESULT = 1;

    private static final String REDIS_PING_OK = "PONG";

    private static final String WARMUP_THREAD_NAME = "deploy-slot-db-warmup";

    private final DataSource dataSource;

    private final ObjectProvider<RedisConnectionFactory> redisConnectionFactory;

    private final Duration warmupBudget;

    private final ExecutorService warmupExecutor;

    private final AtomicBoolean warmupRunning = new AtomicBoolean(false);

    /**
     * 테스트용 생성자가 더 있어 {@code @Autowired} 로 이 생성자를 고른다.
     * 없으면 Spring 이 기본 생성자를 찾다 슬롯 기동이 실패한다.
     *
     * @param dataSource             풀에서 minimum-idle 만큼 연결을 빌릴 데이터소스
     * @param redisConnectionFactory 없으면 Redis 미준비로 본다
     */
    @Autowired
    public DeploySlotReadinessProbe(DataSource dataSource,
                                     ObjectProvider<RedisConnectionFactory> redisConnectionFactory) {
        this(dataSource, redisConnectionFactory, Duration.ofSeconds(CONNECTION_VALIDATION_TIMEOUT_SECONDS),
                newWarmupExecutor());
    }

    /**
     * 테스트가 예산만 줄여 느린 연결을 실패로 볼 때 사용한다.
     *
     * @param dataSource             풀에서 연결을 빌릴 데이터소스
     * @param redisConnectionFactory Redis 팩토리
     * @param warmupBudget           이 시간 안에 워밍이 끝나지 않으면 이번 요청은 미준비
     */
    DeploySlotReadinessProbe(DataSource dataSource,
                              ObjectProvider<RedisConnectionFactory> redisConnectionFactory,
                              Duration warmupBudget) {
        this(dataSource, redisConnectionFactory, warmupBudget, newWarmupExecutor());
    }

    private DeploySlotReadinessProbe(DataSource dataSource,
                                      ObjectProvider<RedisConnectionFactory> redisConnectionFactory,
                                      Duration warmupBudget,
                                      ExecutorService warmupExecutor) {
        this.dataSource = dataSource;
        this.redisConnectionFactory = redisConnectionFactory;
        this.warmupBudget = warmupBudget;
        this.warmupExecutor = warmupExecutor;
    }

    /**
     * minimum-idle 개의 연결을 동시에 잡고 {@code SELECT 1} 을 실행한 뒤 Redis {@code PING} 을 보낸다.
     * 워밍이 예산을 넘기면 이번 응답은 미준비다. 백그라운드에서 열리던 연결은 끊지 않고 풀에 돌려
     * 다음 확인이 빠르게 끝나게 한다. 슬롯을 재시작하지 않는다.
     *
     * @return 풀 워밍과 Redis 가 모두 성공일 때만 {@link Snapshot#ready()} 가 참이다.
     */
    public Snapshot probe() {
        int warmedConnections = warmMinimumIdle();
        boolean databaseUp = warmedConnections > 0;
        boolean redisUp = pingRedis();
        return new Snapshot(databaseUp, redisUp, warmedConnections);
    }

    /**
     * @return 예산 안에 {@code SELECT 1} 까지 끝난 연결 수. 미준비면 0
     */
    private int warmMinimumIdle() {
        if (!warmupRunning.compareAndSet(false, true)) {
            log.info("배포 레디니스 DB 워밍이 이미 진행 중이라 이번 요청은 준비되지 않음");
            return 0;
        }
        Future<Integer> future;
        try {
            future = warmupExecutor.submit(this::openMinimumIdleAndSelectOne);
        } catch (RuntimeException ex) {
            warmupRunning.set(false);
            log.warn("배포 레디니스 DB 워밍을 시작하지 못함: {}", ex.getClass().getSimpleName());
            return 0;
        }
        try {
            Integer warmed = future.get(warmupBudget.toMillis(), TimeUnit.MILLISECONDS);
            return warmed == null ? 0 : warmed;
        } catch (TimeoutException ex) {
            log.warn("배포 레디니스 DB 워밍이 {}ms 안에 끝나지 않음", warmupBudget.toMillis());
            return 0;
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            log.warn("배포 레디니스 DB 워밍 대기 중단");
            return 0;
        } catch (ExecutionException ex) {
            Throwable cause = ex.getCause() == null ? ex : ex.getCause();
            log.warn("배포 레디니스 DB 워밍 실패: {}", cause.getClass().getSimpleName());
            return 0;
        }
    }

    /**
     * 연결을 모두 잡은 뒤에야 {@code SELECT 1} 을 실행한다.
     * 하나씩 빌렸다가 바로 반납하면 같은 물리 연결을 재사용하므로 minimum-idle 을 채우지 못한다.
     * 요청 스레드가 타임아웃으로 먼저 돌아가도 이 작업은 이어서 풀을 채운다.
     *
     * @return 성공한 연결 수. 실패하면 0
     */
    private int openMinimumIdleAndSelectOne() {
        List<Connection> held = new ArrayList<>();
        try {
            int minimumIdle = readMinimumIdle();
            if (minimumIdle < 1) {
                log.warn("배포 레디니스 minimumIdle 이 없어 풀을 워밍하지 않음");
                return 0;
            }
            for (int index = 0; index < minimumIdle; index++) {
                held.add(dataSource.getConnection());
            }
            for (Connection connection : held) {
                if (!selectOne(connection)) {
                    log.warn("배포 레디니스 SELECT 1 실패 (연 연결 {}개)", held.size());
                    return 0;
                }
            }
            log.info("배포 레디니스 DB 풀 워밍 완료 connections={}", held.size());
            return held.size();
        } catch (Exception ex) {
            log.warn("배포 레디니스 DB 연결 실패: {} (연 연결 {}개)", ex.getClass().getSimpleName(), held.size());
            return 0;
        } finally {
            for (Connection connection : held) {
                closeQuietly(connection);
            }
            warmupRunning.set(false);
        }
    }

    private int readMinimumIdle() {
        HikariDataSource hikari = asHikari(dataSource);
        if (hikari == null) {
            log.warn("배포 레디니스 HikariDataSource 아님");
            return 0;
        }
        return hikari.getMinimumIdle();
    }

    private static HikariDataSource asHikari(DataSource source) {
        if (source instanceof HikariDataSource hikariDataSource) {
            return hikariDataSource;
        }
        try {
            if (source.isWrapperFor(HikariDataSource.class)) {
                return source.unwrap(HikariDataSource.class);
            }
        } catch (SQLException ex) {
            return null;
        }
        return null;
    }

    private static boolean selectOne(Connection connection) throws SQLException {
        try (Statement statement = connection.createStatement()) {
            statement.setQueryTimeout(CONNECTION_VALIDATION_TIMEOUT_SECONDS);
            try (ResultSet resultSet = statement.executeQuery(SELECT_ONE)) {
                return resultSet.next() && resultSet.getInt(1) == SELECT_ONE_RESULT;
            }
        }
    }

    private static void closeQuietly(Connection connection) {
        try {
            connection.close();
        } catch (Exception ex) {
            log.warn("배포 레디니스 DB 연결 종료 실패: {}", ex.getClass().getSimpleName());
        }
    }

    private boolean pingRedis() {
        RedisConnectionFactory factory = redisConnectionFactory.getIfUnique();
        if (factory == null) {
            log.warn("배포 레디니스 Redis ConnectionFactory 없음");
            return false;
        }
        RedisConnection connection = null;
        try {
            connection = factory.getConnection();
            String pong = connection.ping();
            return pong != null && REDIS_PING_OK.equalsIgnoreCase(pong.trim());
        } catch (Exception ex) {
            log.warn("배포 레디니스 Redis ping 실패: {}", ex.getClass().getSimpleName());
            return false;
        } finally {
            if (connection != null) {
                try {
                    connection.close();
                } catch (Exception closeEx) {
                    log.warn("배포 레디니스 Redis 연결 종료 실패: {}", closeEx.getClass().getSimpleName());
                }
            }
        }
    }

    private static ExecutorService newWarmupExecutor() {
        return Executors.newSingleThreadExecutor(runnable -> {
            Thread thread = new Thread(runnable, WARMUP_THREAD_NAME);
            thread.setDaemon(true);
            return thread;
        });
    }

    /**
     * 워밍 스레드를 멈춘다. 진행 중인 JDBC 연결 대기는 풀 타임아웃까지 남을 수 있다.
     */
    @Override
    public void destroy() {
        warmupExecutor.shutdownNow();
    }

    /**
     * @param databaseUp         minimum-idle 연결의 {@code SELECT 1} 이 예산 안에 끝났으면 참
     * @param redisUp            Redis PING 이 PONG 이면 참
     * @param warmedConnections  이번에 확인하고 풀에 돌려놓은 연결 수. 미준비면 0
     */
    public record Snapshot(boolean databaseUp, boolean redisUp, int warmedConnections) {

        /**
         * @return DB 풀 워밍과 Redis 가 모두 준비되었는지
         */
        public boolean ready() {
            return databaseUp && redisUp;
        }
    }
}
