package com.coresolution.core.service;

import com.coresolution.core.config.AIMonitoringConfig;
import com.coresolution.core.domain.AiAnomalyDetection;
import com.coresolution.core.domain.SystemMetric;
import com.coresolution.core.repository.AiAnomalyDetectionRepository;
import com.coresolution.core.repository.SystemMetricRepository;
import com.coresolution.core.service.OpenAIMonitoringService.AnomalyAnalysisResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * AI 이상 탐지 서비스 (하이브리드 방식)
 * 
 * 전략:
 * 1. 1차 필터링: 통계 기반 임계값 체크 (빠르고 저렴)
 * 2. 2차 분석: 의심스러운 경우에만 AI 분석 (정확하지만 비용 발생)
 * 3. 비용 관리: 일일 호출 제한, 쿨다운 적용
 * 
 * @author CoreSolution
 * @version 2.0.0 (Hybrid)
 * @since 2025-12-02
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AnomalyDetectionService {
    
    private final SystemMetricRepository systemMetricRepository;
    private final AiAnomalyDetectionRepository anomalyDetectionRepository;
    private final AIMonitoringConfig aiConfig;
    private final ConfigurableApplicationContext applicationContext;
    private final DataSource dataSource;
    
    @Autowired(required = false)
    private OpenAIMonitoringService openAIMonitoringService;
    
    // 연속 위반 카운터 (메트릭 타입별)
    private final Map<String, Integer> consecutiveViolations = new HashMap<>();
    
    // 마지막 AI 호출 시간 (메트릭 타입별)
    private final Map<String, LocalDateTime> lastAICall = new HashMap<>();
    
    // 일일 AI 호출 카운터
    private final AtomicInteger dailyAICallCount = new AtomicInteger(0);
    private LocalDateTime lastResetDate = LocalDateTime.now();
    
    // 임계값 설정
    private static final double CPU_THRESHOLD = 80.0; // 80%
    private static final double MEMORY_THRESHOLD = 85.0; // 85%
    private static final double JVM_THRESHOLD = 90.0; // 90%
    
    /**
     * 이상 탐지 실행 (5분마다)
     */
    @Scheduled(fixedRate = 300000) // 5분
    public void detectAnomalies() {
        if (!applicationContext.isActive()) {
            return;
        }
        AtomicBoolean closedResourceWarned = new AtomicBoolean(false);
        if (!validateDataSourceAvailable(closedResourceWarned)) {
            return;
        }
        try {
            log.debug("🔍 이상 탐지 시작");
            
            detectCpuAnomaly(closedResourceWarned);
            detectMemoryAnomaly(closedResourceWarned);
            detectJvmAnomaly(closedResourceWarned);
            
            log.debug("✅ 이상 탐지 완료");
        } catch (Exception e) {
            handleScheduledDataAccess("이상 탐지", e, closedResourceWarned);
        }
    }

    private boolean validateDataSourceAvailable(AtomicBoolean closedResourceWarned) {
        try (Connection ignored = dataSource.getConnection()) {
            return true;
        } catch (SQLException e) {
            handleScheduledDataAccess("이상 탐지(DB 연결 확인)", e, closedResourceWarned);
            return false;
        }
    }

    private void handleScheduledDataAccess(String operation, Throwable e, AtomicBoolean closedResourceWarned) {
        if (isDataSourceClosedMessage(e)) {
            if (closedResourceWarned.compareAndSet(false, true)) {
                log.warn("{} 건너뜀: 애플리케이션 종료 중 DB 리소스가 닫혔습니다.", operation, e);
            }
            return;
        }
        log.error("{} 실패", operation, e);
    }

    private boolean isDataSourceClosedMessage(Throwable throwable) {
        for (Throwable t = throwable; t != null; t = t.getCause()) {
            String msg = t.getMessage();
            if (msg != null && msg.toLowerCase().contains("has been closed")) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * CPU 이상 탐지 (하이브리드 방식)
     * 1단계: 통계 기반 필터링
     * 2단계: 조건 충족 시 AI 분석
     */
    private void detectCpuAnomaly(AtomicBoolean closedResourceWarned) {
        detectAnomalyHybrid("CPU_LOAD", CPU_THRESHOLD, 
            aiConfig.getHybrid().getStatisticalThreshold().getCpu(), closedResourceWarned);
    }
    
    /**
     * 하이브리드 이상 탐지 핵심 로직
     */
    private void detectAnomalyHybrid(String metricType, double criticalThreshold, double aiTriggerThreshold,
            AtomicBoolean closedResourceWarned) {
        try {
            LocalDateTime since = LocalDateTime.now().minusMinutes(10);
            List<SystemMetric> metrics = systemMetricRepository
                .findByMetricTypeAndCollectedAtAfterOrderByCollectedAtDesc(metricType, since);
            
            if (metrics.isEmpty()) {
                resetConsecutiveViolations(metricType);
                return;
            }
            
            // 평균값 계산
            double avgValue = metrics.stream()
                .mapToDouble(SystemMetric::getMetricValue)
                .average()
                .orElse(0.0);
            
            // 1단계: 통계 기반 필터링
            if (avgValue < aiTriggerThreshold) {
                // 정상 범위 - 아무것도 안 함
                resetConsecutiveViolations(metricType);
                return;
            }
            
            // 2단계: AI 분석 필요성 판단
            boolean shouldUseAI = shouldTriggerAIAnalysis(metricType, avgValue, criticalThreshold);
            
            if (shouldUseAI && openAIMonitoringService != null && aiConfig.isEnabled()) {
                // AI 기반 분석
                try {
                    AnomalyAnalysisResult aiResult = openAIMonitoringService.analyzeAnomalies(metrics, metricType);
                    
                    if (aiResult != null && aiResult.hasAnomaly()) {
                        saveAnomalyDetection(metricType, avgValue, criticalThreshold, 
                            aiResult.getAnomalyScore(), aiResult.getSeverity(), 
                            "OPENAI_GPT", aiResult.getAnalysis(), aiResult.getRecommendation());
                        
                        log.warn("🤖 AI {} 이상 탐지: avgValue={}, score={}, severity={}", 
                            metricType, String.format("%.2f", avgValue), 
                            aiResult.getAnomalyScore(), aiResult.getSeverity());
                        
                        updateLastAICall(metricType);
                        incrementDailyAICallCount();
                        resetConsecutiveViolations(metricType);
                        return;
                    } else {
                        // AI가 정상으로 판단 - 연속 위반 리셋
                        resetConsecutiveViolations(metricType);
                        log.info("✅ AI 분석 결과: {} 정상 (avgValue={})", metricType, String.format("%.2f", avgValue));
                        return;
                    }
                } catch (Exception e) {
                    log.warn("AI 분석 실패, 통계 기반으로 대체: {}", e.getMessage());
                }
            }
            
            // 3단계: 통계 기반 분석 (AI 미사용 또는 실패 시)
            if (avgValue > criticalThreshold) {
                double anomalyScore = Math.min(avgValue / 100.0, 1.0);
                String severity = getSeverity(anomalyScore);
                
                saveAnomalyDetection(metricType, avgValue, criticalThreshold, 
                    anomalyScore, severity, "STATISTICAL", null, null);
                
                log.warn("📊 통계 기반 {} 이상 탐지: avgValue={}, threshold={}, severity={}", 
                    metricType, String.format("%.2f", avgValue), criticalThreshold, severity);
                
                incrementConsecutiveViolations(metricType);
            } else {
                // AI 트리거 임계값은 넘었지만 치명적 임계값은 안 넘음
                incrementConsecutiveViolations(metricType);
                log.info("⚠️ {} 주의 필요: avgValue={} (임계값: {})", 
                    metricType, String.format("%.2f", avgValue), aiTriggerThreshold);
            }
            
        } catch (Exception e) {
            handleScheduledDataAccess(metricType + " 이상 탐지", e, closedResourceWarned);
        }
    }
    
    /**
     * AI 분석 트리거 여부 판단
     */
    private boolean shouldTriggerAIAnalysis(String metricType, double avgValue, double criticalThreshold) {
        // AI 모니터링이 비활성화된 경우
        if (!aiConfig.isEnabled() || !aiConfig.getHybrid().isEnabled()) {
            return false;
        }
        
        // 일일 호출 제한 확인
        if (isDailyLimitReached()) {
            log.warn("⚠️ AI 호출 일일 제한 도달: {}/{}", 
                dailyAICallCount.get(), aiConfig.getCostControl().getDailyLimit());
            return false;
        }
        
        // 쿨다운 확인
        if (isInCooldown(metricType)) {
            log.debug("⏰ {} AI 분석 쿨다운 중", metricType);
            return false;
        }
        
        // 연속 위반 횟수 확인
        int violations = consecutiveViolations.getOrDefault(metricType, 0);
        int requiredViolations = aiConfig.getHybrid().getAiTrigger().getConsecutiveViolations();
        
        if (violations < requiredViolations) {
            log.debug("📈 {} 연속 위반: {}/{}", metricType, violations, requiredViolations);
            return false;
        }
        
        return true;
    }
    
    /**
     * 이상 탐지 결과 저장
     */
    private void saveAnomalyDetection(String metricType, double avgValue, double expectedValue,
                                     double anomalyScore, String severity, String modelUsed,
                                     String aiAnalysis, String aiRecommendation) {
        AiAnomalyDetection anomaly = AiAnomalyDetection.builder()
            .tenantId(null)
            .detectionType("PERFORMANCE")
            .anomalyScore(anomalyScore)
            .severity(severity)
            .metricType(metricType)
            .metricValue(avgValue)
            .expectedValue(expectedValue)
            .deviation(avgValue - expectedValue)
            .modelUsed(modelUsed)
            .aiAnalysis(aiAnalysis)
            .aiRecommendation(aiRecommendation)
            .detectedAt(LocalDateTime.now())
            .build();
        
        anomalyDetectionRepository.save(anomaly);
    }
    
    /**
     * 연속 위반 증가
     */
    private void incrementConsecutiveViolations(String metricType) {
        consecutiveViolations.put(metricType, 
            consecutiveViolations.getOrDefault(metricType, 0) + 1);
    }
    
    /**
     * 연속 위반 리셋
     */
    private void resetConsecutiveViolations(String metricType) {
        consecutiveViolations.put(metricType, 0);
    }
    
    /**
     * 마지막 AI 호출 시간 업데이트
     */
    private void updateLastAICall(String metricType) {
        lastAICall.put(metricType, LocalDateTime.now());
    }
    
    /**
     * 쿨다운 확인
     */
    private boolean isInCooldown(String metricType) {
        LocalDateTime lastCall = lastAICall.get(metricType);
        if (lastCall == null) {
            return false;
        }
        
        int cooldownMinutes = aiConfig.getHybrid().getAiTrigger().getCooldownMinutes();
        return LocalDateTime.now().isBefore(lastCall.plusMinutes(cooldownMinutes));
    }
    
    /**
     * 일일 호출 제한 확인
     */
    private boolean isDailyLimitReached() {
        // 날짜가 바뀌면 카운터 리셋
        if (lastResetDate.toLocalDate().isBefore(LocalDateTime.now().toLocalDate())) {
            dailyAICallCount.set(0);
            lastResetDate = LocalDateTime.now();
        }
        
        return dailyAICallCount.get() >= aiConfig.getCostControl().getDailyLimit();
    }
    
    /**
     * 일일 AI 호출 카운터 증가
     */
    private void incrementDailyAICallCount() {
        int count = dailyAICallCount.incrementAndGet();
        int limit = aiConfig.getCostControl().getDailyLimit();
        
        if (count >= limit * aiConfig.getCostControl().getAlertThreshold() / 100) {
            log.warn("⚠️ AI 호출 횟수 {}% 도달: {}/{}", 
                aiConfig.getCostControl().getAlertThreshold(), count, limit);
        }
    }
    
    /**
     * 메모리 이상 탐지 (하이브리드 방식)
     */
    private void detectMemoryAnomaly(AtomicBoolean closedResourceWarned) {
        detectAnomalyHybrid("MEMORY_USAGE", MEMORY_THRESHOLD, 
            aiConfig.getHybrid().getStatisticalThreshold().getMemory(), closedResourceWarned);
    }
    
    /**
     * JVM 메모리 이상 탐지 (하이브리드 방식)
     */
    private void detectJvmAnomaly(AtomicBoolean closedResourceWarned) {
        detectAnomalyHybrid("JVM_MEMORY", JVM_THRESHOLD, 
            aiConfig.getHybrid().getStatisticalThreshold().getJvm(), closedResourceWarned);
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

