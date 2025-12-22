package com.coresolution.core.config;

import com.coresolution.core.service.ConnectionPoolManagementService;
import org.springframework.context.ApplicationListener;
import org.springframework.context.event.ContextClosedEvent;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 애플리케이션 종료 시 데이터소스 연결 풀 정리
 *
 * "Too many connections" 오류 방지를 위해 애플리케이션 종료 시 표준화된 연결 풀 관리 서비스를 통해 데이터베이스 연결을 정리합니다.
 *
 * @author CoreSolution
 * @since 2025-12-22
 * @version 1.0 - DB 연결 정리 후 배포 검증
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataSourceShutdownHook implements ApplicationListener<ContextClosedEvent> {

    private final ConnectionPoolManagementService connectionPoolManagementService;

    @Override
    public void onApplicationEvent(@NonNull ContextClosedEvent event) {
        log.info("🔄 애플리케이션 종료 감지 - 연결 풀 정리 시작");
        connectionPoolManagementService.cleanupConnectionPool("애플리케이션 종료");
    }
}
