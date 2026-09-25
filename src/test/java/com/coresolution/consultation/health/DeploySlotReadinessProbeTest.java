package com.coresolution.consultation.health;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.sql.Connection;
import java.sql.SQLException;
import javax.sql.DataSource;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.data.redis.connection.RedisConnection;
import org.springframework.data.redis.connection.RedisConnectionFactory;

/**
 * 전환 레디니스가 DB 연결을 한 번 열고, Redis 실패 시 준비되지 않음으로 본다.
 *
 * @author MindGarden
 * @since 2026-09-25
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("배포 슬롯 레디니스 프로브")
class DeploySlotReadinessProbeTest {

    @Mock
    private DataSource dataSource;

    @Mock
    private Connection connection;

    @Mock
    private ObjectProvider<RedisConnectionFactory> redisConnectionFactory;

    @Mock
    private RedisConnectionFactory redisFactory;

    @Mock
    private RedisConnection redisConnection;

    private DeploySlotReadinessProbe probe;

    @BeforeEach
    void setUp() {
        probe = new DeploySlotReadinessProbe(dataSource, redisConnectionFactory);
    }

    @Test
    @DisplayName("DB 연결과 Redis PONG 이면 준비됨이고 연결은 한 번만 연다")
    void probe_bothUp_readyAndOpensDatabaseOnce() throws Exception {
        givenDatabaseValid();
        givenRedisPong("PONG");

        DeploySlotReadinessProbe.Snapshot snapshot = probe.probe();

        assertTrue(snapshot.databaseUp());
        assertTrue(snapshot.redisUp());
        assertTrue(snapshot.ready());
        verify(dataSource).getConnection();
        verify(connection).isValid(DeploySlotReadinessProbe.CONNECTION_VALIDATION_TIMEOUT_SECONDS);
        verify(connection).close();
        verify(redisFactory).getConnection();
        verify(redisConnection).ping();
        verify(redisConnection).close();
    }

    @Test
    @DisplayName("DB 연결이 유효하지 않으면 준비되지 않음")
    void probe_databaseInvalid_notReady() throws Exception {
        when(dataSource.getConnection()).thenReturn(connection);
        when(connection.isValid(DeploySlotReadinessProbe.CONNECTION_VALIDATION_TIMEOUT_SECONDS)).thenReturn(false);
        givenRedisPong("PONG");

        DeploySlotReadinessProbe.Snapshot snapshot = probe.probe();

        assertFalse(snapshot.databaseUp());
        assertTrue(snapshot.redisUp());
        assertFalse(snapshot.ready());
        verify(connection).close();
    }

    @Test
    @DisplayName("DB 연결을 열지 못하면 준비되지 않음")
    void probe_databaseThrows_notReady() throws Exception {
        when(dataSource.getConnection()).thenThrow(new SQLException("connection refused"));
        givenRedisPong("pong");

        DeploySlotReadinessProbe.Snapshot snapshot = probe.probe();

        assertFalse(snapshot.databaseUp());
        assertTrue(snapshot.redisUp());
        assertFalse(snapshot.ready());
        verify(redisConnection).close();
    }

    @Test
    @DisplayName("Redis 가 없으면 DB 를 열어도 준비되지 않음")
    void probe_redisMissing_notReady() throws Exception {
        givenDatabaseValid();
        when(redisConnectionFactory.getIfUnique()).thenReturn(null);

        DeploySlotReadinessProbe.Snapshot snapshot = probe.probe();

        assertTrue(snapshot.databaseUp());
        assertFalse(snapshot.redisUp());
        assertFalse(snapshot.ready());
        verify(dataSource).getConnection();
        verify(redisFactory, never()).getConnection();
    }

    @Test
    @DisplayName("Redis ping 이 실패하면 준비되지 않음")
    void probe_redisPingThrows_notReady() throws Exception {
        givenDatabaseValid();
        when(redisConnectionFactory.getIfUnique()).thenReturn(redisFactory);
        when(redisFactory.getConnection()).thenReturn(redisConnection);
        when(redisConnection.ping()).thenThrow(new IllegalStateException("redis down"));

        DeploySlotReadinessProbe.Snapshot snapshot = probe.probe();

        assertTrue(snapshot.databaseUp());
        assertFalse(snapshot.redisUp());
        assertFalse(snapshot.ready());
        verify(redisConnection).close();
    }

    @Test
    @DisplayName("Redis 응답이 PONG 이 아니면 준비되지 않음")
    void probe_redisPingNotPong_notReady() throws Exception {
        givenDatabaseValid();
        givenRedisPong("LOADING");

        DeploySlotReadinessProbe.Snapshot snapshot = probe.probe();

        assertTrue(snapshot.databaseUp());
        assertFalse(snapshot.redisUp());
        assertFalse(snapshot.ready());
    }

    private void givenDatabaseValid() throws SQLException {
        when(dataSource.getConnection()).thenReturn(connection);
        when(connection.isValid(DeploySlotReadinessProbe.CONNECTION_VALIDATION_TIMEOUT_SECONDS)).thenReturn(true);
    }

    private void givenRedisPong(String pong) {
        when(redisConnectionFactory.getIfUnique()).thenReturn(redisFactory);
        when(redisFactory.getConnection()).thenReturn(redisConnection);
        when(redisConnection.ping()).thenReturn(pong);
    }
}
