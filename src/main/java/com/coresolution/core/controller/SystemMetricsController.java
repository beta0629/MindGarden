package com.coresolution.core.controller;

import java.lang.management.ManagementFactory;
import java.lang.management.MemoryMXBean;
import java.lang.management.OperatingSystemMXBean;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.coresolution.core.domain.SystemMetric;
import com.coresolution.core.dto.ApiResponse;
import com.coresolution.core.repository.SystemMetricRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 시스템 메트릭 API 컨트롤러
 * 실시간 시스템 리소스 모니터링
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-12-02
 */
@Slf4j
@RestController
@RequestMapping("/api/monitoring/system-metrics")
@RequiredArgsConstructor
public class SystemMetricsController {
    
    private final SystemMetricRepository systemMetricRepository;
    
    /**
     * 현재 시스템 메트릭 조회
     * 
     * @return 현재 시스템 메트릭
     */
    @GetMapping("/current")
    @PreAuthorize("hasAnyRole('ADMIN', 'HQ_MASTER')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getCurrentMetrics() {
        try {
            log.debug("현재 시스템 메트릭 조회");
            
            OperatingSystemMXBean osBean = ManagementFactory.getOperatingSystemMXBean();
            MemoryMXBean memoryBean = ManagementFactory.getMemoryMXBean();
            Runtime runtime = Runtime.getRuntime();
            
            // CPU 사용률
            double cpuUsage = osBean.getSystemLoadAverage() * 100 / osBean.getAvailableProcessors();
            if (cpuUsage < 0) cpuUsage = 0; // 일부 시스템에서 음수 반환
            
            // 시스템 메모리
            long totalMemory = 0;
            long freeMemory = 0;
            long usedMemory = 0;
            double memoryUsage = 0;
            
            if (osBean instanceof com.sun.management.OperatingSystemMXBean) {
                com.sun.management.OperatingSystemMXBean sunOsBean = 
                    (com.sun.management.OperatingSystemMXBean) osBean;
                totalMemory = sunOsBean.getTotalPhysicalMemorySize();
                freeMemory = sunOsBean.getFreePhysicalMemorySize();
                usedMemory = totalMemory - freeMemory;
                memoryUsage = (double) usedMemory / totalMemory * 100;
            }
            
            // JVM 메모리
            long jvmMemoryUsed = memoryBean.getHeapMemoryUsage().getUsed();
            long jvmMemoryMax = memoryBean.getHeapMemoryUsage().getMax();
            double jvmMemoryUsage = (double) jvmMemoryUsed / jvmMemoryMax * 100;
            
            // 디스크 사용률 (간단한 버전)
            long totalDisk = runtime.totalMemory();
            long freeDisk = runtime.freeMemory();
            long usedDisk = totalDisk - freeDisk;
            double diskUsage = (double) usedDisk / totalDisk * 100;
            
            Map<String, Object> metrics = new HashMap<>();
            metrics.put("cpuUsage", cpuUsage);
            metrics.put("memoryUsage", memoryUsage);
            metrics.put("memoryUsed", usedMemory);
            metrics.put("memoryTotal", totalMemory);
            metrics.put("jvmMemoryUsage", jvmMemoryUsage);
            metrics.put("jvmMemoryUsed", jvmMemoryUsed);
            metrics.put("jvmMemoryMax", jvmMemoryMax);
            metrics.put("diskUsage", diskUsage);
            metrics.put("timestamp", LocalDateTime.now());
            
            return ResponseEntity.ok(ApiResponse.success(metrics));
            
        } catch (Exception e) {
            log.error("현재 시스템 메트릭 조회 실패", e);
            return ResponseEntity.ok(ApiResponse.error("현재 시스템 메트릭 조회 실패: " + e.getMessage()));
        }
    }
    
