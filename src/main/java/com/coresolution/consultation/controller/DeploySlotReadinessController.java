package com.coresolution.consultation.controller;

import java.util.HashMap;
import java.util.Map;
import com.coresolution.consultation.health.DeploySlotReadinessProbe;
import com.coresolution.consultation.health.DeploySlotReadinessProbe.Snapshot;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 운영 트래픽 전환 게이트. minimum-idle 연결의 {@code SELECT 1} 과 Redis 확인만 하며
 * 테넌트 헤더는 요구하지 않는다.
 * {@code /actuator/health} 와 {@code /api/v1/health/server} 의 프로세스 생존 확인은
 * 이 경로로 바꾸지 않는다.
 *
 * @author MindGarden
 * @since 2026-09-25
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/health")
@RequiredArgsConstructor
public class DeploySlotReadinessController {

    private static final String STATUS_HEALTHY = "healthy";

    private static final String STATUS_ERROR = "error";

    private static final String COMPONENT_UP = "up";

    private static final String COMPONENT_DOWN = "down";

    private static final String MESSAGE_READY = "DB 풀이 SELECT 1 에 빠르게 응답하고 Redis 가 준비되었습니다";

    private static final String MESSAGE_NOT_READY = "DB 풀 워밍 또는 Redis 가 준비되지 않았습니다";

    private final DeploySlotReadinessProbe readinessProbe;

    /**
     * 비활성 슬롯이 트래픽을 받기 전에 호출한다.
     *
     * @return 풀 워밍과 Redis 가 준비되면 200, 아니면 503
     */
    @GetMapping("/readiness")
    public ResponseEntity<Map<String, Object>> checkDeployReadiness() {
        Snapshot snapshot = readinessProbe.probe();
        Map<String, Object> body = new HashMap<>();
        body.put("database", snapshot.databaseUp() ? COMPONENT_UP : COMPONENT_DOWN);
        body.put("redis", snapshot.redisUp() ? COMPONENT_UP : COMPONENT_DOWN);
        body.put("warmedConnections", snapshot.warmedConnections());
        body.put("timestamp", System.currentTimeMillis());
        if (snapshot.ready()) {
            body.put("status", STATUS_HEALTHY);
            body.put("message", MESSAGE_READY);
            return ResponseEntity.ok(body);
        }
        body.put("status", STATUS_ERROR);
        body.put("message", MESSAGE_NOT_READY);
        log.warn("배포 슬롯 레디니스 실패 database={} redis={} warmed={}",
                snapshot.databaseUp(), snapshot.redisUp(), snapshot.warmedConnections());
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(body);
    }
}
