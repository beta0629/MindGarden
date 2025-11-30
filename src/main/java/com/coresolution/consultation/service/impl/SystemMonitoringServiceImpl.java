package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.service.SystemMonitoringService;
import com.coresolution.core.context.TenantContextHolder;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.jdbc.core.JdbcTemplate;

import javax.sql.DataSource;
import java.lang.management.ManagementFactory;
import java.lang.management.MemoryMXBean;
import java.lang.management.OperatingSystemMXBean;
import java.lang.management.RuntimeMXBean;
import java.util.HashMap;
import java.util.Map;

/**
 * 시스템 모니터링 서비스 구현체
 * Week 13 Day 2: 동적 시스템 감시 시스템 구축
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SystemMonitoringServiceImpl implements SystemMonitoringService {
    
    private final MeterRegistry meterRegistry;
    private final JdbcTemplate jdbcTemplate;
    private final DataSource dataSource;
    
    @Override
    public Map<String, Object> getSystemStatus() {
        Map<String, Object> status = new HashMap<>();
        
        RuntimeMXBean runtimeBean = ManagementFactory.getRuntimeMXBean();
        MemoryMXBean memoryBean = ManagementFactory.getMemoryMXBean();
        
        status.put("uptime", runtimeBean.getUptime());
        status.put("uptimeFormatted", formatUptime(runtimeBean.getUptime()));
        status.put("jvmName", runtimeBean.getVmName());
        status.put("jvmVersion", runtimeBean.getVmVersion());
        status.put("availableProcessors", Runtime.getRuntime().availableProcessors());
        
        // 메모리 정보
        long totalMemory = Runtime.getRuntime().totalMemory();
        long freeMemory = Runtime.getRuntime().freeMemory();
        long usedMemory = totalMemory - freeMemory;
        long maxMemory = Runtime.getRuntime().maxMemory();
        
        status.put("memory", Map.of(
                "total", totalMemory,
                "used", usedMemory,
                "free", freeMemory,
                "max", maxMemory,
                "usedPercent", (double) usedMemory / maxMemory * 100
        ));
        
        return status;
    }
    
    @Override
    public Map<String, Object> getMemoryUsage() {
        MemoryMXBean memoryBean = ManagementFactory.getMemoryMXBean();
        Runtime runtime = Runtime.getRuntime();
        
        long totalMemory = runtime.totalMemory();
        long freeMemory = runtime.freeMemory();
        long usedMemory = totalMemory - freeMemory;
        long maxMemory = runtime.maxMemory();
        
        Map<String, Object> memory = new HashMap<>();
        memory.put("heapUsed", memoryBean.getHeapMemoryUsage().getUsed());
        memory.put("heapMax", memoryBean.getHeapMemoryUsage().getMax());
        memory.put("heapCommitted", memoryBean.getHeapMemoryUsage().getCommitted());
        memory.put("nonHeapUsed", memoryBean.getNonHeapMemoryUsage().getUsed());
        memory.put("nonHeapMax", memoryBean.getNonHeapMemoryUsage().getMax());
        memory.put("totalUsed", usedMemory);
        memory.put("totalMax", maxMemory);
        memory.put("usedPercent", (double) usedMemory / maxMemory * 100);
        
        return memory;
    }
    
    @Override
    public Map<String, Object> getCpuUsage() {
        RuntimeMXBean runtimeBean = ManagementFactory.getRuntimeMXBean();
        OperatingSystemMXBean osBean = ManagementFactory.getOperatingSystemMXBean();
        
        // CPU 사용률은 운영체제별로 다르므로 간단한 추정치 제공
        long uptime = runtimeBean.getUptime();
        
        Map<String, Object> cpu = new HashMap<>();
        cpu.put("availableProcessors", Runtime.getRuntime().availableProcessors());
        cpu.put("systemLoadAverage", osBean.getSystemLoadAverage());
        cpu.put("uptime", uptime);
        
        // com.sun.management.OperatingSystemMXBean으로 캐스팅하여 CPU 로드 조회
        if (osBean instanceof com.sun.management.OperatingSystemMXBean) {
            com.sun.management.OperatingSystemMXBean sunOsBean = 
                    (com.sun.management.OperatingSystemMXBean) osBean;
            cpu.put("processCpuLoad", sunOsBean.getProcessCpuLoad());
            cpu.put("systemCpuLoad", sunOsBean.getSystemCpuLoad());
        }
        
        return cpu;
    }
    
    @Override
    public Map<String, Object> getDatabaseStatus() {
        Map<String, Object> db = new HashMap<>();
        
        try {
            // 실제 데이터베이스 연결 상태 확인
            log.info("🔍 데이터베이스 상태 확인 시작");
            
            // 1. 기본 연결 테스트
            String connectionTest = jdbcTemplate.queryForObject("SELECT 'OK' as status", String.class);
            db.put("status", "UP");
            db.put("connectionTest", connectionTest);
            
            // 2. 활성 연결 수 조회 (MySQL)
            try {
                Integer activeConnections = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM information_schema.processlist WHERE command != 'Sleep'", 
                    Integer.class
                );
                db.put("activeConnections", activeConnections != null ? activeConnections : 0);
                log.info("✅ 활성 DB 연결 수: {}", activeConnections);
            } catch (Exception e) {
                log.warn("⚠️ 활성 연결 수 조회 실패: {}", e.getMessage());
                db.put("activeConnections", 0);
                db.put("activeConnectionsError", e.getMessage());
            }
            
            // 3. 전체 연결 수 조회
            try {
                Integer totalConnections = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM information_schema.processlist", 
                    Integer.class
                );
                db.put("totalConnections", totalConnections != null ? totalConnections : 0);
                log.info("✅ 전체 DB 연결 수: {}", totalConnections);
            } catch (Exception e) {
                log.warn("⚠️ 전체 연결 수 조회 실패: {}", e.getMessage());
                db.put("totalConnections", 0);
                db.put("totalConnectionsError", e.getMessage());
            }
            
            // 4. 데이터베이스 정보
            try {
                String dbVersion = jdbcTemplate.queryForObject("SELECT VERSION()", String.class);
                db.put("version", dbVersion);
                log.info("✅ DB 버전: {}", dbVersion);
            } catch (Exception e) {
                log.warn("⚠️ DB 버전 조회 실패: {}", e.getMessage());
                db.put("versionError", e.getMessage());
            }
            
            // 5. 테이블 수 조회
            try {
                Integer tableCount = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE()", 
                    Integer.class
                );
                db.put("tableCount", tableCount != null ? tableCount : 0);
                log.info("✅ 테이블 수: {}", tableCount);
            } catch (Exception e) {
                log.warn("⚠️ 테이블 수 조회 실패: {}", e.getMessage());
                db.put("tableCount", 0);
                db.put("tableCountError", e.getMessage());
            }
            
            log.info("✅ 데이터베이스 상태 확인 완료");
            
        } catch (Exception e) {
            log.error("❌ 데이터베이스 상태 확인 실패: {}", e.getMessage(), e);
            db.put("status", "DOWN");
            db.put("error", e.getMessage());
            db.put("activeConnections", 0);
            db.put("totalConnections", 0);
        }
        
        return db;
    }
    
    @Override
    public Map<String, Object> getRecentErrors(int limit) {
        // 실제 구현은 로그 파일을 파싱하거나 로그 수집 시스템과 연동
        // 여기서는 기본 구조만 제공
        Map<String, Object> errors = new HashMap<>();
        errors.put("count", 0);
        errors.put("errors", new java.util.ArrayList<>());
        errors.put("note", "로그 파일 파싱 또는 로그 수집 시스템 연동 필요");
        
        return errors;
    }
    
    @Override
    public Map<String, Object> getApiResponseTimeStats() {
        Map<String, Object> stats = new HashMap<>();
        
        // Micrometer에서 API 응답 시간 통계 조회
        try {
            Timer apiTimer = meterRegistry.find("api.duration").timer();
            if (apiTimer != null) {
                stats.put("count", apiTimer.count());
                stats.put("totalTime", apiTimer.totalTime(java.util.concurrent.TimeUnit.MILLISECONDS));
                stats.put("mean", apiTimer.mean(java.util.concurrent.TimeUnit.MILLISECONDS));
                stats.put("max", apiTimer.max(java.util.concurrent.TimeUnit.MILLISECONDS));
                // Percentile은 DistributionSummary를 사용하거나 별도 설정 필요
                // 여기서는 기본 통계만 제공
                stats.put("note", "Percentile 통계는 Prometheus 또는 별도 설정 필요");
            } else {
                stats.put("note", "아직 수집된 메트릭이 없습니다");
            }
        } catch (Exception e) {
            log.warn("API 응답 시간 통계 조회 실패: {}", e.getMessage());
            stats.put("error", e.getMessage());
        }
        
        return stats;
    }
    
    /**
     * 업타임을 읽기 쉬운 형식으로 변환
     */
    private String formatUptime(long uptimeMs) {
        long seconds = uptimeMs / 1000;
        long minutes = seconds / 60;
        long hours = minutes / 60;
        long days = hours / 24;
        
        if (days > 0) {
            return String.format("%d일 %d시간 %d분", days, hours % 24, minutes % 60);
        } else if (hours > 0) {
            return String.format("%d시간 %d분", hours, minutes % 60);
        } else if (minutes > 0) {
            return String.format("%d분 %d초", minutes, seconds % 60);
        } else {
            return String.format("%d초", seconds);
        }
    }
}