    /**
     * 시스템 메트릭 히스토리 조회
     * 
     * @param metricType 메트릭 타입 (CPU_LOAD, MEMORY_USAGE, JVM_MEMORY)
     * @param minutes 조회 기간 (분, 기본 60분)
     * @return 메트릭 히스토리
     */
    @GetMapping("/history")
    @PreAuthorize("hasAnyRole('ADMIN', 'HQ_MASTER')")
    public ResponseEntity<ApiResponse<List<SystemMetric>>> getMetricsHistory(
            @RequestParam String metricType,
            @RequestParam(defaultValue = "60") int minutes
    ) {
        try {
            log.info("시스템 메트릭 히스토리 조회: metricType={}, minutes={}", metricType, minutes);
            
            LocalDateTime since = LocalDateTime.now().minusMinutes(minutes);
            
            List<SystemMetric> metrics = systemMetricRepository
                .findByMetricTypeAndCollectedAtAfterOrderByCollectedAtDesc(metricType, since);
            
            return ResponseEntity.ok(ApiResponse.success(metrics));
            
        } catch (Exception e) {
            log.error("시스템 메트릭 히스토리 조회 실패", e);
            return ResponseEntity.ok(ApiResponse.error("시스템 메트릭 히스토리 조회 실패: " + e.getMessage()));
        }
    }
    
    /**
     * 시스템 메트릭 요약 통계
     * 
     * @param minutes 조회 기간 (분, 기본 60분)
     * @return 메트릭 요약 통계
     */
    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('ADMIN', 'HQ_MASTER')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMetricsSummary(
            @RequestParam(defaultValue = "60") int minutes
    ) {
        try {
            log.info("시스템 메트릭 요약 통계 조회: minutes={}", minutes);
            
            LocalDateTime since = LocalDateTime.now().minusMinutes(minutes);
            
            // CPU 통계
            List<SystemMetric> cpuMetrics = systemMetricRepository
                .findByMetricTypeAndCollectedAtAfterOrderByCollectedAtDesc("CPU_LOAD", since);
            
            double avgCpu = cpuMetrics.stream()
                .mapToDouble(SystemMetric::getMetricValue)
                .average()
                .orElse(0.0);
            
            double maxCpu = cpuMetrics.stream()
                .mapToDouble(SystemMetric::getMetricValue)
                .max()
                .orElse(0.0);
            
            // 메모리 통계
            List<SystemMetric> memoryMetrics = systemMetricRepository
                .findByMetricTypeAndCollectedAtAfterOrderByCollectedAtDesc("MEMORY_USAGE", since);
            
            double avgMemory = memoryMetrics.stream()
                .mapToDouble(SystemMetric::getMetricValue)
                .average()
                .orElse(0.0);
            
            double maxMemory = memoryMetrics.stream()
                .mapToDouble(SystemMetric::getMetricValue)
                .max()
                .orElse(0.0);
            
            // JVM 메모리 통계
            List<SystemMetric> jvmMetrics = systemMetricRepository
                .findByMetricTypeAndCollectedAtAfterOrderByCollectedAtDesc("JVM_MEMORY", since);
            
            double avgJvm = jvmMetrics.stream()
                .mapToDouble(SystemMetric::getMetricValue)
                .average()
                .orElse(0.0);
            
            double maxJvm = jvmMetrics.stream()
                .mapToDouble(SystemMetric::getMetricValue)
                .max()
                .orElse(0.0);
            
            Map<String, Object> summary = new HashMap<>();
            summary.put("cpu", Map.of("avg", avgCpu, "max", maxCpu, "count", cpuMetrics.size()));
            summary.put("memory", Map.of("avg", avgMemory, "max", maxMemory, "count", memoryMetrics.size()));
            summary.put("jvm", Map.of("avg", avgJvm, "max", maxJvm, "count", jvmMetrics.size()));
            summary.put("period", minutes);
            
            return ResponseEntity.ok(ApiResponse.success(summary));
            
        } catch (Exception e) {
            log.error("시스템 메트릭 요약 통계 조회 실패", e);
            return ResponseEntity.ok(ApiResponse.error("시스템 메트릭 요약 통계 조회 실패: " + e.getMessage()));
        }
    }
}

