package com.coresolution.consultation.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Map;
import javax.sql.DataSource;
import com.coresolution.consultation.health.DeploySlotReadinessProbe;
import com.coresolution.consultation.health.DeploySlotReadinessProbe.Snapshot;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;

/**
 * 전환 레디니스 HTTP 매핑과 기존 서버 헬스의 생존 확인 유지.
 *
 * @author MindGarden
 * @since 2026-09-25
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("배포 슬롯 레디니스 컨트롤러")
class DeploySlotReadinessControllerTest {

    @Mock
    private DeploySlotReadinessProbe readinessProbe;

    @InjectMocks
    private DeploySlotReadinessController controller;

    @Mock
    private DataSource dataSource;

    @Test
    @DisplayName("DB·Redis 가 준비되면 200")
    void checkDeployReadiness_ready_returns200() {
        when(readinessProbe.probe()).thenReturn(new Snapshot(true, true, 5));

        ResponseEntity<Map<String, Object>> response = controller.checkDeployReadiness();

        assertEquals(HttpStatus.OK, response.getStatusCode());
        Map<String, Object> body = response.getBody();
        assertNotNull(body);
        assertEquals("healthy", body.get("status"));
        assertEquals("up", body.get("database"));
        assertEquals("up", body.get("redis"));
        assertEquals(5, body.get("warmedConnections"));
        assertEquals("DB 풀이 SELECT 1 에 빠르게 응답하고 Redis 가 준비되었습니다", body.get("message"));
    }

    @Test
    @DisplayName("DB 가 내려가 있으면 503 이고 전환 신호가 아니다")
    void checkDeployReadiness_databaseDown_returns503() {
        when(readinessProbe.probe()).thenReturn(new Snapshot(false, true, 0));

        ResponseEntity<Map<String, Object>> response = controller.checkDeployReadiness();

        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, response.getStatusCode());
        Map<String, Object> body = response.getBody();
        assertNotNull(body);
        assertEquals("error", body.get("status"));
        assertEquals("down", body.get("database"));
        assertEquals("up", body.get("redis"));
    }

    @Test
    @DisplayName("Redis 가 내려가 있으면 503")
    void checkDeployReadiness_redisDown_returns503() {
        when(readinessProbe.probe()).thenReturn(new Snapshot(true, false, 0));

        ResponseEntity<Map<String, Object>> response = controller.checkDeployReadiness();

        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, response.getStatusCode());
        Map<String, Object> body = response.getBody();
        assertNotNull(body);
        assertEquals("error", body.get("status"));
        assertEquals("up", body.get("database"));
        assertEquals("down", body.get("redis"));
    }

    @Test
    @DisplayName("기존 서버 헬스는 DB 연결을 열지 않는다")
    void checkServerHealth_doesNotOpenDatabase() throws Exception {
        SystemHealthController serverHealth = new SystemHealthController();
        ReflectionTestUtils.setField(serverHealth, "dataSource", dataSource);

        ResponseEntity<Map<String, Object>> response = serverHealth.checkServerHealth();

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("healthy", response.getBody().get("status"));
        verify(dataSource, never()).getConnection();
    }
}
