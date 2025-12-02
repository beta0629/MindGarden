package com.coresolution.core.service;

import com.coresolution.core.domain.AiAnomalyDetection;
import com.coresolution.core.domain.SystemMetric;
import com.coresolution.core.repository.AiAnomalyDetectionRepository;
import com.coresolution.core.repository.SystemMetricRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

/**
 * AI 이상 탐지 서비스
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-12-02
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AnomalyDetectionService {
    
    private final SystemMetricRepository systemMetricRepository;
    private final AiAnomalyDetectionRepository anomalyDetectionRepository;
    
    // 임계값 설정
    private static final double CPU_THRESHOLD = 80.0; // 80%
    private static final double MEMORY_THRESHOLD = 85.0; // 85%
    private static final double JVM_THRESHOLD = 90.0; // 90%
    
    /**
     * 이상 탐지 실행 (5분마다)
     */
    @Scheduled(fixedRate = 300000) // 5분
    public void detectAnomalies() {
        try {
            log.debug("🔍 이상 탐지 시작");
            
            detectCpuAnomaly();
            detectMemoryAnomaly();
            detectJvmAnomaly();
            
            log.debug("✅ 이상 탐지 완료");
        } catch (Exception e) {
            log.error("❌ 이상 탐지 실패", e);
        }
    }
    
    /**
     * CPU 이상 탐지
     */
    private void detectCpuAnomaly() {
        try {
            LocalDateTime since = LocalDateTime.now().minusMinutes(10);
            List<SystemMetric> metrics = systemMetricRepository
                .findByMetricTypeAndCollectedAtAfterOrderByCollectedAtDesc("CPU_LOAD", since);
            
            if (metrics.isEmpty()) {
                return;
            }
            
            // 최근 평균 계산
            double avgValue = metrics.stream()
                .mapToDouble(SystemMetric::getMetricValue)
                .average()
                .orElse(0.0);
            
            // 임계값 초과 확인
            if (avgValue > CPU_THRESHOLD) {
                double anomalyScore = Math.min(avgValue / 100.0, 1.0);
                String severity = getSeverity(anomalyScore);
                
                AiAnomalyDetection anomaly = AiAnomalyDetection.builder()
                    .tenantId(null) // 시스템 전체
                    .detectionType("PERFORMANCE")
                    .anomalyScore(anomalyScore)
                    .severity(severity)
                    .metricType("CPU_LOAD")
                    .metricValue(avgValue)
                    .expectedValue(CPU_THRESHOLD)
                    .deviation(avgValue - CPU_THRESHOLD)
                    .modelUsed("STATISTICAL")
                    .detectedAt(LocalDateTime.now())
                    .build();
                
                anomalyDetectionRepository.save(anomaly);
                log.warn("⚠️ CPU 이상 탐지: avgValue={}, threshold={}, severity={}", 
                    String.format("%.2f", avgValue), CPU_THRESHOLD, severity);
            }
        } catch (Exception e) {
            log.error("CPU 이상 탐지 실패", e);
        }
    }
    
    /**
     * 메모리 이상 탐지
     */
    private void detectMemoryAnomaly() {
        try {
            LocalDateTime since = LocalDateTime.now().minusMinutes(10);
            List<SystemMetric> metrics = systemMetricRepository
                .findByMetricTypeAndCollectedAtAfterOrderByCollectedAtDesc("MEMORY_USAGE", since);
            
            if (metrics.isEmpty()) {
                return;
            }
            
            double avgValue = metrics.stream()
                .mapToDouble(SystemMetric::getMetricValue)
                .average()
                .orElse(0.0);
            
            if (avgValue > MEMORY_THRESHOLD) {
                double anomalyScore = Math.min(avgValue / 100.0, 1.0);
                String severity = getSeverity(anomalyScore);
                
                AiAnomalyDetection anomaly = AiAnomalyDetection.builder()
                    .tenantId(null)
                    .detectionType("PERFORMANCE")
                    .anomalyScore(anomalyScore)
                    .severity(severity)
                    .metricType("MEMORY_USAGE")
                    .metricValue(avgValue)
                    .expectedValue(MEMORY_THRESHOLD)
                    .deviation(avgValue - MEMORY_THRESHOLD)
                    .modelUsed("STATISTICAL")
                    .detectedAt(LocalDateTime.now())
                    .build();
                
                anomalyDetectionRepository.save(anomaly);
                log.warn("⚠️ 메모리 이상 탐지: avgValue={}, threshold={}, severity={}", 
                    String.format("%.2f", avgValue), MEMORY_THRESHOLD, severity);
            }
        } catch (Exception e) {
            log.error("메모리 이상 탐지 실패", e);
        }
    }
    
    /**
     * JVM 메모리 이상 탐지
     */
    private void detectJvmAnomaly() {
        try {
            LocalDateTime since = LocalDateTime.now().minusMinutes(10);
            List<SystemMetric> metrics = systemMetricRepository
                .findByMetricTypeAndCollectedAtAfterOrderByCollectedAtDesc("JVM_MEMORY", since);
            
            if (metrics.isEmpty()) {
                return;
            }
            
            double avgValue = metrics.stream()
                .mapToDouble(SystemMetric::getMetricValue)
                .average()
                .orElse(0.0);
            
            if (avgValue > JVM_THRESHOLD) {
                double anomalyScore = Math.min(avgValue / 100.0, 1.0);
                String severity = getSeverity(anomalyScore);
                
                AiAnomalyDetection anomaly = AiAnomalyDetection.builder()
                    .tenantId(null)
                    .detectionType("PERFORMANCE")
                    .anomalyScore(anomalyScore)
                    .severity(severity)
                    .metricType("JVM_MEMORY")
                    .metricValue(avgValue)
                    .expectedValue(JVM_THRESHOLD)
                    .deviation(avgValue - JVM_THRESHOLD)
                    .modelUsed("STATISTICAL")
                    .detectedAt(LocalDateTime.now())
                    .build();
                
                anomalyDetectionRepository.save(anomaly);
                log.warn("⚠️ JVM 메모리 이상 탐지: avgValue={}, threshold={}, severity={}", 
                    String.format("%.2f", avgValue), JVM_THRESHOLD, severity);
            }
        } catch (Exception e) {
            log.error("JVM 메모리 이상 탐지 실패", e);
        }
    }
    
    /**
     * 심각도 계산
     */
    private String getSeverity(double anomalyScore) {
        if (anomalyScore >= 0.95) return "CRITICAL";
        if (anomalyScore >= 0.90) return "HIGH";
        if (anomalyScore >= 0.85) return "MEDIUM";
        return "LOW";
    }
    
    /**
     * 이상 해결 처리
     */
    public void resolveAnomaly(Long anomalyId) {
        try {
            AiAnomalyDetection anomaly = anomalyDetectionRepository.findById(anomalyId)
                .orElseThrow(() -> new IllegalArgumentException("이상 탐지 결과를 찾을 수 없습니다: " + anomalyId));
            
            anomaly.setResolvedAt(LocalDateTime.now());
            anomalyDetectionRepository.save(anomaly);
            
            log.info("✅ 이상 해결 처리: anomalyId={}", anomalyId);
        } catch (Exception e) {
            log.error("이상 해결 처리 실패: anomalyId={}", anomalyId, e);
        }
    }
}

