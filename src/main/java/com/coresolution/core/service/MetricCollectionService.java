package com.coresolution.core.service;

import com.coresolution.core.domain.SystemMetric;
import com.coresolution.core.repository.SystemMetricRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.lang.management.ManagementFactory;
import java.lang.management.MemoryMXBean;
import java.lang.management.OperatingSystemMXBean;
import java.time.LocalDateTime;

/**
 * 메트릭 수집 서비스
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-12-02
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MetricCollectionService {
    
    private final SystemMetricRepository systemMetricRepository;
    
    /**
     * 시스템 메트릭 수집 (1분마다)
     */
    @Scheduled(fixedRate = 60000) // 1분
    public void collectSystemMetrics() {
        try {
            collectCpuMetric();
            collectMemoryMetric();
            collectJvmMetric();
        } catch (Exception e) {
            log.error("메트릭 수집 실패", e);
        }
    }
    
    /**
     * CPU 사용률 수집
     */
    private void collectCpuMetric() {
        try {
            OperatingSystemMXBean osBean = ManagementFactory.getOperatingSystemMXBean();
            double cpuLoad = osBean.getSystemLoadAverage();
            
            if (cpuLoad >= 0) {
                SystemMetric metric = SystemMetric.builder()
                    .tenantId(null) // 시스템 전체
                    .metricType("CPU_LOAD")
                    .metricValue(cpuLoad)
                    .unit("load")
                    .host(getHostName())
                    .collectedAt(LocalDateTime.now())
                    .build();
                
                systemMetricRepository.save(metric);
                log.debug("CPU 메트릭 수집: {}", cpuLoad);
            }
        } catch (Exception e) {
            log.error("CPU 메트릭 수집 실패", e);
        }
    }
    
    /**
     * 메모리 사용률 수집
     */
    private void collectMemoryMetric() {
        try {
            MemoryMXBean memoryBean = ManagementFactory.getMemoryMXBean();
            long usedMemory = memoryBean.getHeapMemoryUsage().getUsed();
            long maxMemory = memoryBean.getHeapMemoryUsage().getMax();
            
            double memoryUsagePercent = (double) usedMemory / maxMemory * 100;
            
            SystemMetric metric = SystemMetric.builder()
                .tenantId(null) // 시스템 전체
                .metricType("MEMORY_USAGE")
                .metricValue(memoryUsagePercent)
                .unit("%")
                .host(getHostName())
                .collectedAt(LocalDateTime.now())
                .build();
            
            systemMetricRepository.save(metric);
            log.debug("메모리 메트릭 수집: {}%", String.format("%.2f", memoryUsagePercent));
        } catch (Exception e) {
            log.error("메모리 메트릭 수집 실패", e);
        }
    }
    
    /**
     * JVM 메트릭 수집
     */
    private void collectJvmMetric() {
        try {
            Runtime runtime = Runtime.getRuntime();
            long totalMemory = runtime.totalMemory();
            long freeMemory = runtime.freeMemory();
            long usedMemory = totalMemory - freeMemory;
            
            double jvmUsagePercent = (double) usedMemory / totalMemory * 100;
            
            SystemMetric metric = SystemMetric.builder()
                .tenantId(null) // 시스템 전체
                .metricType("JVM_MEMORY")
                .metricValue(jvmUsagePercent)
                .unit("%")
                .host(getHostName())
                .collectedAt(LocalDateTime.now())
                .build();
            
            systemMetricRepository.save(metric);
            log.debug("JVM 메트릭 수집: {}%", String.format("%.2f", jvmUsagePercent));
        } catch (Exception e) {
            log.error("JVM 메트릭 수집 실패", e);
        }
    }
    
    /**
     * 호스트명 조회
     */
    private String getHostName() {
        try {
            return java.net.InetAddress.getLocalHost().getHostName();
        } catch (Exception e) {
            return "unknown";
        }
    }
    
    /**
     * 수동 메트릭 저장
     */
    public void saveMetric(String tenantId, String metricType, Double value, String unit) {
        try {
            SystemMetric metric = SystemMetric.builder()
                .tenantId(tenantId)
                .metricType(metricType)
                .metricValue(value)
                .unit(unit)
                .host(getHostName())
                .collectedAt(LocalDateTime.now())
                .build();
            
            systemMetricRepository.save(metric);
            log.debug("메트릭 저장: type={}, value={}, unit={}", metricType, value, unit);
        } catch (Exception e) {
            log.error("메트릭 저장 실패: type={}", metricType, e);
        }
    }
}

