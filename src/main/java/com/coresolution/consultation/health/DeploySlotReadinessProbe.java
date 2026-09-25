package com.coresolution.consultation.health;

import java.sql.Connection;
import javax.sql.DataSource;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.data.redis.connection.RedisConnection;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.stereotype.Component;
import lombok.extern.slf4j.Slf4j;

/**
 * 운영 블루/그린 전환 직전에 비활성 슬롯이 DB 연결을 한 번 열고
 * Redis 에 응답하는지 확인한다.
 * 테넌트 데이터가 아닌 인프라 연결만 본다.
 *
 * @author MindGarden
 * @since 2026-09-25
 */
@Slf4j
@Component
public class DeploySlotReadinessProbe {

    /**
     * {@link Connection#isValid(int)} 대기 초. 기존 {@code /api/v1/health/database} 와 같다.
     * Hikari {@code connection-timeout} 은 바꾸지 않는다.
     */
    public static final int CONNECTION_VALIDATION_TIMEOUT_SECONDS = 5;

    private static final String REDIS_PING_OK = "PONG";

    private final DataSource dataSource;

    private final ObjectProvider<RedisConnectionFactory> redisConnectionFactory;

    /**
     * @param dataSource               풀에서 연결을 한 번 빌릴 데이터소스
     * @param redisConnectionFactory   없으면 Redis 미준비로 본다
     */
    public DeploySlotReadinessProbe(DataSource dataSource,
                                     ObjectProvider<RedisConnectionFactory> redisConnectionFactory) {
        this.dataSource = dataSource;
        this.redisConnectionFactory = redisConnectionFactory;
    }

    /**
     * DB 연결을 한 번 열고 Redis {@code PING} 을 보낸다.
     *
     * @return 각 인프라의 준비 여부. 둘 다 성공일 때만 {@link Snapshot#ready()} 가 참이다.
     */
    public Snapshot probe() {
        boolean databaseUp = openDatabaseConnection();
        boolean redisUp = pingRedis();
        return new Snapshot(databaseUp, redisUp);
    }

    private boolean openDatabaseConnection() {
        try (Connection connection = dataSource.getConnection()) {
            return connection.isValid(CONNECTION_VALIDATION_TIMEOUT_SECONDS);
        } catch (Exception ex) {
            log.warn("배포 레디니스 DB 연결 실패: {}", ex.getClass().getSimpleName());
            return false;
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

    /**
     * @param databaseUp DB 연결을 열어 유효성을 확인했으면 참
     * @param redisUp    Redis PING 이 PONG 이면 참
     */
    public record Snapshot(boolean databaseUp, boolean redisUp) {

        /**
         * @return DB 와 Redis 가 모두 준비되었는지
         */
        public boolean ready() {
            return databaseUp && redisUp;
        }
    }
}
