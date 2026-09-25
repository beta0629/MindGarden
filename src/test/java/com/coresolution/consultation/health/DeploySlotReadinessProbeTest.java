package com.coresolution.consultation.health;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTimeoutPreemptively;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import javax.sql.DataSource;
import com.zaxxer.hikari.HikariDataSource;
import org.junit.jupiter.api.AfterEach;
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
 * 전환 레디니스가 minimum-idle 연결을 동시에 열고 {@code SELECT 1} 이 빨라야 준비로 본다.
 *
 * @author MindGarden
 * @since 2026-09-25
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("배포 슬롯 레디니스 프로브")
class DeploySlotReadinessProbeTest {

    private static final int CONFIGURED_MINIMUM_IDLE = 5;

    @Mock
    private HikariDataSource dataSource;

    @Mock
    private ObjectProvider<RedisConnectionFactory> redisConnectionFactory;

    @Mock
    private RedisConnectionFactory redisFactory;

    @Mock
    private RedisConnection redisConnection;

    private final List<Connection> openedConnections = new ArrayList<>();

    private DeploySlotReadinessProbe probe;

    @BeforeEach
    void setUp() {
        probe = new DeploySlotReadinessProbe(dataSource, redisConnectionFactory);
    }

    @AfterEach
    void tearDown() {
        probe.destroy();
    }

    @Test
    @DisplayName("minimum-idle 연결마다 SELECT 1 이 끝나면 준비됨이고 isValid 만으로는 끝내지 않는다")
    void probe_minimumIdleSelectOneAndRedis_ready() throws Exception {
        givenMinimumIdleConnections(true);
        givenRedisPong("PONG");

        DeploySlotReadinessProbe.Snapshot snapshot = probe.probe();

        assertTrue(snapshot.databaseUp());
        assertTrue(snapshot.redisUp());
        assertTrue(snapshot.ready());
        assertEquals(CONFIGURED_MINIMUM_IDLE, snapshot.warmedConnections());
        verify(dataSource, times(CONFIGURED_MINIMUM_IDLE)).getConnection();
        assertEquals(CONFIGURED_MINIMUM_IDLE, openedConnections.size());
        for (Connection connection : openedConnections) {
            verify(connection).createStatement();
            verify(connection, never()).isValid(DeploySlotReadinessProbe.CONNECTION_VALIDATION_TIMEOUT_SECONDS);
            verify(connection).close();
        }
        verify(redisFactory).getConnection();
        verify(redisConnection).ping();
        verify(redisConnection).close();
    }

    @Test
    @DisplayName("SELECT 1 이 1 이 아니면 준비되지 않음")
    void probe_selectOneNotOne_notReady() throws Exception {
        givenMinimumIdleConnections(false);
        givenRedisPong("PONG");

        DeploySlotReadinessProbe.Snapshot snapshot = probe.probe();

        assertFalse(snapshot.databaseUp());
        assertTrue(snapshot.redisUp());
        assertFalse(snapshot.ready());
        assertEquals(0, snapshot.warmedConnections());
        verify(dataSource, times(CONFIGURED_MINIMUM_IDLE)).getConnection();
        for (Connection connection : openedConnections) {
            verify(connection).close();
        }
    }

    @Test
    @DisplayName("연결을 minimum-idle 만큼 열지 못하면 준비되지 않음")
    void probe_databaseThrows_notReady() throws Exception {
        when(dataSource.getMinimumIdle()).thenReturn(CONFIGURED_MINIMUM_IDLE);
        when(dataSource.getConnection()).thenThrow(new SQLException("connection refused"));
        givenRedisPong("pong");

        DeploySlotReadinessProbe.Snapshot snapshot = probe.probe();

        assertFalse(snapshot.databaseUp());
        assertTrue(snapshot.redisUp());
        assertFalse(snapshot.ready());
        verify(redisConnection).close();
    }

