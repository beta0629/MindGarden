package com.coresolution.core.service.impl;

import com.coresolution.core.service.ConnectionPoolManagementService;
import com.zaxxer.hikari.HikariDataSource;
import com.zaxxer.hikari.HikariPoolMXBean;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.util.HashMap;
import java.util.Map;

/**
 * 데이터베이스 연결 풀 관리 서비스 구현체
 * 
 * HikariCP 연결 풀의 표준화된 관리 기능을 제공합니다.
 * 
 * @author CoreSolution
 * @since 2025-12-22
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ConnectionPoolManagementServiceImpl implements ConnectionPoolManagementService {

    private final DataSource dataSource;

    @Override
    public Map<String, Object> getConnectionPoolStatus() {
        Map<String, Object> status = new HashMap<>();
        
        if (dataSource instanceof HikariDataSource hikariDataSource) {
            try {
                HikariPoolMXBean poolBean = hikariDataSource.getHikariPoolMXBean();
                
                status.put("poolName", hikariDataSource.getPoolName());
                status.put("activeConnections", poolBean.getActiveConnections());
                status.put("idleConnections", poolBean.getIdleConnections());
                status.put("totalConnections", poolBean.getTotalConnections());
                status.put("threadsAwaitingConnection", poolBean.getThreadsAwaitingConnection());
                status.put("maximumPoolSize", hikariDataSource.getMaximumPoolSize());
                status.put("minimumIdle", hikariDataSource.getMinimumIdle());
                status.put("connectionTimeout", hikariDataSource.getConnectionTimeout());
                status.put("idleTimeout", hikariDataSource.getIdleTimeout());
                status.put("maxLifetime", hikariDataSource.getMaxLifetime());
                status.put("leakDetectionThreshold", hikariDataSource.getLeakDetectionThreshold());
                status.put("isValid", true);
                
                log.debug("📊 연결 풀 상태 조회: active={}, idle={}, total={}, max={}", 
                    poolBean.getActiveConnections(), 
                    poolBean.getIdleConnections(), 
                    poolBean.getTotalConnections(),
                    hikariDataSource.getMaximumPoolSize());
            } catch (Exception e) {
                log.error("❌ 연결 풀 상태 조회 실패: {}", e.getMessage(), e);
                status.put("isValid", false);
                status.put("error", e.getMessage());
            }
        } else {
            log.warn("⚠️ HikariDataSource가 아닙니다. 연결 풀 상태 조회 불가");
            status.put("isValid", false);
            status.put("error", "HikariDataSource가 아닙니다");
        }
        
        return status;
    }

    @Override
    public boolean cleanupConnectionPool(String reason) {
        if (dataSource instanceof HikariDataSource hikariDataSource) {
            try {
                HikariPoolMXBean poolBean = hikariDataSource.getHikariPoolMXBean();
                
                int activeConnections = poolBean.getActiveConnections();
                int idleConnections = poolBean.getIdleConnections();
                int totalConnections = poolBean.getTotalConnections();
                
                log.warn("🔄 연결 풀 정리 시작: reason={}, active={}, idle={}, total={}", 
                    reason, activeConnections, idleConnections, totalConnections);
                
                // 연결 풀 종료 (모든 연결 정리)
                hikariDataSource.close();
                
                log.warn("✅ 연결 풀 정리 완료: reason={}", reason);
                return true;
            } catch (Exception e) {
                log.error("❌ 연결 풀 정리 실패: reason={}, error={}", reason, e.getMessage(), e);
                return false;
            }
        } else {
            log.warn("⚠️ HikariDataSource가 아닙니다. 연결 풀 정리를 건너뜁니다.");
            return false;
        }
    }

    @Override
    public boolean validateConnectionPool() {
        if (dataSource instanceof HikariDataSource hikariDataSource) {
            try {
                HikariPoolMXBean poolBean = hikariDataSource.getHikariPoolMXBean();
                
                int activeConnections = poolBean.getActiveConnections();
                int totalConnections = poolBean.getTotalConnections();
                int maximumPoolSize = hikariDataSource.getMaximumPoolSize();
                
                // 연결 수가 최대 풀 크기를 초과하는지 확인
                if (totalConnections > maximumPoolSize) {
                    log.warn("⚠️ 연결 풀 검증 실패: totalConnections({}) > maximumPoolSize({})", 
                        totalConnections, maximumPoolSize);
                    return false;
                }
                
                // 활성 연결이 최대 풀 크기를 초과하는지 확인
                if (activeConnections > maximumPoolSize) {
                    log.warn("⚠️ 연결 풀 검증 실패: activeConnections({}) > maximumPoolSize({})", 
                        activeConnections, maximumPoolSize);
                    return false;
                }
                
                log.debug("✅ 연결 풀 검증 통과: active={}, total={}, max={}", 
                    activeConnections, totalConnections, maximumPoolSize);
                return true;
            } catch (Exception e) {
                log.error("❌ 연결 풀 검증 중 오류 발생: {}", e.getMessage(), e);
                return false;
            }
        }
        
        return false;
    }

    @Override
    public int detectConnectionLeaks() {
        if (dataSource instanceof HikariDataSource hikariDataSource) {
            try {
                HikariPoolMXBean poolBean = hikariDataSource.getHikariPoolMXBean();
                
                int activeConnections = poolBean.getActiveConnections();
                int threadsAwaitingConnection = poolBean.getThreadsAwaitingConnection();
                long leakDetectionThreshold = hikariDataSource.getLeakDetectionThreshold();
                
                // 대기 중인 스레드가 많으면 누수 의심
                if (threadsAwaitingConnection > 0) {
                    log.warn("⚠️ 연결 누수 의심: threadsAwaitingConnection={}, activeConnections={}, threshold={}ms", 
                        threadsAwaitingConnection, activeConnections, leakDetectionThreshold);
                    return threadsAwaitingConnection;
                }
                
                // 활성 연결이 최대 풀 크기에 근접하면 누수 의심
                int maximumPoolSize = hikariDataSource.getMaximumPoolSize();
                if (activeConnections >= maximumPoolSize * 0.9) {
                    log.warn("⚠️ 연결 누수 의심: activeConnections({}) >= maximumPoolSize({}) * 0.9", 
                        activeConnections, maximumPoolSize);
                    return activeConnections;
                }
                
                return 0;
            } catch (Exception e) {
                log.error("❌ 연결 누수 감지 중 오류 발생: {}", e.getMessage(), e);
                return -1;
            }
        }
        
        return -1;
    }
}

