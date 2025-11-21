package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.service.SystemMonitoringService;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

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
        // 데이터베이스 연결 상태는 HealthIndicator를 통해 확인
        // 여기서는 기본 정보만 제공
        Map<String, Object> db = new HashMap<>();
        db.put("status", "UP"); // 실제로는 DataSource에서 확인 필요
        db.put("note", "상세 정보는 /actuator/health 엔드포인트에서 확인 가능");
        
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

