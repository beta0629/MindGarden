package com.coresolution.core.config;

import javax.sql.DataSource;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.event.ApplicationFailedEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.context.event.ContextClosedEvent;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import lombok.extern.slf4j.Slf4j;

/**
 * 애플리케이션 종료 및 실패 시 데이터소스 연결 풀 정리
 * 
 * "Too many connections" 오류 방지를 위해:
 * 1. 애플리케이션 종료 시 모든 데이터베이스 연결을 명시적으로 정리
 * 2. 애플리케이션 시작 실패 시에도 연결 풀 정리 보장
 * 
 * @author CoreSolution
 * @since 2025-12-22
 */
@Slf4j
@Component
public class DataSourceShutdownHook implements ApplicationListener<ContextClosedEvent> {
    
    @Component
    public static class ApplicationFailedListener implements ApplicationListener<ApplicationFailedEvent> {
        @Autowired
        private DataSourceShutdownHook shutdownHook;
        
        @Override
        public void onApplicationEvent(@NonNull ApplicationFailedEvent event) {
            shutdownHook.cleanupDataSource("시작 실패");
        }
    }

    @Autowired
    private DataSource dataSource;

    @Override
    public void onApplicationEvent(@NonNull ContextClosedEvent event) {
        cleanupDataSource("종료");
    }
    
    /**
     * 데이터소스 연결 풀 정리 (공통 메서드)
     */
    void cleanupDataSource(String eventType) {
        if (dataSource instanceof HikariDataSource hikariDataSource) {
            try {
                // 현재 활성 연결 수 확인
                int activeConnections = hikariDataSource.getHikariPoolMXBean().getActiveConnections();
                int idleConnections = hikariDataSource.getHikariPoolMXBean().getIdleConnections();
                int totalConnections = hikariDataSource.getHikariPoolMXBean().getTotalConnections();
                
                log.warn("🔄 애플리케이션 {} 감지 - 데이터소스 연결 풀 정리 시작", eventType);
                log.warn("📊 연결 풀 상태: active={}, idle={}, total={}", 
                    activeConnections, idleConnections, totalConnections);
                
                // 연결 풀 종료 (모든 연결 정리)
                hikariDataSource.close();
                
                log.warn("✅ 데이터소스 연결 풀 정리 완료");
            } catch (Exception e) {
                log.error("❌ 데이터소스 연결 풀 정리 중 오류 발생: {}", e.getMessage(), e);
            }
        } else {
            log.warn("⚠️ HikariDataSource가 아닙니다. 연결 풀 정리를 건너뜁니다.");
        }
    }
}
