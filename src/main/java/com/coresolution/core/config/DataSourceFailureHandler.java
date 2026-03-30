package com.coresolution.core.config;

import com.coresolution.core.service.ConnectionPoolManagementService;
import org.springframework.boot.context.event.ApplicationFailedEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 애플리케이션 시작 실패 시 데이터소스 연결 풀 정리
 *
 * "Too many connections" 오류 방지를 위해 애플리케이션 시작 실패 시
 * 표준화된 연결 풀 관리 서비스를 통해 데이터베이스 연결을 정리합니다.
 *
 * @author CoreSolution
 * @since 2025-12-22
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataSourceFailureHandler implements ApplicationListener<ApplicationFailedEvent> {

    private final ConnectionPoolManagementService connectionPoolManagementService;

    @Override
    public void onApplicationEvent(@NonNull ApplicationFailedEvent event) {
        log.error("❌ 애플리케이션 시작 실패 감지 - 연결 풀 정리 시작");
        connectionPoolManagementService.cleanupConnectionPool("애플리케이션 시작 실패");
    }
}