    @Test
    @DisplayName("Hikari 가 아니면 연결을 열지 않고 준비되지 않음")
    void probe_notHikari_notReady() throws Exception {
        DataSource plain = mock(DataSource.class);
        when(plain.isWrapperFor(HikariDataSource.class)).thenReturn(false);
        DeploySlotReadinessProbe plainProbe = new DeploySlotReadinessProbe(plain, redisConnectionFactory);
        givenRedisPong("PONG");

        DeploySlotReadinessProbe.Snapshot snapshot = plainProbe.probe();

        assertFalse(snapshot.databaseUp());
        assertFalse(snapshot.ready());
        verify(plain, never()).getConnection();
        plainProbe.destroy();
    }

    @Test
    @DisplayName("연결이 예산보다 느리면 이번 응답은 준비되지 않음")
    void probe_slowConnect_notReadyWithinBudget() throws Exception {
        when(dataSource.getMinimumIdle()).thenReturn(CONFIGURED_MINIMUM_IDLE);
        when(dataSource.getConnection()).thenAnswer(invocation -> {
            Thread.sleep(500);
            return mock(Connection.class);
        });
        DeploySlotReadinessProbe slowProbe = new DeploySlotReadinessProbe(
                dataSource, redisConnectionFactory, Duration.ofMillis(80));

        DeploySlotReadinessProbe.Snapshot snapshot = assertTimeoutPreemptively(
                Duration.ofMillis(400), slowProbe::probe);

        assertFalse(snapshot.databaseUp());
        assertFalse(snapshot.ready());
        assertEquals(0, snapshot.warmedConnections());
        slowProbe.destroy();
    }

    @Test
    @DisplayName("Redis 가 없으면 DB 를 열어도 준비되지 않음")
    void probe_redisMissing_notReady() throws Exception {
        givenMinimumIdleConnections(true);
        when(redisConnectionFactory.getIfUnique()).thenReturn(null);

        DeploySlotReadinessProbe.Snapshot snapshot = probe.probe();

        assertTrue(snapshot.databaseUp());
        assertFalse(snapshot.redisUp());
        assertFalse(snapshot.ready());
        verify(dataSource, times(CONFIGURED_MINIMUM_IDLE)).getConnection();
        verify(redisFactory, never()).getConnection();
    }

    @Test
    @DisplayName("Redis ping 이 실패하면 준비되지 않음")
    void probe_redisPingThrows_notReady() throws Exception {
        givenMinimumIdleConnections(true);
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
        givenMinimumIdleConnections(true);
        givenRedisPong("LOADING");

        DeploySlotReadinessProbe.Snapshot snapshot = probe.probe();

        assertTrue(snapshot.databaseUp());
        assertFalse(snapshot.redisUp());
        assertFalse(snapshot.ready());
    }

    private void givenMinimumIdleConnections(boolean selectReturnsOne) throws SQLException {
        when(dataSource.getMinimumIdle()).thenReturn(CONFIGURED_MINIMUM_IDLE);
        when(dataSource.getConnection()).thenAnswer(invocation -> newSelectConnection(selectReturnsOne));
    }

    private Connection newSelectConnection(boolean selectReturnsOne) throws SQLException {
        Connection connection = mock(Connection.class);
        Statement statement = mock(Statement.class);
        ResultSet resultSet = mock(ResultSet.class);
        when(connection.createStatement()).thenReturn(statement);
        when(statement.executeQuery("SELECT 1")).thenReturn(resultSet);
        when(resultSet.next()).thenReturn(selectReturnsOne);
        if (selectReturnsOne) {
            when(resultSet.getInt(1)).thenReturn(1);
        }
        openedConnections.add(connection);
        return connection;
    }

    private void givenRedisPong(String pong) {
        when(redisConnectionFactory.getIfUnique()).thenReturn(redisFactory);
        when(redisFactory.getConnection()).thenReturn(redisConnection);
        when(redisConnection.ping()).thenReturn(pong);
    }
}
